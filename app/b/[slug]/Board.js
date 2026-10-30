"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import QRCode from "qrcode";

// 올린 HTML은 sandbox iframe(srcdoc)으로만 그린다. allow-same-origin을 주지 않아 이 사이트의 저장값에 손대지 못한다
const SANDBOX = "allow-scripts allow-forms allow-popups";
const POLL_MS = 3000;
const ls = {
  get: k => { try { return localStorage.getItem(k) || ""; } catch { return ""; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};
const ago = t => {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "방금";
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  return new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
};

export default function Board({ slug }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [html, setHtml] = useState({});
  const [fresh, setFresh] = useState({});
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(null);
  const [qr, setQr] = useState("");
  const [tab, setTab] = useState("*");
  const [view, setView] = useState("time");
  const [q, setQ] = useState("");
  const [drag, setDrag] = useState(false);
  const [dropFile, setDropFile] = useState(null);
  const [copied, setCopied] = useState(false);
  const seen = useRef(null);
  const loading = useRef(new Set());
  const key = ls.get("liveboard-admin");

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/b/${slug}`, { headers: key ? { "x-admin-key": key } : {}, cache: "no-store" });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "불러오지 못했습니다"); return; }
      setErr("");
      // 처음 이후에 새로 생긴 글은 잠깐 테두리로 표시
      if (seen.current) {
        const added = j.posts.filter(p => !seen.current.has(p.id)).map(p => p.id);
        if (added.length) { setFresh(f => { const n = { ...f }; added.forEach(id => (n[id] = true)); return n; }); setTimeout(() => setFresh(f => { const n = { ...f }; added.forEach(id => delete n[id]); return n; }), 8000); }
      }
      seen.current = new Set(j.posts.map(p => p.id));
      setData(j);
      // 첫 화면의 「최근 보드」 목록에 남긴다
      try { const r = JSON.parse(ls.get("liveboard-recent") || "[]").filter(x => x.slug !== slug); r.unshift({ slug, title: j.board.title, at: Date.now() }); ls.set("liveboard-recent", JSON.stringify(r.slice(0, 12))); } catch {}
    } catch { setErr("연결이 잠깐 끊겼습니다. 자동으로 다시 시도합니다"); }
  }, [slug, key]);

  useEffect(() => { load(); const t = setInterval(() => { if (!document.hidden) load(); }, POLL_MS); return () => clearInterval(t); }, [load]);
  useEffect(() => { QRCode.toDataURL(location.href, { margin: 1, width: 240 }).then(setQr).catch(() => {}); }, []);

  // 새 HTML 글의 본문을 한 번씩만 받아 둔다
  useEffect(() => {
    if (!data) return;
    for (const p of data.posts) {
      if (p.kind !== "html" || html[p.id] != null || loading.current.has(p.id)) continue;
      loading.current.add(p.id);
      fetch(`/api/b/${slug}/posts/${p.id}`).then(r => r.json()).then(j => setHtml(h => ({ ...h, [p.id]: j.html ?? "" }))).finally(() => loading.current.delete(p.id));
    }
  }, [data, slug, html]);

  const admin = async (p, method, body) => {
    if (method === "DELETE" && !confirm(`「${p.project}」 글을 지울까요?`)) return;
    await fetch(`/api/b/${slug}/posts/${p.id}`, { method, headers: { "x-admin-key": key, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    load();
  };
  const download = p => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html[p.id] || ""], { type: "text/html" }));
    a.download = p.fileName || `${p.project}.html`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  if (!data) return <main className="wrap"><p>{err || "불러오는 중…"}</p></main>;
  const { board, posts } = data;
  const shown = posts.filter(p => (tab === "*" || p.column === tab) && (!q || `${p.project} ${p.name} ${p.text}`.toLowerCase().includes(q.toLowerCase())));
  const htmlPosts = shown.filter(p => p.kind === "html");
  // 프로젝트별: 같은 프로젝트명끼리 묶고 최근에 올린 프로젝트가 위로
  const groups = [];
  if (view === "project") {
    const m = new Map();
    for (const p of shown) { const k = p.project.trim(); if (!m.has(k)) { m.set(k, []); groups.push(k); } m.get(k).push(p); }
    groups.forEach((k, i) => (groups[i] = [k, m.get(k)]));
  }
  const card = p => (
    <article key={p.id} className={`card${fresh[p.id] ? " new" : ""}${p.hidden ? " hid" : ""}`}>
      {p.kind === "html" && (
        <div className="thumb" onClick={() => setFull(p)} title="크게 보기">
          {html[p.id] != null ? <iframe sandbox={SANDBOX} srcDoc={html[p.id]} title={p.project} loading="lazy" /> : <p style={{ padding: 12 }}>불러오는 중…</p>}
          <span className="hint">눌러서 크게</span>
        </div>
      )}
      <div className="meta">
        <div><b>{p.project}</b><small>{p.name} · {p.column} · {ago(p.createdAt)}{p.hidden ? " · 숨김" : ""}</small></div>
        <div className="tools">
          {p.kind === "html" && <button onClick={() => download(p)}>받기</button>}
          {data.admin && <button onClick={() => admin(p, "PATCH", { hidden: !p.hidden })}>{p.hidden ? "보이기" : "숨기기"}</button>}
          {data.admin && <button onClick={() => admin(p, "DELETE")}>지우기</button>}
        </div>
      </div>
      {p.text && <div className="txt">{p.text}</div>}
    </article>
  );
  const step = d => { const i = htmlPosts.findIndex(p => p.id === full?.id); const n = htmlPosts[i + d]; if (n) setFull(n); };

  return (
    <main className="wrap"
      onDragOver={e => { if (board.open) { e.preventDefault(); setDrag(true); } }}
      onDragLeave={e => { if (e.currentTarget === e.target) setDrag(false); }}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f && board.open) { setDropFile(f); setOpen(true); } }}>
      <div className="top">
        <div>
          <h1>{board.title}</h1>
          <p>{board.open ? "HTML 파일을 이 화면에 끌어다 놓거나 「올리기」를 누르세요. 올리면 모두의 화면에 바로 보입니다." : "지금은 올리기가 닫혀 있습니다"}</p>
          {err && <p className="err">{err}</p>}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {qr && <div className="qr"><img src={qr} alt="이 보드 QR" /><span>휴대폰으로<br />들어오기</span></div>}
          <button className="btn ghost" onClick={() => { navigator.clipboard?.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "복사됨" : "주소 복사"}</button>
          <button className="btn big" disabled={!board.open} onClick={() => setOpen(true)}>+ 올리기</button>
        </div>
      </div>

      <div className="bar">
        <div className="chips">
          {[["*", "전체", posts.length], ...board.columns.map(c => [c, c, posts.filter(p => p.column === c).length])].map(([k, label, n]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{label} <span>{n}</span></button>
          ))}
        </div>
        <div className="chips">
          <button className={view === "time" ? "on" : ""} onClick={() => setView("time")}>최신순</button>
          <button className={view === "project" ? "on" : ""} onClick={() => setView("project")}>프로젝트별</button>
          <input className="search" value={q} onChange={e => setQ(e.target.value)} placeholder="프로젝트, 이름 찾기" />
        </div>
      </div>

      {shown.length === 0 && (
        <button className="drop" disabled={!board.open} onClick={() => setOpen(true)}>
          <b>아직 올라온 것이 없습니다</b><br />HTML 파일을 이 화면에 끌어다 놓거나 눌러서 올리세요
        </button>
      )}
      {view === "time" && <div className="grid">{shown.map(card)}</div>}
      {view === "project" && groups.map(([name, list]) => (
        <section key={name} className="group">
          <h2>{name} <span>{list.length}건 · {[...new Set(list.map(p => p.name))].join(", ")}</span></h2>
          <div className="grid">{list.map(card)}</div>
        </section>
      ))}
      {drag && <div className="dropover">여기에 놓으면 올리기 창이 열립니다</div>}

      {open && <Upload board={board} slug={slug} initialFile={dropFile} defaultColumn={tab !== "*" ? tab : board.columns[0]} onClose={() => { setOpen(false); setDropFile(null); }} onDone={() => { setOpen(false); setDropFile(null); load(); }} />}
      {full && (
        <div className="full" tabIndex={-1} ref={el => el && el.focus()} onKeyDown={e => { if (e.key === "Escape") setFull(null); if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); }}>
          <header>
            <b>{full.project} · {full.name}</b>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn ghost" onClick={() => step(-1)}>← 이전</button>
              <button className="btn ghost" onClick={() => step(1)}>다음 →</button>
              <button className="btn ghost" onClick={() => download(full)}>받기</button>
              <button className="btn" onClick={() => setFull(null)}>닫기</button>
            </div>
          </header>
          <iframe sandbox={SANDBOX} srcDoc={html[full.id] || ""} title={full.project} />
        </div>
      )}
    </main>
  );
}

function Upload({ board, slug, initialFile, defaultColumn, onClose, onDone }) {
  const [project, setProject] = useState(ls.get("liveboard-project") || (initialFile ? initialFile.name.replace(/.html?$/i, "") : ""));
  const [name, setName] = useState(ls.get("liveboard-name"));
  const [column, setColumn] = useState(defaultColumn || board.columns[0]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(initialFile || null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // 파일을 고르면 프로젝트명이 비어 있을 때만 파일 이름으로 채운다
  const pickFile = f => { setFile(f); if (f && !project.trim()) setProject(f.name.replace(/.html?$/i, "")); };

  const send = async e => {
    e.preventDefault();
    if (!project.trim() || !name.trim()) return setErr("프로젝트명과 성함을 써 주세요");
    if (!file && !text.trim()) return setErr("HTML 파일을 고르거나 글을 써 주세요");
    setBusy(true); setErr("");
    ls.set("liveboard-project", project); ls.set("liveboard-name", name);
    const f = new FormData();
    f.append("project", project); f.append("name", name); f.append("column", column); f.append("text", text);
    if (file) f.append("file", file);
    const r = await fetch(`/api/b/${slug}/posts`, { method: "POST", body: f });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "올리지 못했습니다");
    onDone();
  };

  return (
    <div className="modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <form className="sheet" onSubmit={send}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); }}>
        <h3>올리기</h3>
        <label className="field">프로젝트명 *<input value={project} onChange={e => setProject(e.target.value)} maxLength={60} placeholder="예: 설문 대시보드" required /></label>
        <label className="field">성함 *<input value={name} onChange={e => setName(e.target.value)} maxLength={30} required /></label>
        <label className="field">칸<select value={column} onChange={e => setColumn(e.target.value)}>{board.columns.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="field">HTML 파일 (여기로 끌어다 놓아도 됩니다)<input type="file" accept=".html,.htm,text/html" onChange={e => pickFile(e.target.files?.[0] || null)} /></label>
        {file && <p style={{ fontSize: 13, margin: "-6px 0 10px" }}>{file.name} · {Math.ceil(file.size / 1024)}KB</p>}
        <label className="field">한 줄 설명이나 질문 (선택)<textarea rows={3} value={text} onChange={e => setText(e.target.value)} maxLength={2000} /></label>
        <p style={{ fontSize: 12, color: "var(--sub)", margin: "0 0 10px" }}>학생 개인정보나 미공개 자료가 든 파일은 올리지 마세요. 올린 파일은 이 보드를 아는 모두가 봅니다.</p>
        {err && <p className="err">{err}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn ghost" onClick={onClose}>취소</button>
          <button className="btn" disabled={busy}>{busy ? "올리는 중…" : "올리기"}</button>
        </div>
      </form>
    </div>
  );
}
