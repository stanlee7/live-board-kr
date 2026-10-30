"use client";
import { useRef, useState } from "react";

export default function SubmitForm({ slug, kind }) {
  const [mode, setMode] = useState(kind === "url" ? "url" : "file");
  const [file, setFile] = useState(null);
  const [atts, setAtts] = useState([]);
  const [title, setTitle] = useState("");
  const [intro, setIntro] = useState("");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileIn = useRef(null), attIn = useRef(null);

  function pickHtml(list) {
    const f = [...(list || [])].find(x => /\.html?$/i.test(x.name));
    if (!f) { setErr("HTML 파일(.html)을 골라 주세요."); return; }
    if (f.size > 900 * 1024) { setErr("HTML 파일이 900KB보다 큽니다. AI에게 '파일 크기를 900KB 아래로 줄여줘'라고 해 보세요."); return; }
    setErr(""); setFile(f);
  }
  function addAtts(list) {
    const next = [...atts];
    for (const f of list || []) {
      if (next.length >= 3) { setErr("테스트용 첨부파일은 최대 3개입니다."); break; }
      if (f.size > 600 * 1024) { setErr(`첨부파일은 각 600KB 이하로 올려 주세요: ${f.name}`); continue; }
      next.push(f);
    }
    setAtts(next);
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setErr("");
    const fd = new FormData(e.currentTarget);
    fd.set("mode", mode);
    if (mode === "file") { if (!file) { setErr("HTML 파일을 선택해 주세요."); return; } fd.set("file", file); }
    fd.delete("atts"); atts.forEach(a => fd.append("atts", a));
    setBusy(true);
    try {
      const r = await fetch(`/api/g/${slug}/entries`, { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j.error || "제출하지 못했습니다. 잠시 뒤 다시 시도해 주세요."); setBusy(false); return; }
      location.href = `/g/${slug}/gallery/${j.id}?new=1`;
    } catch { setErr("네트워크 오류로 제출하지 못했습니다. 다시 눌러 주세요."); setBusy(false); }
  }

  return (
    <form className="gx-form" onSubmit={submit}>
      {err && <div className="gx-err">{err}</div>}
      <div className="gx-f"><label htmlFor="n">이름 <em>*</em></label><input id="n" type="text" name="name" required maxLength={40} /></div>
      <div className="gx-f"><label htmlFor="t">팀/부서 <em>*</em></label><input id="t" type="text" name="team" required maxLength={60} /></div>
      <div className="gx-f"><label htmlFor="p">프로젝트 제목 <em>*</em></label><input id="p" type="text" name="title" required maxLength={80} value={title} onChange={e => setTitle(e.target.value)} /><span className="cnt">{title.length}/80자</span></div>
      <div className="gx-f"><label htmlFor="i">간단 소개 <em>*</em></label><textarea id="i" name="intro" required maxLength={400} value={intro} onChange={e => setIntro(e.target.value)} /><span className="cnt">{intro.length}/400자</span></div>

      <div className="gx-f">
        <label>HTML 파일 <em>*</em></label>
        {kind !== "url" && (
          <div className="gx-tabs">
            <button type="button" className={mode === "file" ? "on" : ""} onClick={() => setMode("file")}>HTML 파일 첨부</button>
            <button type="button" className={mode === "url" ? "on" : ""} onClick={() => setMode("url")}>URL 주소 입력</button>
          </div>
        )}
        {mode === "file" ? (
          <>
            <div className={"gx-drop" + (drag ? " on" : "")} onClick={() => fileIn.current?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); pickHtml(e.dataTransfer.files); }}>
              {file ? <><b>{file.name}</b><br />{Math.round(file.size / 1024)}KB · 다른 파일로 바꾸려면 다시 누르세요</> : <>HTML 파일을 끌어다 놓거나 클릭해서 선택</>}
            </div>
            <input ref={fileIn} type="file" accept=".html,.htm" hidden onChange={e => pickHtml(e.target.files)} />
            <span className="help">파일 1개 · 최대 900KB · 이미지까지 파일 안에 담긴 완성본</span>
          </>
        ) : (
          <input type="url" name="url" placeholder="https://" required />
        )}
      </div>

      {kind !== "url" && (
        <div className="gx-f">
          <label>웹페이지 테스트용 첨부파일 (선택 · 최대 3개)</label>
          <span className="help">결과물 실행에 더미 파일(실습용 데이터)이 필요하다면 함께 올려 주세요. 보는 사람이 내려받아 직접 넣어 볼 수 있습니다.</span>
          <button type="button" className="gx-btn ghost small" style={{ alignSelf: "flex-start" }} onClick={() => attIn.current?.click()}>테스트용 파일 첨부하기</button>
          <input ref={attIn} type="file" multiple hidden onChange={e => { addAtts(e.target.files); e.target.value = ""; }} />
          {atts.length > 0 && <div className="gx-atts">{atts.map((a, i) => (
            <span key={i} className="gx-pill" style={{ cursor: "pointer" }} onClick={() => setAtts(atts.filter((_, k) => k !== i))}>{a.name} ✕</span>
          ))}</div>}
          <span className="help">파일당 최대 600KB · 데이터, 문서, 이미지 파일</span>
        </div>
      )}

      <div className="gx-f">
        <label htmlFor="c">수정 코드 <em>*</em></label>
        <span className="help">제출 후 수정할 때 쓰는 본인 확인용 · 숫자 4자리, 기억하기 쉽게 정해 주세요.</span>
        <input id="c" type="password" name="code" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required style={{ maxWidth: 160 }} />
      </div>
      <button className="gx-btn" disabled={busy}>{busy ? "제출하는 중..." : "제출하기"}</button>
    </form>
  );
}
