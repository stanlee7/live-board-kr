import Link from "next/link";
import "../gx.css";

export function Shell({ children }) {
  return (
    <>
      <div className="gx-head"><div className="in">
        <Link href="/" className="gx-logo"><i />결과물 전시관</Link>
      </div></div>
      <main className="gx">{children}</main>
    </>
  );
}

export function Crumb({ folder, gallery, tail }) {
  return (
    <div className="gx-crumb">
      <Link href={`/f/${folder.slug}`}>{folder.client} › {folder.round}</Link>
      {gallery && <> › <Link href={`/g/${gallery.slug}/gallery`}>{gallery.title}</Link></>}
      {tail && <> › {tail}</>}
    </div>
  );
}
