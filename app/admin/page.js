"use client";
import { useEffect, useState } from "react";

const ls = {
  get: k => { try { return localStorage.getItem(k) || ""; } catch { return ""; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

export default function Admin() {
  const [key, setKey] = useState("");
  const [boards, setBoards] = useState(null);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ slug: "", title: "", columns: "결과물, 질문" });

  useEffect(() => { setKey(ls.get("liveboard-admin")); }, []);
  const call = (url, opt = {}) => fetch(url, { ...opt, headers: { "x-admin-key": key, "content-type": "application/json", ...(opt.headers || {}) } }).then(async r => ({ ok: r.ok, j: await r.json().catch(() => ({})) }));
  const load = async () => {
    const { ok, j } = await call("/api/boards");
    if (!ok) { setErr(j.error); setBoards(null); return; }
    setErr(""); setBoards(j.boards); ls.set("liveboard-admin", key);
  };
  const create = async e => {
    e.preventDefault();
    const { ok, j } = await call("/api/boards", { method: "POST", body: JSON.stringify(form) });
    if (!ok) return setErr(j.error);
    setForm({ slug: "", title: "", columns: form.columns }); load();
  };
  const toggle = async b => { await call(`/api/b/${b.slug}`, { method: "PATCH", body: JSON.stringify({ open: !b.open }) }); load(); };
  const remove = async b => { if (!confirm(`「${b.title}」 보드와 글을 모두 지울까요?`)) return; await call(`/api/b/${b.slug}`, { method: "DELETE" }); load(); };

  return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <h1>강사 화면</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="강사 키" style={{ flex: 1, border: "1.5px solid var(--line)", borderRadius: 10, padding: "10px 12px" }} />
        <button className="btn" onClick={load}>확인</button>
      </div>
      {err && <p className="err">{err}</p>}
      {boards && (
        <>
          <form onSubmit={create} className="row" style={{ display: "block" }}>
            <b>새 보드</b>
            <label className="field">주소 (영문 소문자, 숫자, -)<input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="gnu-1022" required /></label>
            <label className="field">제목<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="경남대 1일차 결과물" /></label>
            <label className="field">칸 (쉼표로 구분, 최대 6개)<input value={form.columns} onChange={e => setForm({ ...form, columns: e.target.value })} /></label>
            <button className="btn">만들기</button>
          </form>
          <h2 style={{ fontSize: 18 }}>보드 {boards.length}개</h2>
          <div className="list">
            {boards.map(b => (
              <div className="row" key={b.slug}>
                <div><b>{b.title}</b><br /><a href={`/b/${b.slug}`} target="_blank">/b/{b.slug}</a> · {b.columns.join(", ")} · {b.open ? "올리기 열림" : "닫힘"}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn ghost" onClick={() => toggle(b)}>{b.open ? "닫기" : "열기"}</button>
                  <button className="btn ghost" onClick={() => remove(b)}>지우기</button>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "var(--sub)" }}>글과 파일은 30일 뒤 자동으로 지워집니다. 보드 화면에서 강사 키가 저장된 브라우저는 글마다 숨기기, 지우기 단추가 보입니다.</p>
        </>
      )}
    </main>
  );
}
