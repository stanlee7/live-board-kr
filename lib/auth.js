// 강사 키: Vercel 환경변수 ADMIN_KEY. 내 PC 시험에서는 ADMIN_KEY가 없으면 "dev"
export function isAdmin(req) {
  const want = process.env.ADMIN_KEY || (process.env.VERCEL ? null : "dev");
  if (!want) return false;
  return req.headers.get("x-admin-key") === want;
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export const slugOk = s => /^[a-z0-9][a-z0-9-]{1,39}$/.test(s || "");
