"use client";
import { useEffect, useState } from "react";

export default function LikeButton({ slug, id, initial }) {
  const [n, setN] = useState(initial);
  const [on, setOn] = useState(false);
  useEffect(() => { try { if (localStorage.getItem(`gxl_${id}`)) setOn(true); } catch {} }, [id]);
  async function like() {
    if (on) return;
    setOn(true); setN(x => x + 1);
    try {
      const r = await fetch(`/api/g/${slug}/entries/${id}/like`, { method: "POST" });
      const j = await r.json();
      if (r.ok) { setN(j.likes); try { localStorage.setItem(`gxl_${id}`, "1"); } catch {} }
    } catch {}
  }
  return <button type="button" className={"gx-like" + (on ? " on" : "")} onClick={like} aria-pressed={on}>♥ 좋아요 {n}</button>;
}
