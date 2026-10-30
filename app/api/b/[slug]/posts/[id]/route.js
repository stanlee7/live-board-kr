import { updatePost, getHtml } from "../../../../../../lib/store";
import { isAdmin, json } from "../../../../../../lib/auth";

export const dynamic = "force-dynamic";

// HTML 본문(미리보기용). 화면에서는 sandbox iframe의 srcdoc으로만 그린다
export async function GET(req, { params }) {
  const { id } = await params;
  const html = await getHtml(id);
  if (html == null) return json({ error: "없거나 보관 기간이 지난 파일입니다" }, 404);
  return json({ html });
}

// 강사: 숨기기/보이기
export async function PATCH(req, { params }) {
  const { slug, id } = await params;
  if (!isAdmin(req)) return json({ error: "강사 키가 맞지 않습니다" }, 401);
  const b = await req.json().catch(() => ({}));
  const ok = await updatePost(slug, id, { hidden: Boolean(b.hidden) });
  return ok ? json({ ok: true }) : json({ error: "없는 글입니다" }, 404);
}

export async function DELETE(req, { params }) {
  const { slug, id } = await params;
  if (!isAdmin(req)) return json({ error: "강사 키가 맞지 않습니다" }, 401);
  const ok = await updatePost(slug, id, null);
  return ok ? json({ ok: true }) : json({ error: "없는 글입니다" }, 404);
}
