import Link from "next/link";
import { notFound } from "next/navigation";
import { findGallery } from "@/lib/galleries";
import { Crumb, Shell } from "../../_gx/Shell";
import SubmitForm from "./SubmitForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const g = findGallery((await params).slug);
  return { title: g ? `결과물 제출 | ${g.folder.client} ${g.title}` : "결과물 전시관", robots: { index: false, follow: false } };
}

export default async function SubmitPage({ params }) {
  const g = findGallery((await params).slug);
  if (!g) notFound();
  const f = g.folder;
  return (
    <Shell>
      <Crumb folder={f} gallery={g} tail="제출" />
      <p className="gx-sub" style={{ marginTop: 14 }}>{f.client}</p>
      <p className="gx-meta" style={{ margin: "0 0 4px" }}>{f.course} · {f.round} · {f.period}</p>
      <h1 className="gx-title">{g.title}</h1>
      <p className="gx-sub" style={{ marginBottom: 18 }}>프로젝트 결과물 제출 · <b style={{ color: "#d0283b" }}>*</b> 표시는 반드시 입력해야 하는 항목입니다.</p>
      <SubmitForm slug={g.slug} kind={g.kind} />
      <p className="gx-sub" style={{ marginTop: 18 }}>이미 제출하셨나요? 수정은 전시관에서 내 작품을 연 뒤 진행합니다. <Link href={`/g/${g.slug}/gallery`}>전시관 보기 ↗</Link></p>
    </Shell>
  );
}
