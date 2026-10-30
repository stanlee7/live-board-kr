import { getAtt, getEntry } from "@/lib/gstore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const { slug, id, n } = await params;
  const e = await getEntry(id);
  if (!e || e.gallery !== slug || e.hidden) return new Response("Not found", { status: 404 });
  const a = await getAtt(id, Number(n));
  if (!a) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(a.b64, "base64"), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(a.name)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
