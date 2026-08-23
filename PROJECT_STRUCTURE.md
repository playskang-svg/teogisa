# 퇴직하고 부자되기 — 프로젝트 구조

작성일: 2026-08-11  
운영 주소: https://retire-rich-lab.sgk1.chatgpt.site  
관리자 주소: https://retire-rich-lab.sgk1.chatgpt.site/admin

## 1. 기술 구성

- 화면: React 19, Next.js 16 App Router
- 실행 환경: Vercel(Node 런타임) · 요청 전처리는 `proxy.ts`
- 데이터베이스: Supabase(PostgreSQL)
- 데이터 접근: 독립 저장소 계층. `lib/postgres-adapter.ts` 가 D1 형태의 호출을 Postgres 로 옮깁니다.
- 배포: Vercel(GitHub 연동)
- 관리자 인증: 사이트 자체 아이디·비밀번호, 서명된 보안 쿠키

## 2. 핵심 디렉터리

```text
.
├── app/                        # 화면과 서버 API
│   ├── admin/                  # 관리자 로그인·글 목록·편집기
│   ├── api/                    # 글, 자동발행, 백업, 세션 API
│   ├── components/             # 공통 화면과 글 이미지
│   ├── posts/[slug]/           # 공개 글 상세
│   ├── search/                 # 검색
│   ├── tools/                  # 퇴직자금 계산 도구
│   └── about, author, privacy  # 신뢰·정책 페이지
├── db/                         # D1/Drizzle 연결과 스키마
├── drizzle/                    # 재현 가능한 DB 마이그레이션
├── lib/                        # 콘텐츠, 저장소, 인증, SEO 보강
├── public/                     # 썸네일, OG 이미지, llms.txt
├── tests/                      # 렌더링·보안·SEO 회귀 테스트
├── proxy.ts                    # 도메인 정규화, 소유확인 파일, 자동화 따라잡기
└── vercel.json                 # 배포 설정과 cron
```

## 3. 주요 화면

- `/`: 홈, 추천 글, 카테고리, 신뢰 정보
- `/posts/[slug]`: 글 본문, 썸네일, 관련 글, 구조화 데이터
- `/search`: 제목·본문·태그 검색
- `/tools/retirement-runway`: 퇴직자금 지속기간 계산기
- `/admin/login`: 독립 관리자 로그인
- `/admin`: 글 작성·수정, 초안·예약·발행, 자동 포스팅 준비

## 4. 주요 API

- `GET/POST /api/posts`: 관리자용 전체 글 조회와 새 글 저장
- `PATCH /api/posts/[id]`: 기존 글 수정
- `GET/POST /api/automation`: 검토 대기열·스케줄러 상태 조회와 초안 생성, 자동화 즉시 실행(`action:"run-scheduler"`)
- `GET/POST /api/cron`: 외부 스케줄러용 자동화 실행 입구(`CRON_SECRET` 또는 관리자 세션 필요, `?status=1`은 상태만 조회)
- `GET /api/export`: 전체 데이터 JSON 백업
- `POST/DELETE /api/admin/session`: 로그인과 로그아웃

자동화 실행 경로와 점검 순서는 `AUTOMATION_RUNBOOK.md`에 정리했습니다.

쓰기 API는 관리자 세션을 확인합니다. 공개 글 조회는 저장소 계층에서 `published` 상태만 노출합니다.

## 5. 데이터 구조

`posts`에는 제목, 슬러그, 요약, HTML 본문, 카테고리, 태그, 상태, 발행일, 예약일, 읽기 시간, 표지 표시값을 저장합니다.

`posting_queue`에는 자동 작성 대상 글, 공식 출처, 검토 상태, 예약 시각, 시도 횟수와 오류를 저장합니다.

실제 테이블 정의는 `db/schema.ts`, 배포용 SQL은 `drizzle/`에서 확인할 수 있습니다. 저장소 접근은 `lib/repository.ts`에 분리되어 있어 향후 Supabase/Postgres 어댑터로 교체할 수 있습니다.

## 6. 관리자 보안

운영 환경에는 다음 값이 별도로 필요합니다.

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`

비밀번호 원문과 운영 비밀키는 소스 및 이 압축파일에 포함하지 않습니다. 세션은 HttpOnly, Secure, SameSite=Strict 쿠키를 사용합니다.

## 7. SEO·GEO 구성

- canonical, Open Graph, X 카드
- Google AdSense 계정 메타태그
- sitemap, robots.txt
- Article·Breadcrumb 구조화 데이터
- 이미지 alt·크기·비율 최적화
- 관련 글과 내부 링크
- `llms.txt`와 신뢰·편집 정책 페이지

## 8. 실행과 검사

Node.js 22.13 이상에서 다음 순서로 실행합니다.

```bash
npm install
npm run dev
npm test
```

운영에는 다음 환경변수가 필요합니다.

- `DATABASE_URL`: Supabase 연결 문자열(서버리스에서는 pooler 주소를 씁니다)
- `CRON_SECRET`: `/api/cron` 호출용 비밀값
- `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`

첫 요청에서 저장소 계층이 스키마를 만들고 기본 콘텐츠를 시드합니다.
