import Board from "./Board";

export default async function Page({ params }) {
  const { slug } = await params;
  return <Board slug={slug} />;
}
