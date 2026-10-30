// 전시관 저장소: Upstash Redis(라이브 보드와 같은 저장소, 키 앞에 gx:) 또는 메모리(내 PC 시험)
// 키: gx:ids:<gallery>(작품 id 목록, 최신이 앞), gx:e:<id>(작품 정보), gx:h:<id>(HTML 본문), gx:a:<id>:<n>(첨부 base64)
import { Redis } from "@upstash/redis";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;
export const storeReady = () => Boolean(redis) || !process.env.VERCEL;

export const KEEP_DAYS = 120;
const TTL = KEEP_DAYS * 24 * 3600;
export const MAX_HTML = 900 * 1024;      // Upstash 한 번 요청 1MB 한도 안
export const MAX_ATT = 600 * 1024;       // base64로 늘어나도 1MB 안
export const MAX_ATT_COUNT = 3;

const mem = globalThis.__gxMem || (globalThis.__gxMem = { kv: new Map(), lists: new Map() });
const parse = v => (v == null ? null : typeof v === "string" ? JSON.parse(v) : v);

async function get(k) { return redis ? await redis.get(k) : (mem.kv.has(k) ? mem.kv.get(k) : null); }
async function set(k, v) { if (redis) return redis.set(k, v, { ex: TTL }); mem.kv.set(k, v); }
async function del(k) { if (redis) return redis.del(k); mem.kv.delete(k); }
async function lpush(k, v) { if (redis) { await redis.lpush(k, v); return redis.expire(k, TTL); } const l = mem.lists.get(k) || []; l.unshift(v); mem.lists.set(k, l); }
async function lrange(k) { return redis ? ((await redis.lrange(k, 0, 1999)) || []) : (mem.lists.get(k) || []); }

export const hashCode = code => createHash("sha256").update(String(code)).digest("hex");
export function codeOk(code, hash) {
  const a = Buffer.from(hashCode(code), "hex"), b = Buffer.from(String(hash || ""), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function listEntries(gallery) {
  const ids = await lrange(`gx:ids:${gallery}`);
  if (!ids.length) return [];
  let rows;
  if (redis) rows = await redis.mget(...ids.map(id => `gx:e:${id}`));
  else rows = ids.map(id => mem.kv.get(`gx:e:${id}`));
  return rows.map(parse).filter(e => e && !e.hidden);
}
export async function getEntry(id) { return parse(await get(`gx:e:${id}`)); }
export async function getHtml(id) { return await get(`gx:h:${id}`); }
export async function getAtt(id, n) { return parse(await get(`gx:a:${id}:${n}`)); }

export async function createEntry(gallery, info, html, atts) {
  const id = randomUUID().replace(/-/g, "").slice(0, 16);
  const entry = { id, gallery, ...info, likes: 0, createdAt: new Date().toISOString(), atts: atts.map(a => ({ name: a.name, size: a.size, type: a.type })) };
  if (html != null) await set(`gx:h:${id}`, html);
  for (let i = 0; i < atts.length; i++) await set(`gx:a:${id}:${i}`, JSON.stringify({ name: atts[i].name, type: atts[i].type, b64: atts[i].b64 }));
  await set(`gx:e:${id}`, JSON.stringify(entry));
  await lpush(`gx:ids:${gallery}`, id);
  return entry;
}
export async function saveEntry(entry) { await set(`gx:e:${entry.id}`, JSON.stringify(entry)); }
export async function replaceHtml(id, html) { if (html == null) await del(`gx:h:${id}`); else await set(`gx:h:${id}`, html); }

export async function addLike(id) {
  if (redis) {
    const n = await redis.incr(`gx:l:${id}`); await redis.expire(`gx:l:${id}`, TTL);
    const e = await getEntry(id); if (e) { e.likes = n; await saveEntry(e); }
    return n;
  }
  const e = await getEntry(id); if (!e) return 0; e.likes = (e.likes || 0) + 1; await saveEntry(e); return e.likes;
}

// 같은 주소에서 10분에 30건까지 제출
export async function submitRateOk(ip) {
  const k = `gx:rate:${ip}`;
  if (redis) { const n = await redis.incr(k); if (n === 1) await redis.expire(k, 600); return n <= 30; }
  const n = (mem.kv.get(k) || 0) + 1; mem.kv.set(k, n); return n <= 30;
}
