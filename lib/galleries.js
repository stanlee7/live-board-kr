// 결과물 전시관 설정 (워카 전시관과 같은 흐름: 폴더 → 전시관 → 제출, 둘러보기, 좋아요 순위)
// 전시관을 추가하려면 여기에 한 줄 넣고 다시 배포합니다. kind: html(파일 또는 URL), url(URL만)
export const FOLDERS = [
  {
    slug: "sinokor-busan-2",
    client: "장금상선그룹",
    round: "부산 2차",
    course: "AI Agent 교육",
    period: "2026-10-19 ~ 2026-11-11",
    galleries: [
      { slug: "sinokor-busan-2-service", title: "내 업무 서비스 (2일차 복습)", kind: "html", note: "PRD 한 장으로 만든, 입력한 내용이 남고 엑셀로 내려받을 수 있는 업무 서비스" },
      { slug: "sinokor-busan-2-dashboard", title: "업무 대시보드 (2일차)", kind: "html", note: "엑셀 파일을 넣으면 다시 그려지는 업무 대시보드. 넣어 볼 엑셀은 테스트용 첨부파일로 함께 올려 주세요" },
    ],
  },
  {
    slug: "sinokor-busan-3",
    client: "장금상선그룹",
    round: "부산 3차",
    course: "AI Agent 교육",
    period: "2026-10-21 ~ 2026-11-18",
    galleries: [
      { slug: "sinokor-busan-3-service", title: "내 업무 서비스 (2일차 복습)", kind: "html", note: "PRD 한 장으로 만든, 입력한 내용이 남고 엑셀로 내려받을 수 있는 업무 서비스" },
      { slug: "sinokor-busan-3-dashboard", title: "업무 대시보드 (2일차)", kind: "html", note: "엑셀 파일을 넣으면 다시 그려지는 업무 대시보드. 넣어 볼 엑셀은 테스트용 첨부파일로 함께 올려 주세요" },
    ],
  },
];

export function findFolder(slug) { return FOLDERS.find(f => f.slug === slug) || null; }
export function findGallery(slug) {
  for (const f of FOLDERS) { const g = f.galleries.find(x => x.slug === slug); if (g) return { ...g, folder: f }; }
  return null;
}
