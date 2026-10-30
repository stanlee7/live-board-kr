import { NextResponse } from "next/server";
import { addLike, getEntry } from "@/lib/gstore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 같은 브라우저에서 작품당 한 번 (쿠키)
export async function POST(req, { params }) {
  const { slug, id } = await params;
  const e = await getEntry(id);
  if (!e || e.gallery !== slug) return NextResponse.json({ error: "not found" }, { status: 404 });
  const ck = `gxl_${id}`;
  if (req.cookies.get(ck)) return NextResponse.json({ likes: e.likes || 0, already: true });
  const likes = await addLike(id);
  const res = NextResponse.json({ likes });
  res.cookies.set(ck, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
