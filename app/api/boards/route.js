import { listBoards, saveBoard, getBoard, storageReady, rateOk } from "../../../lib/store";
import { isAdmin, json, slugOk } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!isAdmin(req)) return json({ error: "강사 키가 맞지 않습니다" }, 401);
  if (!storageReady()) return json({ error: "저장소(Upstash Redis)가 연결되지 않았습니다" }, 503);
  return json({ boards: await listBoards() });
}

// 보드 만들기는 누구나(첫 화면). 주소를 비우면 자동으로 만든다. 숨기기, 지우기, 닫기만 강사 키
export async function POST(req) {
  if (!storageReady()) return json({ error: "저장소(Upstash Redis)가 연결되지 않았습니다" }, 503);
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (!isAdmin(req) && !(await rateOk("mk-" + ip))) return json({ error: "잠시 뒤에 다시 만들어 주세요" }, 429);
  const b = await req.json().catch(() => ({}));
  let slug = String(b.slug || "").trim().toLowerCase();
  if (!slug) slug = "b-" + Math.random().toString(36).slice(2, 8);
  if (!slugOk(slug)) return json({ error: "주소는 영문 소문자, 숫자, - 로 2~40자입니다" }, 400);
  if (await getBoard(slug)) return json({ error: "이미 있는 주소입니다" }, 409);
  const columns = (Array.isArray(b.columns) ? b.columns : String(b.columns || "").split(","))
    .map(s => String(s).trim()).filter(Boolean).slice(0, 6);
  const board = {
    slug,
    title: String(b.title || slug).slice(0, 80),
    note: String(b.note || "").slice(0, 300),
    columns: columns.length ? columns : ["결과물", "질문"],
    open: true,
    createdAt: Date.now(),
  };
  await saveBoard(board);
  return json({ board });
}
