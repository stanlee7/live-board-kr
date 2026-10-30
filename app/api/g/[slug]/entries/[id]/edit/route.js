import { NextResponse } from "next/server";
import { codeOk, getEntry, MAX_HTML, replaceHtml, saveEntry } from "@/lib/gstore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg, status = 400) => NextResponse.json({ error: msg }, { status });

// 수정 코드(숫자 4자리)가 맞으면 제목, 소개, HTML 파일을 바꾸거나 작품을 내림
export async function POST(req, { params }) {
  const { slug, id } = await params;
  const e = await getEntry(id);
  if (!e || e.gallery !== slug || e.hidden) return bad("작품을 찾을 수 없습니다.", 404);
  const f = await req.formData();
  if (!codeOk(String(f.get("code") || ""), e.codeHash)) return bad("수정 코드가 맞지 않습니다.", 403);
  if (String(f.get("action") || "") === "check") return NextResponse.json({ ok: true });
  if (String(f.get("action") || "") === "delete") { e.hidden = true; await saveEntry(e); return NextResponse.json({ ok: true, deleted: true }); }
  const title = String(f.get("title") || "").trim(), intro = String(f.get("intro") || "").trim();
  if (!title || !intro || title.length > 80 || intro.length > 400) return bad("제목과 소개를 확인해 주세요. (제목 80자, 소개 400자)");
  e.title = title; e.intro = intro;
  const file = f.get("file");
  if (file && typeof file !== "string" && file.size) {
    if (!/\.html?$/i.test(file.name)) return bad("HTML 파일(.html)만 올릴 수 있습니다.");
    if (file.size > MAX_HTML) return bad("HTML 파일은 900KB 이하로 올려 주세요.");
    await replaceHtml(id, Buffer.from(await file.arrayBuffer()).toString("utf8"));
    e.hasHtml = true; e.url = null;
  }
  e.updatedAt = new Date().toISOString();
  await saveEntry(e);
  return NextResponse.json({ ok: true });
}
