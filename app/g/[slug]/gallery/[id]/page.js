import Link from "next/link";
import { notFound } from "next/navigation";
import { findGallery } from "@/lib/galleries";
import { getEntry } from "@/lib/gstore";
import { Crumb, Shell } from "../../../../_gx/Shell";
import LikeButton from "../../../../_gx/LikeButton";
import EditBox from "./EditBox";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug, id } = await params;
  const e = await getEntry(id);
  return { title: e ? `${e.title} | 결과물 전시관` : "결과물 전시관", robots: { index: false, follow: false } };
}

export default async function Detail({ params, searchParams }) {
  const { slug, id } = await params;
  const g = findGallery(slug);
  const e = await getEntry(id);
  if (!g || !e || e.gallery !== slug || e.hidden) notFound();
  const isNew = (await searchParams)?.new === "1";
  const src = `/api/g/${slug}/entries/${id}/content`;
  return (
    <Shell>
      <Crumb folder={g.folder} gallery={g} tail={e.title} />
      {isNew && <div className="gx-ok" style={{ marginTop: 12 }}>제출되었습니다. 고칠 게 있으면 아래 「내 작품 수정」에서 수정 코드로 바꿀 수 있어요.</div>}
      <div className="gx-info">
        <div style={{ minWidth: 0 }}>
          <span className="gx-pill">{e.team}</span>
          <h1 className="gx-title">{e.title}</h1>
          <div className="gx-sub">{e.name}</div>
          <p className="gx-intro">{e.intro}</p>
          {e.atts?.length > 0 && (
            <div className="gx-atts">
              {e.atts.map((a, i) => <a key={i} className="gx-btn ghost small" href={`/api/g/${slug}/entries/${id}/att/${i}`}>⬇ {a.name}</a>)}
            </div>
          )}
        </div>
        <div className="gx-row" style={{ marginTop: 6 }}>
          <LikeButton slug={slug} id={id} initial={e.likes || 0} />
          {e.hasHtml ? <a className="gx-btn ghost small" href={src} target="_blank" rel="noopener">새 창으로 크게 보기</a>
            : <a className="gx-btn ghost small" href={e.url} target="_blank" rel="noopener noreferrer">사이트 열기 ↗</a>}
          <EditBox slug={slug} id={id} title={e.title} intro={e.intro} />
        </div>
      </div>
      {e.hasHtml ? (
        <div className="gx-view"><iframe src={src} sandbox="allow-scripts allow-downloads allow-modals allow-popups allow-forms" title={e.title} /></div>
      ) : (
        <div className="gx-empty">URL로 제출된 결과물입니다. <a href={e.url} target="_blank" rel="noopener noreferrer">{e.url}</a></div>
      )}
      <p className="gx-sub" style={{ marginTop: 14 }}><Link href={`/g/${slug}/gallery`}>← 전시관으로</Link></p>
    </Shell>
  );
}
