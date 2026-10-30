import Link from "next/link";
import { notFound } from "next/navigation";
import { findFolder } from "@/lib/galleries";
import { listEntries } from "@/lib/gstore";
import { Shell } from "../../_gx/Shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const f = findFolder((await params).folder);
  return { title: f ? `${f.client} · ${f.round} | 결과물 전시관` : "결과물 전시관", robots: { index: false, follow: false } };
}

export default async function FolderPage({ params }) {
  const f = findFolder((await params).folder);
  if (!f) notFound();
  const counts = await Promise.all(f.galleries.map(g => listEntries(g.slug).then(r => r.length)));
  const total = counts.reduce((a, b) => a + b, 0);
  return (
    <Shell>
      <div className="gx-crumb">{f.client} › {f.round}</div>
      <h1 className="gx-title">{f.client} · {f.round}</h1>
      <p className="gx-sub">{f.course}</p>
      <p className="gx-meta">{f.period} · 전시관 {f.galleries.length}개 · 결과물 {total}건</p>
      <div className="gx-grid">
        {f.galleries.map((g, i) => (
          <section className="gx-card" key={g.slug}>
            <span className="gx-pill">{g.kind === "url" ? "URL 결과물" : "웹 결과물"}</span>
            <h3>{g.title}</h3>
            <div className="muted">{g.note}</div>
            <div className="muted">결과물 {counts[i]}건</div>
            <div className="gx-row">
              <Link className="gx-btn" href={`/g/${g.slug}`}>제출하기</Link>
              <Link className="gx-btn ghost" href={`/g/${g.slug}/gallery`}>전시관 열기 →</Link>
              <Link className="gx-btn ghost small" href={`/g/${g.slug}/rank`}>좋아요 순위</Link>
            </div>
          </section>
        ))}
      </div>
    </Shell>
  );
}
