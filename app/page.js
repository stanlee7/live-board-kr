"use client";
import { useEffect, useState } from "react";

const box = { flex: 1, border: "1.5px solid var(--line)", borderRadius: 10, padding: "10px 12px", width: "100%" };

export default function Home() {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [columns, setColumns] = useState("결과물, 질문");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState([]);
  useEffect(() => { try { setRecent(JSON.parse(localStorage.getItem("liveboard-recent") || "[]")); } catch {} }, []);

  const go = e => { e.preventDefault(); const s = code.trim().toLowerCase(); if (s) location.href = `/b/${encodeURIComponent(s)}`; };
  const make = async e => {
    e.preventDefault();
    if (!title.trim()) return setErr("보드 제목을 써 주세요");
    setBusy(true); setErr("");
    const r = await fetch("/api/boards", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, columns }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "만들지 못했습니다");
    location.href = `/b/${j.board.slug}`;
  };

  return (
    <main className="wrap" style={{ maxWidth: 520, paddingTop: 60 }}>
      <h1 style={{ margin: 0 }}>라이브 보드</h1>
      <p style={{ color: "var(--sub)" }}>HTML 결과물을 올리면 모두의 화면에 바로 보입니다.</p>

      {recent.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <b>최근 보드</b>
          <div className="recent">{recent.map(r => <a key={r.slug} href={`/b/${r.slug}`}>{r.title}<small>{new Date(r.at).toLocaleDateString("ko-KR")}</small></a>)}</div>
        </section>
      )}

      <form onSubmit={make} className="row" style={{ display: "block", marginTop: 24 }}>
        <b>새 보드 만들기</b>
        <label className="field">보드 제목<input style={box} value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 장금상선 3차 결과물" /></label>
        <label className="field">칸 (쉼표로 구분)<input style={box} value={columns} onChange={e => setColumns(e.target.value)} /></label>
        {err && <p className="err">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? "만드는 중…" : "만들기"}</button>
        <p style={{ fontSize: 13, color: "var(--sub)", margin: "10px 0 0" }}>만들면 보드 화면으로 넘어갑니다. 그 주소나 오른쪽 위 QR을 수강생에게 보여 주세요.</p>
      </form>

      <form onSubmit={go} style={{ display: "flex", gap: 8, marginTop: 24 }}>
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="받은 보드 주소로 들어가기" style={box} />
        <button className="btn ghost">들어가기</button>
      </form>
      <p style={{ marginTop: 40, fontSize: 13 }}><a href="/admin">관리 (글 숨기기, 보드 지우기)</a></p>
    </main>
  );
}
