"use client";
import { useState } from "react";

export default function EditBox({ slug, id, title, intro }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("code");
  const [code, setCode] = useState("");
  const [t, setT] = useState(title);
  const [i, setI] = useState(intro);
  const [file, setFile] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(action) {
    setErr(""); setBusy(true);
    const fd = new FormData();
    fd.set("code", code); fd.set("action", action); fd.set("title", t); fd.set("intro", i);
    if (file) fd.set("file", file);
    const r = await fetch(`/api/g/${slug}/entries/${id}/edit`, { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error || "처리하지 못했습니다."); return; }
    if (action === "check") setStep("form");
    else if (j.deleted) location.href = `/g/${slug}/gallery`;
    else location.reload();
  }

  if (!open) return <button type="button" className="gx-btn ghost small" onClick={() => setOpen(true)}>내 작품 수정</button>;
  return (
    <div className="gx-sheet" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div>
        <h3 style={{ marginTop: 0 }}>내 작품 수정</h3>
        {err && <div className="gx-err">{err}</div>}
        {step === "code" ? (
          <>
            <div className="gx-f"><label>수정 코드 (숫자 4자리)</label><input type="password" inputMode="numeric" maxLength={4} value={code} onChange={e => setCode(e.target.value)} style={{ maxWidth: 160 }} /></div>
            <div className="gx-row"><button className="gx-btn" disabled={busy || code.length !== 4} onClick={() => send("check")}>확인</button><button className="gx-btn ghost" onClick={() => setOpen(false)}>닫기</button></div>
          </>
        ) : (
          <>
            <div className="gx-f"><label>프로젝트 제목</label><input type="text" maxLength={80} value={t} onChange={e => setT(e.target.value)} /></div>
            <div className="gx-f"><label>간단 소개</label><textarea maxLength={400} value={i} onChange={e => setI(e.target.value)} /></div>
            <div className="gx-f"><label>HTML 파일 바꾸기 (선택)</label><input type="file" accept=".html,.htm" onChange={e => setFile(e.target.files?.[0] || null)} /><span className="help">비워 두면 지금 파일 그대로입니다. 최대 900KB.</span></div>
            <div className="gx-row">
              <button className="gx-btn" disabled={busy} onClick={() => send("save")}>{busy ? "저장 중..." : "저장"}</button>
              <button className="gx-btn ghost" onClick={() => setOpen(false)}>닫기</button>
              <button className="gx-btn ghost small" style={{ marginLeft: "auto", color: "#b42318" }} disabled={busy} onClick={() => { if (window.confirm("이 작품을 전시관에서 내릴까요?")) send("delete"); }}>작품 내리기</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
