"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import LikeButton from "../../../_gx/LikeButton";

export default function Grid({ slug, entries }) {
  const [sort, setSort] = useState("new");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    let r = entries.filter(e => !k || [e.title, e.name, e.team, e.intro].join(" ").toLowerCase().includes(k));
    r = [...r].sort((a, b) => sort === "like" ? (b.likes || 0) - (a.likes || 0) || b.createdAt.localeCompare(a.createdAt) : b.createdAt.localeCompare(a.createdAt));
    return r;
  }, [entries, sort, q]);

  if (!entries.length) return <div className="gx-empty">아직 제출된 결과물이 없습니다. 첫 번째로 올려 주세요!</div>;
  return (
    <>
      <div className="gx-sort">
        <button className={sort === "new" ? "on" : ""} onClick={() => setSort("new")}>최신순</button>
        <button className={sort === "like" ? "on" : ""} onClick={() => setSort("like")}>좋아요순</button>
        <input placeholder="제목, 이름, 팀 검색" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="gx-grid">
        {list.map(e => (
          <article className="gx-card" key={e.id}>
            <Link href={`/g/${slug}/gallery/${e.id}`} className="gx-thumb" aria-label={`${e.title} 열기`}>
              {e.hasHtml ? <iframe src={`/api/g/${slug}/entries/${e.id}/content`} sandbox="allow-scripts" loading="lazy" title={e.title} tabIndex={-1} /> : <div className="url">{e.url}</div>}
            </Link>
            <span className="gx-pill">{e.team}</span>
            <h3><Link href={`/g/${slug}/gallery/${e.id}`} style={{ color: "inherit", textDecoration: "none" }}>{e.title}</Link></h3>
            <div className="muted">{e.name}</div>
            <div className="muted" style={{ overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{e.intro}</div>
            <div className="gx-row">
              <LikeButton slug={slug} id={e.id} initial={e.likes || 0} />
              <Link className="gx-btn ghost small" href={`/g/${slug}/gallery/${e.id}`}>열어 보기</Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
