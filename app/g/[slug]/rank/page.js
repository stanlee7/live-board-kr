import Link from "next/link";
import { notFound } from "next/navigation";
import { findGallery } from "@/lib/galleries";
import { listEntries } from "@/lib/gstore";
import { Crumb, Shell } from "../../../_gx/Shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const g = findGallery((await params).slug);
  return { title: g ? `좋아요 순위 | ${g.title}` : "결과물 전시관", robots: { index: false, follow: false } };
}

export default async function Rank({ params }) {
  const g = findGallery((await params).slug);
  if (!g) notFound();
  const list = (await listEntries(g.slug)).sort((a, b) => (b.likes || 0) - (a.likes || 0) || a.createdAt.localeCompare(b.createdAt));
  return (
    <Shell>
      <Crumb folder={g.folder} gallery={g} tail="좋아요 순위" />
      <h1 className="gx-title">좋아요 순위</h1>
      <p className="gx-meta">{g.title} · 결과물 {list.length}건 · 새로고침하면 최신 순위가 보입니다</p>
      {list.length === 0 ? <div className="gx-empty">아직 제출된 결과물이 없습니다.</div> : (
        <div style={{ overflowX: "auto" }}>
          <table className="gx-rank">
            <thead><tr><th>순위</th><th>프로젝트 제목</th><th>이름</th><th>팀/부서</th><th>좋아요</th></tr></thead>
            <tbody>
              {list.map((e, i) => (
                <tr key={e.id} className={i < 3 ? "top" : ""}>
                  <td className="n">{i + 1}</td>
                  <td><Link href={`/g/${g.slug}/gallery/${e.id}`}>{e.title}</Link></td>
                  <td>{e.name}</td>
                  <td>{e.team}</td>
                  <td>♥ {e.likes || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}
