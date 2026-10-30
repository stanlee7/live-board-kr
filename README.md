# 라이브 보드 (live-board-kr.vercel.app)

강의 중 수강생이 HTML 결과물을 올리면 모두의 화면에 3초 안에 바로 보이는 보드. 패들렛 대체(2026-10-22).

- 올리기: 프로젝트명, 성함 필수 + HTML 파일(900KB까지) 또는 글. 칸은 보드마다 강사가 정함
- 보기: 3초마다 새 글을 불러옴. HTML은 sandbox iframe(srcdoc, allow-same-origin 없음)으로 그려서 올린 파일의 스크립트가 이 사이트 저장값에 손대지 못함
- 보드 만들기: 첫 화면에서 누구나(제목, 칸만). 주소는 자동
- 관리(강사 키 = 관리자 비밀번호, `.env.local`): `/admin`에서 올리기 열기/닫기, 보드 지우기. 키가 저장된 브라우저는 보드 화면에서 글 숨기기/지우기
- 보관: 글과 파일 30일 뒤 자동 삭제(Redis TTL)

## 설정 (Vercel 프로젝트 live-board-kr)
1. Storage → Upstash Redis 연결 (환경변수 KV_REST_API_URL, KV_REST_API_TOKEN이 자동으로 들어감)
2. Settings → Environment Variables → `ADMIN_KEY` (강사 키, 직접 정함. 문서와 대화에 적지 않음)
3. 다시 배포: `vercel deploy --prod --yes`

내 PC 시험: `npm run build && npm run start` → http://127.0.0.1:3210 (저장소 없이 메모리 저장, 강사 키 `dev`)
