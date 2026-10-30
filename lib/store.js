// 저장소: Upstash Redis(환경변수가 있으면) 또는 메모리(내 PC에서 시험할 때).
// 키: boards(목록), board:<slug>(보드 설정), posts:<slug>(글 목록, 최신이 앞), html:<id>(HTML 본문), rate:<ip>(올리기 횟수)
import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
export const hasRedis = Boolean(url && token);
const redis = hasRedis ? new Redis({ url, token }) : null;

export const KEEP_DAYS = 30;
const TTL = KEEP_DAYS * 24 * 3600;

const mem = globalThis.__liveBoardMem || (globalThis.__liveBoardMem = { kv: new Map(), lists: new Map() });

export function storageReady() {
  // Vercel에서는 메모리 저장이 요청마다 사라지므로 Redis가 반드시 필요
  return hasRedis || !process.env.VERCEL;
}

async function get(key) {
  if (redis) return await redis.get(key);
  return mem.kv.has(key) ? mem.kv.get(key) : null;
}
async function set(key, val, ttl) {
  if (redis) return ttl ? redis.set(key, val, { ex: ttl }) : redis.set(key, val);
  mem.kv.set(key, val);
}
async function del(key) {
  if (redis) return redis.del(key);
  mem.kv.delete(key); mem.lists.delete(key);
}
async function lpush(key, val) {
  if (redis) { await redis.lpush(key, val); return redis.expire(key, TTL); }
  const l = mem.lists.get(key) || []; l.unshift(val); mem.lists.set(key, l);
}
async function lrange(key) {
  if (redis) return (await redis.lrange(key, 0, 999)) || [];
  return mem.lists.get(key) || [];
}
async function lset(key, list) {
  if (redis) {
    const p = redis.pipeline(); p.del(key);
    if (list.length) p.rpush(key, ...list);
    p.expire(key, TTL); await p.exec(); return;
  }
  mem.lists.set(key, [...list]);
}

const parse = v => (typeof v === "string" ? JSON.parse(v) : v);

export async function listBoards() {
  const slugs = parse(await get("boards")) || [];
  const out = [];
  for (const s of slugs) { const b = await getBoard(s); if (b) out.push(b); }
  return out;
}
export async function getBoard(slug) { return parse(await get(`board:${slug}`)); }
export async function saveBoard(board) {
  await set(`board:${board.slug}`, JSON.stringify(board), TTL);
  const slugs = parse(await get("boards")) || [];
  if (!slugs.includes(board.slug)) { slugs.unshift(board.slug); await set("boards", JSON.stringify(slugs.slice(0, 200))); }
}
export async function deleteBoard(slug) {
  const posts = await listPosts(slug);
  for (const p of posts) if (p.kind === "html") await del(`html:${p.id}`);
  await del(`board:${slug}`); await del(`posts:${slug}`);
  const slugs = (parse(await get("boards")) || []).filter(s => s !== slug);
  await set("boards", JSON.stringify(slugs));
}

export async function listPosts(slug) { return (await lrange(`posts:${slug}`)).map(parse); }
export async function addPost(slug, post, html) {
  if (html != null) await set(`html:${post.id}`, html, TTL);
  await lpush(`posts:${slug}`, JSON.stringify(post));
}
export async function updatePost(slug, id, patch) {
  const posts = await listPosts(slug);
  const i = posts.findIndex(p => p.id === id);
  if (i < 0) return null;
  if (patch === null) { posts.splice(i, 1); await del(`html:${id}`); }
  else posts[i] = { ...posts[i], ...patch };
  await lset(`posts:${slug}`, posts.map(p => JSON.stringify(p)));
  return true;
}
export async function getHtml(id) { return await get(`html:${id}`); }

// 같은 주소에서 10분에 40건까지
export async function rateOk(ip) {
  const key = `rate:${ip}`;
  if (redis) { const n = await redis.incr(key); if (n === 1) await redis.expire(key, 600); return n <= 40; }
  const n = (mem.kv.get(key) || 0) + 1; mem.kv.set(key, n); return n <= 40;
}
