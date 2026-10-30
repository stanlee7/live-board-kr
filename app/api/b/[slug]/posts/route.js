import { getBoard, addPost, rateOk, storageReady } from "../../../../../lib/store";
import { json } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

const MAX_HTML = 900 * 1024; // Upstash 무료 요청 한도(1MB) 안
const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

export async function POST(req, { params }) {
  const { slug } = await params;
  if (!storageReady()) return json({ error: "저장소가 연결되지 않았습니다" }, 503);
  const board = await getBoard(slug);
  if (!board) return json({ error: "없는 보드입니다" }, 404);
  if (!board.open) return json({ error: "강사가 올리기를 닫았습니다" }, 403);
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (!(await rateOk(ip))) return json({ error: "잠시 뒤에 다시 올려 주세요(10분에 40건까지)" }, 429);

  const form = await req.formData().catch(() => null);
  if (!form) return json({ error: "올린 내용을 읽지 못했습니다" }, 400);
  const project = clean(form.get("project"), 60);
  const name = clean(form.get("name"), 30);
  const column = clean(form.get("column"), 30);
  const text = String(form.get("text") || "").trim().slice(0, 2000);
  const file = form.get("file");

  if (!project || !name) return json({ error: "프로젝트명과 성함을 써 주세요" }, 400);
  if (!board.columns.includes(column)) return json({ error: "칸을 골라 주세요" }, 400);

  let html = null, fileName = "";
  if (file && typeof file === "object" && file.size > 0) {
    fileName = clean(file.name, 80);
    if (!/\.html?$/i.test(fileName)) return json({ error: "HTML 파일(.html)만 올릴 수 있습니다" }, 400);
    if (file.size > MAX_HTML) return json({ error: "파일이 900KB를 넘습니다. 이미지는 줄이거나 링크로 바꿔 주세요" }, 413);
    html = await file.text();
  }
  if (!html && !text) return json({ error: "HTML 파일이나 글 중 하나는 있어야 합니다" }, 400);

  const post = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    column, project, name, text, fileName,
    kind: html ? "html" : "text",
    size: html ? html.length : 0,
    createdAt: Date.now(),
    hidden: false,
  };
  await addPost(slug, post, html);
  return json({ post });
}
