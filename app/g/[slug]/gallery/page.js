import Link from "next/link";
import { notFound } from "next/navigation";
import { findGallery } from "@/lib/galleries";
import { listEntries } from "@/lib/gstore";
import { Crumb, Shell } from "../../../_gx/Shell";
import Grid from "./Grid";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const g = findGallery((await params).slug);
  return { title: g ? `전시관 | ${g.folder.client} ${g.title}` : "결과물 전시관", robots: { index: false, follow: false } };
}

export default async function GalleryPage({ params }) {
  const g = findGallery((await params).slug);
  if (!g) notFound();
  const entries = (await listEntries(g.slug)).map(({ codeHash, ...e }) => e);
  return (
    <Shell>
      <Crumb folder={g.folder} gallery={g} />
      <h1 className="gx-title">{g.title}</h1>
      <p className="gx-meta">{g.folder.course} · {g.folder.round} · 결과물 {entries.length}건</p>
      <div className="gx-row" style={{ marginBottom: 18 }}>
        <Link className="gx-btn" href={`/g/${g.slug}`}>내 결과물 제출</Link>
        <Link className="gx-btn ghost" href={`/g/${g.slug}/rank`}>좋아요 순위</Link>
      </div>
      <Grid slug={g.slug} entries={entries} />
    </Shell>
  );
}
