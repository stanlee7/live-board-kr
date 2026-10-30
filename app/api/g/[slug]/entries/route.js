import { NextResponse } from "next/server";
import { findGallery } from "@/lib/galleries";
import { createEntry, hashCode, MAX_ATT, MAX_ATT_COUNT, MAX_HTML, storeReady, submitRateOk } from "@/lib/gstore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg, status = 400) => NextResponse.json({ error: msg }, { status });
const ATT_EXT = /\.(xlsx|xls|csv|txt|json|md|pdf|png|jpg|jpeg|gif|webp|docx|pptx|hwp|hwpx)$/i;

export async function POST(req, { params }) {
  const { slug } = await params;
  const g = findGallery(slug);
  if (!g) return bad("전시관을 찾을 수 없습니다.", 404);
  if (!storeReady()) return bad("저장소가 연결되지 않았습니다. 강사에게 알려 주세요.", 503);
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (!(await submitRateOk(ip))) return bad("잠시 뒤에 다시 제출해 주세요.", 429);

  const f = await req.formData();
  const s = k => String(f.get(k) || "").trim();
  const name = s("name"), team = s("team"), title = s("title"), intro = s("intro"), code = s("code"), mode = s("mode") || "file", link = s("url");
  if (!name || !team || !title || !intro) return bad("* 표시 항목을 모두 입력해 주세요.");
  if (name.length > 40 || team.length > 60 || title.length > 80 || intro.length > 400) return bad("글자 수를 확인해 주세요. (제목 80자, 소개 400자)");
  if (!/^[0-9]{4}$/.test(code)) return bad("수정 코드는 숫자 4자리로 정해 주세요.");

  let html = null, urlOut = null;
  if (mode === "url" || g.kind === "url") {
    try { const u = new URL(link); if (!/^https?:$/.test(u.protocol)) throw 0; urlOut = u.toString(); }
    catch { return bad("올바른 URL 주소를 입력해 주세요. (https://로 시작)"); }
  } else {
    const file = f.get("file");
    if (!file || typeof file === "string" || !file.size) return bad("HTML 파일을 선택해 주세요.");
    if (!/\.html?$/i.test(file.name)) return bad("HTML 파일(.html)만 올릴 수 있습니다.");
    if (file.size > MAX_HTML) return bad("HTML 파일이 너무 큽니다. 900KB 이하로 올려 주세요. 이미지가 많다면 AI에게 '이미지를 줄여서 파일 크기를 900KB 아래로 맞춰줘'라고 해 보세요.");
    html = Buffer.from(await file.arrayBuffer()).toString("utf8");
  }

  const atts = [];
  for (const a of f.getAll("atts")) {
    if (!a || typeof a === "string" || !a.size) continue;
    if (atts.length >= MAX_ATT_COUNT) return bad("테스트용 첨부파일은 최대 3개입니다.");
    if (!ATT_EXT.test(a.name)) return bad(`첨부할 수 없는 파일 형식입니다: ${a.name}`);
    if (a.size > MAX_ATT) return bad(`첨부파일은 각 600KB 이하로 올려 주세요: ${a.name}`);
    atts.push({ name: a.name.slice(0, 120), size: a.size, type: a.type || "application/octet-stream", b64: Buffer.from(await a.arrayBuffer()).toString("base64") });
  }

  const entry = await createEntry(slug, { name, team, title, intro, url: urlOut, hasHtml: html != null, codeHash: hashCode(code) }, html, atts);
  return NextResponse.json({ id: entry.id });
}
