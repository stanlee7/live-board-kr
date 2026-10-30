import { getBoard, saveBoard, deleteBoard, listPosts, storageReady } from "../../../../lib/store";
import { isAdmin, json } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// 보드와 글 목록(HTML 본문은 빼고). 숨긴 글은 강사에게만
export async function GET(req, { params }) {
  const { slug } = await params;
  if (!storageReady()) return json({ error: "저장소가 연결되지 않았습니다" }, 503);
  const board = await getBoard(slug);
  if (!board) return json({ error: "없는 보드입니다" }, 404);
  const admin = isAdmin(req);
  const posts = (await listPosts(slug)).filter(p => admin || !p.hidden);
  return json({ board, posts, admin });
}

// 강사: 보드 열기/닫기, 칸 이름 바꾸기
export async function PATCH(req, { params }) {
  const { slug } = await params;
  if (!isAdmin(req)) return json({ error: "강사 키가 맞지 않습니다" }, 401);
  const board = await getBoard(slug);
  if (!board) return json({ error: "없는 보드입니다" }, 404);
  const b = await req.json().catch(() => ({}));
  if (typeof b.open === "boolean") board.open = b.open;
  if (typeof b.title === "string") board.title = b.title.slice(0, 80);
  if (typeof b.note === "string") board.note = b.note.slice(0, 300);
  await saveBoard(board);
  return json({ board });
}

export async function DELETE(req, { params }) {
  const { slug } = await params;
  if (!isAdmin(req)) return json({ error: "강사 키가 맞지 않습니다" }, 401);
  await deleteBoard(slug);
  return json({ ok: true });
}
