import "./globals.css";

export const metadata = {
  title: "라이브 보드",
  description: "강의 중 결과물을 바로 올리고 바로 보는 보드",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
