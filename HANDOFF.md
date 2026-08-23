# 개발 인수인계

## 먼저 읽을 파일

1. `PROJECT_STRUCTURE.md`
2. `PROJECT_HISTORY.md`
3. `README.md`
4. `package.json`
5. `vercel.json`
6. `db/schema.ts`
7. `lib/repository.ts`
8. `app/admin/AdminClient.tsx`

## 이어서 작업할 때 지켜야 할 원칙

- Next.js 16 App Router 와 Supabase(PostgreSQL) 구조를 유지합니다.
- 글 데이터 접근은 `lib/repository.ts` 경계를 통합니다.
- 자동 포스팅은 완전자동 공개가 아니라 초안 → 검토 → 예약발행 순서를 유지합니다.
- 조직 자동화는 cron·요청 따라잡기·`/api/cron` 세 경로가 같은 진입점을 공유합니다. 자세한 내용은 `AUTOMATION_RUNBOOK.md`를 봅니다.
- 관리자 쓰기 API는 항상 사이트 자체 세션 검사를 거칩니다.
- 비밀번호 원문, 비밀번호 해시, 세션키를 Git이나 문서에 넣지 않습니다.
- 수정 후 `npm test`로 빌드와 회귀 테스트를 확인합니다.
- 공개 배포는 로컬 성공과 별개로 사용자의 명시적인 승인을 받은 뒤 진행합니다.

## 최신 미배포 변경

관리자 콘텐츠 보관함에서 글 제목을 선택하면 선택 상태만 바뀌고 모바일 화면이 편집기로 이동하지 않던 문제를 수정했습니다. 이제 선택한 글 ID가 주소에 기록되고, 편집기 위치로 부드럽게 이동하며, 새로고침 뒤에도 해당 글을 다시 불러옵니다.

## 외부 이전 권장 순서

1. 이 압축파일을 안전한 폴더에 풉니다.
2. `retire-rich-lab-git-history.bundle`로 Git 전체 이력을 복원합니다.
3. `npm install`과 `npm test`를 실행합니다.
4. Cloudflare D1을 만들고 `drizzle/` 마이그레이션을 적용합니다.
5. 관리자 환경값 세 가지를 새 값으로 등록합니다.
6. 관리자 `전체 백업`에서 받은 운영 JSON 데이터를 별도로 이관합니다.
7. 배포 확인 후 Adbles.com DNS를 연결합니다.
