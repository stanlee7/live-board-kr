import { getEntry, getHtml } from "@/lib/gstore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 미리보기 iframe(sandbox, allow-same-origin 없음)에서는 localStorage가 막혀 「새로고침해도 남게」 만든 서비스가 멈춤.
// 막혀 있으면 메모리 저장소로 바꿔 끼워서 화면은 그대로 동작하게 함(미리보기 안에서는 새로고침하면 지워짐)
const SHIM = `<script>(function(){function S(){var d={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}["localStorage","sessionStorage"].forEach(function(n){try{window[n].getItem("__t")}catch(e){try{Object.defineProperty(window,n,{value:S(),configurable:true})}catch(_){}}})})();</script>`;

const CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' https: blob:",
  "style-src 'unsafe-inline' https:",
  "img-src data: blob: https:",
  "font-src data: https:",
  "media-src data: blob: https:",
  "connect-src https: data: blob:",
  "worker-src blob:",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

export async function GET(_req, { params }) {
  const { slug, id } = await params;
  const e = await getEntry(id);
  if (!e || e.gallery !== slug || e.hidden) return new Response("Not found", { status: 404 });
  let html = await getHtml(id);
  if (html == null) return new Response("Not found", { status: 404 });
  html = String(html);
  const m = html.match(/<head[^>]*>/i);
  html = m ? html.replace(m[0], m[0] + SHIM) : SHIM + html;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": CSP + "; sandbox allow-scripts allow-downloads allow-modals allow-popups allow-forms",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "no-store",
    },
  });
}
