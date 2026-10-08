import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import test from "node:test";

test("renders the finished Korean content site", async () => {
  const [page, layout, search, article, media, enrichment, content, footer, mobileMenu, site, css, richEditor, articleHtml, readerTools, management, repository, portalMenuSource] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/search/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/posts/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/ArticleMedia.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/article-enrichment.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/content.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/SiteChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/MobileMenu.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/site.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/RichTextEditor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/article-html.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/posts/[slug]/ArticleReaderTools.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/management-department.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/repository.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/portal.ts", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /퇴직생활연구소/);
  assert.match(site, /퇴직 이후의 생활을 공식 자료로 확인합니다/);
  // 브랜드 소개와 슬로건은 /about으로 옮겼다. 홈에 다시 들어오면 탐색이 밀린다.
  const about = await readFile(new URL("../app/about/page.tsx", import.meta.url), "utf8");
  assert.match(about, /퇴직 후 막막함을/);
  assert.match(about, /내 돈이 몇 달을 버틸지 계산하고/);
  assert.match(about, /<HeroCarousel \/>/);
  assert.match(about, /hero-project-visual/);
  assert.doesNotMatch(page, /퇴직 후 막막함을/);
  assert.doesNotMatch(page, /<HeroCarousel \/>/);
  assert.doesNotMatch(page, /className="hero"/);

  assert.doesNotMatch(page, /공식 자료 검토/);
  assert.match(page, /본문으로 바로가기/);
  // 홈은 콘텐츠 탐색 화면이다: 뉴스룸 히어로 → 주제별 모아보기.
  assert.match(page, /newsroom-hero/);
  assert.match(page, /주제별로 모아보기/);
  assert.match(page, /groupByCategory/);
  assert.match(page, /newsroom-category-block/);
  assert.match(page, /className="post-card-link"/);
  assert.match(page, /post-meta[^}]+post\.category/);
  assert.match(css, /\.newsroom-category-block/);
  assert.match(css, /\.post-card \{ min-width:0/);
  assert.match(repository, /sortPostsNewestFirst/);
  assert.match(repository, /publishedAt\.slice\(0, 10\)\.localeCompare\(a\.publishedAt\.slice\(0, 10\)\)/);
  assert.match(repository, /publishedDateOrder \|\| b\.id - a\.id/);
  assert.match(page, /ContactPoint/);
  assert.match(page, /master@adbles\.com/);
  assert.match(page, /MobileMenu/);
  assert.match(mobileMenu, /전체 메뉴 열기/);
  // 메뉴 라벨은 검색되는 중형 키워드로 두고, 상단·모바일·푸터가 같은 문구를 쓴다.
  // 한 페이지를 세 이름으로 부르면 앵커텍스트가 흩어진다.
  for (const label of ["퇴직금 계산기", "실업급여·국민연금", "퇴직 후 부업", "건강검진·질병예방"]) {
    assert.ok(portalMenuSource.includes(label), `portalMenu에 ${label}가 없다`);
    assert.ok(mobileMenu.includes(label), `모바일 메뉴에 ${label}가 없다`);
    assert.ok(footer.includes(label), `푸터 살펴보기에 ${label}가 없다`);
  }
  assert.doesNotMatch(portalMenuSource, /label: "도구모음"/);
  assert.match(css, /mobile-menu-drawer/);
  assert.match(css, /\.article-copy ul\{list-style:disc\}/);
  assert.match(css, /\.article-copy ol\{list-style:decimal\}/);
  assert.match(layout, /project-og-v2\.jpg/);
  assert.match(footer, /brand-mark-v2\.png/);
  assert.match(css, /heroImageDrift/);
  assert.match(css, /Quality Design System v2/);
  assert.match(css, /grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/);
  assert.match(css, /grid-template-columns:minmax\(0,760px\) minmax\(220px,280px\)/);
  assert.match(css, /--orange:#b45309/);
  assert.match(css, /@media\(max-width:420px\)/);
  assert.match(footer, /운영사/);
  assert.match(footer, /관리자<\/span><strong>어썸라이프/);
  assert.match(footer, /mailto:master@adbles\.com/);
  assert.match(footer, /개인정보처리방침/);
  assert.match(footer, /광고·이용 안내/);
  assert.match(footer, /이용약관/);
  assert.match(footer, /문의·오류 제보/);
  assert.match(footer, /애드블스가 운영합니다/);
  assert.match(site, /Adbles\.com/);
  // tipspedia 구조 차용: 외부 웹폰트 CDN 의존을 제거하고 시스템 폰트 스택을 사용하여 PageSpeed 성능 100점 달성
  assert.doesNotMatch(layout, /fonts\.googleapis\.com\/css2/);
  assert.match(css, /Pretendard/);
  assert.equal((layout.match(/google-adsense-account/g) ?? []).length, 1);
  assert.match(layout, /content="ca-pub-4030620718116834"/);
  assert.match(media, /ArticleThumbnail/);
  assert.doesNotMatch(media, /읽은 뒤 다시 확인/);
  assert.doesNotMatch(media, /핵심 내용과 확인표/);
  assert.doesNotMatch(media, /읽으면서 확인할 표/);
  assert.doesNotMatch(enrichment, /목표와 기간 확인/);
  assert.match(content, /<ol><li>/);
  assert.match(content, /<ul><li>/);
  assert.match(css, /\.article-copy ul\{list-style:disc\}/);
  assert.match(css, /\.article-copy ol\{list-style:decimal\}/);
  assert.match(css, /\.article-copy li::marker/);
  assert.match(css, /Article readability: comfortable Korean text measure/);
  assert.match(css, /max-width:42em!important/);
  assert.match(css, /font-size:19px;line-height:1\.82/);
  assert.match(css, /\.rich-article-body tbody tr:nth-child\(even\)/);
  assert.match(css, /\.related-posts a>strong\{display:block/);
  assert.match(css, /\.footer-links a\{font-size:14px/);
  assert.match(management, /list-missing/);
  assert.match(management, /본문 목록이 없습니다/);
  assert.match(media, /공식자료와 추가 확인처/);
  assert.doesNotMatch(media, /자동 구성된/);
  assert.match(enrichment, /wikipedia\.org/);
  assert.match(enrichment, /categoryOfficialLinks/);
  assert.match(enrichment, /z08sPVTv39M/);
  assert.match(media, /관련 설명 영상/);
  assert.match(enrichment, /D-5p431l-qY/);
  assert.match(content, /alt="퇴직 후 건강보험 가입 유형을 확인하는 중장년 부부 일러스트"/);
  assert.match(enrichment, /퇴직 후 건강보험 가입 유형을 확인하는 중장년 부부 일러스트/);
  assert.match(content, /proshot-mobile-id-studio-photo-guide/);
  assert.match(content, /ProShot은 현재 무료로 이용할 수 있습니다/);
  // 옛 유료 요금이 되살아나지 않는지 확인한다. ProShot 항목에만 적용해야 한다 —
  // 파일 전체에 걸면 "395만 2,000원" 같은 정상적인 금액 표기까지 걸린다.
  {
    const start = content.indexOf('slug:"proshot-mobile-id-studio-photo-guide"');
    assert.ok(start !== -1);
    const entryStart = content.lastIndexOf("\n  { id:", start);
    const entryEnd = content.indexOf("\n  { id:", start);
    const proshotEntry = content.slice(entryStart, entryEnd === -1 ? content.length : entryEnd);
    assert.doesNotMatch(proshotEntry, /990원|2,000원/);
  }
  assert.match(content, /ProShot에 업로드하기 전 휴대폰 정면 셀카 예시/);
  assert.match(content, /ProShot으로 생성한 정장 차림의 스튜디오 비즈니스 프로필 사진 예시/);
  assert.match(content, /retirement-pay-irp-five-checks-before-withdrawal/);
  assert.match(content, /retirement-pay-irp-five-checks-before-withdrawal[\s\S]*publishedAt:"2026-08-15"/);
  assert.match(content, /proshot-mobile-id-studio-photo-guide[\s\S]*publishedAt:"2026-08-15"/);
  assert.match(content, /퇴직금이 IRP에 입금된 뒤 일시금과 연금 수령 절차를 확인하는 서류·일정표 일러스트/);
  assert.match(content, /절세 · 세금·보험 편집자/);
  assert.match(enrichment, /국세청 연금계좌 원천징수세율/);
  assert.match(enrichment, /외교부 온라인 여권사진 검증/);
  assert.match(media, /enrichment\.images/);
  assert.match(articleHtml, /validateArticleMedia/);
  assert.match(articleHtml, /ArticleMediaValidationError/);
  assert.match(articleHtml, /addOfficialOrganizationLinksToHtml/);
  assert.match(articleHtml, /https:\/\/www\.nhis\.or\.kr\/nhis\/index\.do/);
  assert.match(articleHtml, /https:\/\/www\.nps\.or\.kr\//);
  assert.match(articleHtml, /https:\/\/www\.work24\.go\.kr\//);
  assert.match(articleHtml, /https:\/\/www\.nts\.go\.kr\//);
  assert.match(articleHtml, /https:\/\/hometax\.go\.kr\//);
  assert.match(articleHtml, /const linked=new Set<string>\(\)/);
  assert.match(articleHtml, /linked\.has\(item\.term\)/);
  assert.match(articleHtml, /refreshOfficialUrl\(rawHref\)/);
  assert.match(article, /\.map\(refreshOfficialUrl\)/);
  assert.match(article, /addOfficialOrganizationLinksToHtml/);
  assert.match(enrichment, /youtube-nocookie/);
  assert.match(enrichment, /article-thumbnails/);
  assert.match(media, /alt=\{image\.alt\}/);
  assert.match(enrichment, /thumbnailCatalog/);
  assert.match(enrichment, /체크 표시가 된 퇴직 준비 체크리스트/);
  assert.match(enrichment, /pickThumbnail/);
  assert.match(media, /loading=\{variant === "hero" \? "eager" : "lazy"\}/);
  assert.match(css, /object-fit:cover/);
  assert.match(css, /object-fit:contain/);
  assert.match(search, /<a href={`\/posts\/\$\{p\.slug\}`}/);
  assert.match(search, /htmlFor="site-search"/);
  assert.match(search, /className="search-field"/);
  assert.match(css, /\.search-result-copy\{min-width:0;display:grid/);
  assert.match(css, /\.search-results\{display:grid;gap:16px\}/);
  assert.match(article, /<a href={`\/posts\/\$\{item\.slug\}`}/);
  assert.match(article, /className="glossary-link"/);
  assert.match(article, /linkGlossaryTerms/);
  assert.doesNotMatch(media, /어려운 용어/);
  assert.match(css, /glossary-link:hover/);
  assert.match(richEditor, /HTML 보기/);
  assert.match(richEditor, /링크 카드·영상/);
  assert.match(richEditor, /addImage/);
  assert.match(richEditor, /addTable/);
  assert.match(article, /renderRichBody/);
  assert.match(article, /ArticleReaderTools articleId="article-body"/);
  assert.match(article, /id="article-body"/);
  assert.match(readerTools, /글 읽기 도구/);
  assert.match(readerTools, /querySelectorAll<HTMLHeadingElement>\("h2, h3"\)/);
  assert.match(readerTools, /aria-pressed=\{largeText\}/);
  assert.match(readerTools, /role="progressbar"/);
  assert.match(css, /\.reader-tools\{/);
  assert.match(css, /\.article-copy\.reader-large/);
  assert.match(css, /reader-large :where\(p,h2,h3,h4,li,a,strong,em,blockquote,figcaption,th,td,code,span\)/);
  assert.match(css, /table-layout:fixed/);
  assert.match(css, /white-space:pre-wrap;overflow-wrap:anywhere/);
  assert.match(articleHtml, /sanitizeArticleHtml/);
  assert.match(articleHtml, /blockedElements/);
  assert.match(articleHtml, /youtube-nocookie/);
  assert.doesNotMatch(`${search}\n${article}\n${footer}`, /next\/link|<Link/);
  assert.doesNotMatch(`${page}\n${layout}`, /codex-preview|react-loading-skeleton/i);
});

test("redirects www to the canonical apex domain", async () => {
  const worker = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.match(worker, /url\.hostname === "www\.adbles\.com"/);
  assert.match(worker, /url\.hostname = "adbles\.com"/);
  assert.match(worker, /Response\.redirect\(url\.toString\(\), 301\)/);
});

// 관리자 편집실과 자동화는 기본 비활성이다. 공개 사이트는 lib/content.ts의 글로 동작하므로
// 이 둘이 꺼져 있어도 사이트는 완전하다. 꺼진 상태에서는 DATABASE_URL도 CRON_SECRET도 필요 없다.
// 실수로 기본값이 켜지면 저장은 성공한 척하고 사라지고 /api/cron이 공개로 열리므로 여기서 고정한다.
test("keeps the admin editor and automation disabled by default", async () => {
  const [flags, siteAdmin, cronRoute, sessionRoute, adminPage, loginPage] = await Promise.all([
    readFile(new URL("../lib/feature-flags.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/site-admin.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/cron/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/session/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/login/page.tsx", import.meta.url), "utf8"),
  ]);
  // 기본값은 반드시 꺼짐이어야 한다. 명시적으로 "1"일 때만 켜진다.
  assert.match(flags, /ADMIN_ENABLED = process\.env\.ADMIN_ENABLED === "1"/);

  // 쓰기 API 11개는 requireOwnerApi를 통하므로 그 한 지점에서 닫힌다.
  assert.match(siteAdmin, /if\(!ADMIN_ENABLED\)return\{session:null,response:disabledSurfaceResponse\(\)\}/);

  // requireOwnerApi를 쓰지 않는 경로는 각자 닫아야 한다.
  assert.match(cronRoute, /if \(!ADMIN_ENABLED\) return disabledSurfaceResponse\(\)/);
  assert.match(sessionRoute, /if\(!ADMIN_ENABLED\)return disabledSurfaceResponse\(\)/);
  assert.match(adminPage, /if\(!ADMIN_ENABLED\)notFound\(\)/);
  assert.match(loginPage, /if\(!ADMIN_ENABLED\)notFound\(\)/);
});

// Vercel은 vercel.json의 crons를 배포 단계에서 플랜 한도로 검증한다. Hobby 플랜은
// 프로젝트당 cron 2개, 하루 1회까지만 허용한다. next build는 crons를 읽지 않으므로
// 시간당 표현식("0 * * * *")을 넣으면 로컬 빌드와 테스트는 전부 통과하고 배포만 실패한다.
// 2026-08-17 이 조합으로 커밋 12개가 조용히 미배포 상태로 쌓였다.
test("keeps vercel cron schedules inside the deployable plan limit", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const crons = config.crons ?? [];
  assert.ok(crons.length <= 2, `cron은 프로젝트당 2개까지만 허용된다 (현재 ${crons.length}개)`);
  for (const { path, schedule } of crons) {
    const [minute, hour] = String(schedule).split(" ");
    assert.match(minute, /^\d+$/, `${path}: 분 필드가 고정값이 아니면 하루 1회를 넘는다 (${schedule})`);
    assert.match(hour, /^\d+$/, `${path}: 시 필드가 고정값이 아니면 하루 1회를 넘는다 (${schedule})`);
  }
});

// 위 테스트는 worker/index.ts 소스만 확인하며, Vercel 배포에서는 이 워커가 실행되지 않는다.
// 실제 호스트 방향은 배포 플랫폼의 도메인 설정에 달려 있으므로 여기서는
// 코드가 생성하는 모든 URL이 apex 한 곳만 가리키는지를 고정한다.
// 배포 설정이 apex → www로 걸려 있으면 canonical·sitemap·RSS·IndexNow 제출 URL이
// 전부 리다이렉트되는 주소가 되어 색인이 흔들린다.
test("keeps every generated URL on one canonical apex host", async () => {
  const site = await readFile(new URL("../lib/site.ts", import.meta.url), "utf8");
  assert.match(site, /export const SITE_URL = "https:\/\/adbles\.com"/);
  assert.doesNotMatch(site, /SITE_URL = "https:\/\/www\./);

  // 앱 레벨에서 www → apex 리다이렉트를 추가하면 배포 설정의 apex → www 리다이렉트와
  // 맞물려 무한 순환이 된다. next.config.ts는 호스트 리다이렉트를 갖지 않아야 한다.
  const nextConfig = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.doesNotMatch(nextConfig, /www\.adbles\.com/);
});

test("links every vibe coding part through the shared series nav", async () => {
  const [content, nav, article, css] = await Promise.all([
    readFile(new URL("../lib/content.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/SeriesNav.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/posts/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  // 시리즈 편들이 빠짐없이 연속된 번호를 갖는지 확인한다.
  const parts = [];
  for (const entry of content.matchAll(/\n {2}\{ id:\d+,[^\n]*?slug:"(vibe-coding-basics-\d+)"[\s\S]*?tags:\[([^\]]*)\]/g)) {
    const part = entry[2].match(/시리즈(\d+)/);
    assert.ok(part, `${entry[1]}에 시리즈 태그가 없다`);
    assert.match(entry[2], /"바이브코딩"/, `${entry[1]}에 바이브코딩 태그가 없다`);
    parts.push(Number(part[1]));
  }
  assert.ok(parts.length >= 7, "시리즈가 7편 이상이어야 한다");
  assert.deepEqual([...parts].sort((a, b) => a - b), Array.from({ length: parts.length }, (_, i) => i + 1));

  // SeriesNav가 태그로 순서를 만들고 기사 페이지가 실제로 렌더해야 한다.
  assert.match(nav, /\^시리즈\(\\d\+\)\$/);
  assert.match(nav, /post\.tags\.includes\(SERIES_TAG\)/);
  assert.match(article, /<SeriesNav post=\{post\}\/>/);
  assert.match(css, /\.series-nav\{/);
});

test("serves the Naver verification file at its exact public path", async () => {
  const [worker, verification] = await Promise.all([
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/naverafe0ef74210245a649d66c3a595329e9.html", import.meta.url), "utf8"),
  ]);
  assert.match(worker, /NAVER_SITE_VERIFICATION_PATH/);
  assert.match(worker, /NAVER_SITE_VERIFICATION_CONTENT/);
  assert.match(worker, /return new Response\(NAVER_SITE_VERIFICATION_CONTENT/);
  assert.equal(verification.trim(), "naver-site-verification: naverafe0ef74210245a649d66c3a595329e9.html");
});

test("ships the challenge, official information, tools, health and agent desks", async()=>{
  const [home,chrome,challenge,workbook,official,portal,tools,severance,health,agentsApi,agentsData,repository,admin,sitemap]=await Promise.all([
    readFile(new URL("../app/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/components/SiteChrome.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/challenge/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/challenge/ChallengeWorkbook.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/official-info/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../lib/portal.ts",import.meta.url),"utf8"),
    readFile(new URL("../app/tools/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/tools/severance-pay/SeveranceCalculator.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/health/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/api/agents/route.ts",import.meta.url),"utf8"),
    readFile(new URL("../lib/content-agents.ts",import.meta.url),"utf8"),
    readFile(new URL("../lib/repository.ts",import.meta.url),"utf8"),
    readFile(new URL("../app/admin/AdminClient.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/sitemap.ts",import.meta.url),"utf8"),
  ]);
  // 홈에서 챌린지로 갈 수 있어야 한다. 문구는 바뀔 수 있으므로 경로로 확인한다.
  assert.match(home,/"\/challenge"/);
  assert.match(chrome,/portalMenu/);
  assert.match(challenge,/퇴직 후 부업, 내 경험으로 첫 제안까지 30일/);
  assert.match(challenge,/수익을 약속하지 않습니다/);
  assert.match(workbook,/30일 실행 워크북/);
  assert.match(workbook,/localStorage/);
  assert.match(official,/officialSections/);
  assert.match(portal,/국세법령정보시스템/);
  assert.match(tools,/toolCatalog/);
  assert.match(portal,/이미지 변환기/);
  assert.match(portal,/https:\/\/myreceipt\.adbles\.com\//);
  assert.match(portal,/영수증 정리도우미/);
  assert.match(portal,/https:\/\/proshot\.adbles\.com\//);
  assert.match(portal,/ProShot AI 사진 스튜디오/);
  assert.match(tools,/영수증 사진을 A4 한 장으로 정리하세요/);
  assert.match(tools,/PDF 다운로드/);
  assert.match(tools,/휴대폰 셀카를 무료로 깔끔한 프로필 사진으로/);
  assert.match(tools,/무료로 ProShot 이용하기/);
  // 자사 사이트를 제3자 추천처럼 보이게 두면 게시자 정보를 잘못 전달하는 것이 된다.
  assert.match(portal,/selfOperated:true/);
  assert.equal((portal.match(/selfOperated:true/g)||[]).length, (portal.match(/href:"https:\/\/[a-z]+\.adbles\.com\//g)||[]).length,
    "adbles.com 자사 도구 항목마다 selfOperated 표시가 있어야 합니다.");
  assert.match(tools,/selfOperated/);
  assert.equal((tools.match(/애드블스가 직접 만든 도구입니다/g)||[]).length, 2);
  assert.match(tools,/애드블스가 만든 비교 사이트입니다/);
  assert.match(severance,/예상 퇴직금/);
  assert.match(health,/youtube-nocookie\.com/);
  assert.match(health,/갑작스러운 위험 신호는 119/);
  assert.match(health,/이번 달 건강 점검/);
  // 지역 페이지(/keyword-lab, /local/*)는 템플릿만 같고 지역명만 바뀌는 구조라 제거했다.
  // 애드센스는 이런 페이지를 가치가 낮은 콘텐츠로 본다. 되살리지 않도록 여기서 막는다.
  assert.match(agentsApi,/requireOwnerApi/);
  assert.match(agentsData,/health-column/);
  assert.match(repository,/runDueContentAgents/);
  assert.match(repository,/status:"published"/);
  assert.match(repository,/에이전트가 글을 자동 생성하고 즉시 자동 발행 및 검색엔진 색인 요청을 완료했습니다/);
  assert.match(repository,/runSiteManagementAudit/);
  assert.match(repository,/management_issues/);
  assert.match(admin,/사이트 경영관리팀 상황실/);
  assert.match(admin,/전사 감사실/);
  assert.match(admin,/전 프로젝트 감사 실행/);
  assert.match(repository,/runOrganizationAudit/);
  assert.match(repository,/runDueOrganizationAudit/);
  assert.match(repository,/audit_runs/);
  assert.match(admin,/지금 전체 점검/);
  assert.match(admin,/전사 적용/);
  assert.match(admin,/적용 구성원 전체 보기/);
  assert.match(repository,/organizationPolicyRecipients/);
  const originality = await readFile(new URL("../lib/originality-check.ts", import.meta.url), "utf8");
  assert.match(originality,/compareOriginality/);
  assert.match(originality,/COPY_RATIO_LIMIT/);
  assert.match(originality,/LONG_COPY_LIMIT/);
  assert.match(repository,/verifyPublicationOriginality/);
  assert.match(admin,/원문 복사 자동감시/);
  assert.match(admin,/자신의 설명·사례·표로 재작성/);
  const companyRules = await readFile(new URL("../lib/company-rules.ts", import.meta.url), "utf8");
  assert.match(companyRules,/COMPANY_RULES_VERSION/);
  assert.match(companyRules,/조직과 인사관리/);
  assert.match(companyRules,/리소스 관리/);
  assert.match(companyRules,/companyResourceRegistry/);
  assert.match(companyRules,/100세 시대, 퇴직이 끝이 아니라 새로운 기회/);
  assert.match(companyRules,/새 일과 수입 실험/);
  assert.match(companyRules,/정보보다 다음 행동/);
  assert.match(admin,/전사 사규 · 시행 중/);
  assert.match(admin,/MVP 6대 경영목표 보기/);
  assert.match(admin,/리소스 책임자 보기/);
  assert.match(repository,/콘텐츠 품질 기준을 충족하지 못해 발행하지 않았습니다/);
  assert.match(repository,/CONTENT_QUALITY_REVISION/);
  assert.match(repository,/preparePromotionCampaign/);
  assert.match(repository,/promotion_campaigns/);
  const promotionTeam = await readFile(new URL("../lib/promotion-team.ts", import.meta.url), "utf8");
  assert.match(promotionTeam, /name: "픽"/);
  assert.match(promotionTeam, /name: "랭크"/);
  assert.match(promotionTeam, /name: "네오"/);
  assert.match(promotionTeam, /name: "빙고"/);
  assert.match(promotionTeam, /name: "소스"/);
  assert.match(promotionTeam, /name: "크롤"/);
  assert.match(promotionTeam, /name: "펄스"/);
  assert.match(promotionTeam, /Google · Gemini · AI Overviews/);
  assert.match(promotionTeam, /Naver 통합검색/);
  assert.match(promotionTeam, /ChatGPT · Perplexity · Claude/);
  const editorialTeam = await readFile(new URL("../lib/editorial-team.ts", import.meta.url), "utf8");
  assert.match(editorialTeam, /name: "데스크"/);
  assert.match(editorialTeam, /name: "원"/);
  assert.match(editorialTeam, /name: "가드"/);
  assert.match(editorialTeam, /name: "툴"/);
  assert.match(editorialTeam, /name: "픽"/);
  assert.match(editorialTeam, /name: "로컬"/);
  assert.match(editorialTeam, /name: "케어"/);
  assert.match(editorialTeam, /name: "자산"/);
  assert.match(editorialTeam, /name: "살림"/);
  assert.match(editorialTeam, /name: "큐"/);
  assert.match(repository,/authorName:agent\.name/);
  assert.doesNotMatch(repository,/tags:\[agent\.name,"공식 자료","검토 초안"\]/);
  assert.match(admin,/분야별 에이전트 운영실/);
  assert.match(admin,/초안 생성 주기/);
  assert.match(admin,/지금 초안 만들기/);
  assert.match(admin,/사람이 확인해 예약 또는 발행 상태로 바꾼 글만 공개됩니다/);
  assert.match(admin,/품질 기준에 미달하면 실패 기록으로 남깁니다/);
  assert.match(admin,/홍보 에이전트 작업실/);
  assert.match(admin,/UTM 추적 적용/);
  assert.match(admin,/외부 게시 완료로 표시/);
  const marketingCampaigns = await readFile(new URL("../lib/marketing-campaigns.ts", import.meta.url), "utf8");
  assert.match(marketingCampaigns,/utm_source/);
  assert.match(marketingCampaigns,/always_on_/);
  assert.match(marketingCampaigns,/name: "네이버 블로그"/);
  assert.match(marketingCampaigns,/name: "Facebook"/);
  assert.match(admin,/홍보마케팅팀 조직·SEO 운영실/);
  assert.match(admin,/역할이 바로 연상되는 짧은 닉네임을 사용하는 AI 조직/);
  const qualityDesignTeam = await readFile(new URL("../lib/quality-design-team.ts", import.meta.url), "utf8");
  const organizationPolicy = await readFile(new URL("../lib/organization-policy.ts", import.meta.url), "utf8");
  assert.match(qualityDesignTeam, /name: "결"/);
  assert.match(qualityDesignTeam, /name: "틀"/);
  assert.match(qualityDesignTeam, /name: "글결"/);
  assert.match(qualityDesignTeam, /name: "픽셀"/);
  assert.match(qualityDesignTeam, /name: "흐름"/);
  assert.match(qualityDesignTeam, /name: "체크"/);
  assert.match(qualityDesignTeam, /name: "눈금"/);
  assert.match(qualityDesignTeam, /발행 전 필수 품질 게이트|qualityDesignGates/);
  assert.match(admin,/품질디자인팀 운영실/);
  assert.match(admin,/최종 공개는 경영관리팀 승인 뒤에만 진행합니다/);
  assert.match(organizationPolicy, /department:"품질디자인팀"/);
  assert.match(admin,/글 작성자/);
  assert.match(admin,/선택한 이름이 글 상단과 검색엔진용 작성자 정보에 함께 표시됩니다/);
  assert.match(sitemap,/challenge/);
  assert.doesNotMatch(sitemap,/keyword-lab/);
  const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
  assert.match(robots,/OAI-SearchBot/);
  assert.match(robots,/bingbot/);
  assert.match(robots,/Yeti/);
  assert.doesNotMatch(robots,/\/search\?/);
});

test("전사 감사 조직과 감사영역이 문서화되어 있다", async () => {
  const audit = await readFile(new URL("../lib/internal-audit.ts", import.meta.url), "utf8");
  const charter = await readFile(new URL("../INTERNAL_AUDIT_CHARTER.md", import.meta.url), "utf8");
  const report = await readFile(new URL("../AUDIT_REPORT_2026-08-14.md", import.meta.url), "utf8");
  assert.match(audit,/강한결/);
  assert.match(audit,/박지안/);
  assert.match(audit,/윤서진/);
  assert.match(audit,/퇴직생활연구소 전 프로젝트/);
  assert.match(charter,/매월 1회 전 영역/);
  assert.match(report,/조건부 적정/);
});

test("조직 명부는 내부에서만 집계하고 공개 사이트에서는 노출하지 않는다", async () => {
  const chart = await readFile(new URL("../lib/organization-chart.ts", import.meta.url), "utf8");
  const footer = await readFile(new URL("../app/components/SiteChrome.tsx", import.meta.url), "utf8");
  const sitemap = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  const notice = await readFile(new URL("../ORGANIZATION_NOTICE.md", import.meta.url), "utf8");
  assert.match(chart,/organizationChartDepartments/);
  assert.match(chart,/contentPlanningTeam\.map/);
  assert.match(chart,/allEditorialAuthors\.map/);
  assert.match(chart,/managementDepartment\.map/);
  assert.doesNotMatch(footer,/href="\/organization"/);
  assert.doesNotMatch(sitemap,/"\/organization"/);
  assert.match(notice,/총 33명/);
});

test("keeps the independent editor and write APIs session-protected", async () => {
  const [adminPage, adminClient, loginPage, sessionRoute, siteAdmin, postsApi, postUpdateApi, exportApi, automationApi, promotionsApi] = await Promise.all([
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/AdminClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/login/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/session/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/site-admin.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/posts/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/posts/[id]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/export/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/automation/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/promotions/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(adminPage, /getAdminSession/);
  assert.match(loginPage, /독립 편집실 로그인/);
  assert.match(sessionRoute, /authenticateAdmin/);
  assert.match(siteAdmin, /PBKDF2/);
  assert.match(siteAdmin, /HttpOnly; Secure; SameSite=Strict/);
  assert.match(siteAdmin, /ADMIN_PASSWORD_HASH/);
  assert.doesNotMatch(`${adminPage}\n${sessionRoute}\n${siteAdmin}`, /getChatGPTUser|requireChatGPTUser|hardcoded-password/);
  assert.match(adminPage, /force-dynamic/);
  assert.match(postsApi, /requireOwnerApi/);
  assert.match(postsApi, /appendSourceUrl/);
  assert.match(postUpdateApi, /appendSourceUrl/);
  assert.match(adminClient, /공식자료 주소/);
  assert.match(adminClient, /전용 썸네일/);
  assert.match(adminClient, /function openEditor\(post: Post\)/);
  assert.match(adminClient, /scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/);
  assert.match(adminClient, /aria-label={`\$\{post\.title\} 글 편집하기`}/);
  assert.match(adminClient, /new URLSearchParams\(window\.location\.search\)\.get\("post"\)/);
  assert.match(exportApi, /requireOwnerApi/);
  assert.match(automationApi, /requireOwnerApi/);
  assert.match(promotionsApi, /requireOwnerApi/);
  assert.match(promotionsApi, /executePromotionCampaign/);
});

test("enforces team permissions and versioned safe releases", async () => {
  const [permissions, releasePolicy, repository, postsApi, admin, packageJson] = await Promise.all([
    readFile(new URL("../lib/team-permissions.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/release-policy.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/repository.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/posts/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/AdminClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(permissions, /productionDeployAuthority = "owner"/);
  assert.match(permissions, /id: "content-planning"/);
  assert.match(permissions, /id: "editorial"/);
  assert.match(permissions, /id: "quality-design"/);
  assert.match(permissions, /id: "promotion"/);
  assert.match(permissions, /id: "management"/);
  assert.match(permissions, /"release\.deploy"/);
  assert.match(releasePolicy, /mode: "versioned-atomic"/);
  assert.match(releasePolicy, /직전 정상 버전/);
  assert.match(repository, /assertTeamPermission\("editorial","content\.draft\.create"\)/);
  assert.match(repository, /assertTeamPermission\("management","audit\.run"\)/);
  assert.match(postsApi, /assertTeamPermission\("owner"/);
  assert.match(admin, /팀별 권한·무중단 배포/);
  assert.match(packageJson, /release:check/);
});

test("ships mobile-first SEO, GEO, trust and original-value pages", async () => {
  const [layout, post, sitemap, robots, rss, llms, ads, calculator, privacy, policy, chrome, css, contact, terms, author, content, repository] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/posts/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/robots.txt", import.meta.url), "utf8"),
    readFile(new URL("../app/rss.xml/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/llms.txt", import.meta.url), "utf8"),
    readFile(new URL("../public/ads.txt", import.meta.url), "utf8"),
    readFile(new URL("../app/tools/retirement-runway/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/privacy/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/editorial-policy/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/SiteChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/contact/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/terms/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/author/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/content.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/repository.ts", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /max-image-preview/);
  assert.match(post, /BlogPosting/);
  assert.match(post, /ImageObject/);
  assert.match(post, /thumbnailUrl/);
  assert.match(post, /BreadcrumbList/);
  assert.match(post, /wordCount/);
  assert.match(post, /citation/);
  assert.match(post, /related-posts/);
  assert.match(sitemap, /retirement-runway/);
  assert.match(sitemap, /images:/);
  assert.match(robots, /GPTBot/);
  assert.match(layout, /application\/rss\+xml/);
  assert.match(rss, /<rss version="2\.0"/);
  assert.match(rss, /getPublishedPosts/);
  assert.match(rss, /content:encoded/);
  assert.match(rss, /application\/rss\+xml/);
  const seoAudit = await readFile(new URL("../scripts/seo-audit.mjs", import.meta.url), "utf8");
  assert.match(seoAudit, /fetchPage\("\/rss\.xml"\)/);
  assert.match(seoAudit, /RSS 2\.0 채널 형식/);
  assert.match(llms, /대표 가이드/);
  assert.match(llms, /https:\/\/adbles\.com\/challenge/);
  assert.match(ads, /google\.com, pub-4030620718116834, DIRECT, f08c47fec0942fa0/);
  assert.match(calculator, /입력값은 저장하지 않습니다/);
  assert.match(privacy, /개인정보처리방침/);
  assert.match(privacy, /Google 광고와 쿠키/);
  assert.match(privacy, /동의 안내와 맞춤 광고 선택/);
  assert.match(contact, /콘텐츠 오류와 끊어진 링크/);
  assert.match(contact, /master@adbles\.com/);
  assert.match(terms, /정보와 계산 결과의 한계/);
  assert.match(author, /콘텐츠편집팀장은 ‘/);
  assert.match(author, /editorialAuthors\.length}명/);
  assert.match(author, /실존 인물이나 자격 보유자의 이름이 아닙니다/);
  assert.match(post, /author\.role/);
  assert.match(post, /퇴직생활연구소 AI 편집자/);
  assert.match(sitemap, /contact/);
  assert.match(sitemap, /terms/);
  assert.match(content, /unemployment-benefit-eight-steps/);
  assert.match(content, /월별 장부에는 일곱 칸/);
  assert.match(content, /90일 동안 같은 다섯 숫자만 기록합니다/);
  assert.match(repository, /adsense-readiness-v2/);
  assert.match(policy, /창작 과정에서 AI를 보조적으로 사용합니다/);
  assert.match(chrome, /WebPage/);
  assert.match(chrome, /BreadcrumbList/);
  assert.match(css, /overflow-x:hidden/);
  assert.match(layout, /viewportFit: "cover"/);
  assert.match(css, /iPhone article rendering guard/);
  assert.match(css, /-webkit-text-size-adjust:100%/);
  assert.match(css, /padding-left:max\(18px,env\(safe-area-inset-left\)\)/);
  assert.match(css, /\.related-posts \.thumbnail-search\{width:100%;height:126px;margin:0 0 20px\}/);
  assert.match(css, /font-family:"Noto Sans KR","Apple SD Gothic Neo",-apple-system/);
});

test("keeps public reads fast while automation runs in the background", async () => {
  const [worker, repository, releasePolicy] = await Promise.all([
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/repository.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/release-policy.ts", import.meta.url), "utf8"),
  ]);
  assert.match(worker, /PUBLIC_CACHE_CONTROL/);
  assert.match(worker, /stale-while-revalidate=86400/);
  assert.match(worker, /edgeCache\.match/);
  assert.match(worker, /edgeCache\.put/);
  assert.match(worker, /caches\?\.default/);
  assert.match(worker, /if\(key&&edgeCache\)/);
  assert.match(worker, /scheduled_organization_activity_failed/);
  assert.match(worker, /runScheduledOrganizationActivities/);
  assert.match(repository, /db\(\{initialize:false\}\)/);
  assert.match(repository, /persistedSlugs/);
  assert.match(repository, /persistedTitles/);
  assert.match(repository, /!persistedSlugs\.has\(post\.slug\)&&!persistedTitles\.has\(post\.title\.trim\(\)\)/);
  assert.match(repository, /decodeURIComponent\(slug\)\.normalize\(\"NFC\"\)/);
  assert.match(repository, /bind\(normalizedSlug\)/);
  assert.match(repository, /legacyPostSlugAliases\[slug\]/);
  assert.match(repository, /runDueSiteManagementAudit/);
  assert.match(repository, /await publishDuePosts\(\)/);
  assert.match(releasePolicy, /availability:/);
});

test("schedules every member with auditable hourly or daily work", async () => {
  const [plans, repository, route, admin, migration, document] = await Promise.all([
    readFile(new URL("../lib/member-activity-plans.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/repository.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/activity-plans/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/AdminClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0006_dear_george_stacy.sql", import.meta.url), "utf8"),
    readFile(new URL("../MEMBER_ACTIVITY_PLAN.md", import.meta.url), "utf8"),
  ]);
  assert.match(plans, /organizationChartDepartments\.flatMap/);
  assert.match(plans, /frequency:isHourly\?"hourly":"daily"/);
  assert.match(plans, /원문 복사는 금지합니다/);
  assert.match(repository, /runDueMemberActivities/);
  assert.match(repository, /runScheduledOrganizationActivities/);
  assert.match(repository, /member_activity_runs/);
  assert.match(route, /requireOwnerApi/);
  assert.match(admin, /전 구성원 자동 실행계획/);
  assert.match(admin, /시간 단위/);
  assert.match(admin, /일 단위/);
  assert.match(migration, /member_activity_plans/);
  assert.match(migration, /member_activity_runs/);
  assert.match(document, /직원 33명 전원/);
  assert.match(document, /발행, 외부 채널 게시, 운영 배포/);
});

test("썸네일은 해시가 아니라 글 주제로 후보군을 골라 배정한다", async () => {
  const [enrichment, content] = await Promise.all([
    readFile(new URL("../lib/article-enrichment.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/content.ts", import.meta.url), "utf8"),
  ]);

  // 예전 방식(고정 인덱스 + slug 해시 % 10)으로 되돌아가지 않도록 막는다.
  assert.doesNotMatch(enrichment, /thumbnailHash\(post\.slug\) % 10/);
  assert.match(enrichment, /const thumbnailRules/);
  assert.match(enrichment, /matchThumbnailRule/);

  // 실제 파일 크기를 쓰는지 확인한다. 예전에는 355x444로 고정돼 일부 이미지와 어긋났다.
  assert.match(enrichment, /width: image\.width/);
  assert.match(enrichment, /height: image\.height/);

  // 카탈로그의 모든 이미지가 실제로 존재해야 한다.
  const thumbnailDir = new URL("../public/article-thumbnails/", import.meta.url);
  const availableFiles = new Set(await readdir(thumbnailDir));
  const catalogFiles = [...enrichment.matchAll(/\{ file: "([^"]+)"/g)].map((match) => match[1]);
  assert.ok(catalogFiles.length >= 12, `카탈로그 이미지가 너무 적습니다: ${catalogFiles.length}장`);
  for (const file of catalogFiles) {
    assert.ok(availableFiles.has(file), `public/article-thumbnails/${file} 가 없습니다.`);
  }

  // 후보군은 최소 2장이어야 같은 카테고리 글끼리도 썸네일이 갈린다.
  const pools = [...enrichment.matchAll(/pool: \[([^\]]+)\]/g)].map((match) =>
    [...match[1].matchAll(/"([^"]+)"/g)].map((file) => file[1]));
  assert.ok(pools.length >= 8, `주제 규칙이 너무 적습니다: ${pools.length}개`);
  for (const pool of pools) {
    assert.ok(pool.length >= 2, `후보군이 1장뿐입니다: ${pool.join(", ")}`);
    for (const file of pool) assert.ok(catalogFiles.includes(file), `${file} 는 카탈로그에 없습니다.`);
  }

  // 실제로 쓰이는 카테고리는 모두 어떤 규칙이든 걸려야 한다.
  const ruleCategories = new Set([...enrichment.matchAll(/categories: \[([^\]]+)\]/g)]
    .flatMap((match) => [...match[1].matchAll(/"([^"]+)"/g)].map((name) => name[1])));
  const usedCategories = new Set([...content.matchAll(/category:"([^"]+)"/g)].map((match) => match[1]));
  for (const category of usedCategories) {
    assert.ok(ruleCategories.has(category), `"${category}" 카테고리에 맞는 썸네일 규칙이 없습니다.`);
  }
});

test("발행 정보는 런타임에 계산하지 않고 고정값으로 둔다", async () => {
  const content = await readFile(new URL("../lib/content.ts", import.meta.url), "utf8");

  // publishedAt에 new Date()를 쓰면 그 글이 영원히 '오늘 발행'이 되어 홈 상단을
  // 독점하고, 사이트맵 lastmod가 빌드마다 바뀐다. slug에 Date.now()/random을
  // 쓰면 URL이 매번 달라져 색인도 링크도 불가능해진다. scripts/generate_post.ts가
  // 정확히 이 모양의 항목을 주입하므로 되살아나면 여기서 잡는다.
  const seedStart = content.indexOf("export const seedPosts");
  assert.ok(seedStart !== -1);
  const seed = content.slice(seedStart);
  assert.doesNotMatch(seed, /publishedAt:\s*new Date\(/);
  assert.doesNotMatch(seed, /slug:\s*"[^"]*"\s*\+/);
  assert.doesNotMatch(seed, /Date\.now\(\)|Math\.random\(\)/);

  // 발행일은 모두 YYYY-MM-DD 문자열이어야 한다.
  const publishedDates = [...seed.matchAll(/publishedAt:\s*("[^"]*")/g)].map((match) => match[1]);
  assert.ok(publishedDates.length > 30, `발행일을 ${publishedDates.length}개만 찾았습니다.`);
  for (const value of publishedDates) {
    assert.match(value, /^"\d{4}-\d{2}-\d{2}"$/, `발행일 형식이 아닙니다: ${value}`);
  }

  // 테스트용 모의 글이 공개 상태로 남아 있으면 안 된다.
  assert.doesNotMatch(seed, /\[자동화 테스트\]/);
  assert.doesNotMatch(seed, /테스트 런에 의해 생성/);
});

test("정보 사이트맵을 별도 제출할 수 있게 노출한다", async () => {
  const [route, robots, content] = await Promise.all([
    readFile(new URL("../app/info/sitemap-info.xml/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/robots.txt", import.meta.url), "utf8"),
    readFile(new URL("../lib/content.ts", import.meta.url), "utf8"),
  ]);

  // 검색엔진이 스스로 찾을 수 있어야 한다.
  assert.match(robots, /^Sitemap: https:\/\/adbles\.com\/sitemap\.xml$/m);
  assert.match(robots, /^Sitemap: https:\/\/adbles\.com\/info\/sitemap-info\.xml$/m);

  // 사이트맵 규격: XML 선언, urlset 네임스페이스, 절대 URL, XML Content-Type.
  assert.match(route, /<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(route, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  assert.match(route, /\$\{SITE_URL\}\/posts\/\$\{post\.slug\}/);
  assert.match(route, /"Content-Type": "application\/xml; charset=utf-8"/);

  // noindex 페이지는 실으면 안 된다. 서치콘솔이 충돌로 잡는다.
  for (const noindexPath of ["/search"]) {
    assert.ok(!route.includes(`path: "${noindexPath}"`), `${noindexPath}는 noindex라 사이트맵에 넣을 수 없습니다.`);
  }

  // 대상 카테고리가 실제로 쓰이고 있어야 빈 사이트맵이 되지 않는다.
  const infoCategories = [...route.matchAll(/^\s+"([^"]+)",$/gm)].map((match) => match[1]);
  assert.ok(infoCategories.length >= 3, `정보 카테고리를 ${infoCategories.length}개만 찾았습니다.`);
  const usedCategories = new Set([...content.matchAll(/category:"([^"]+)"/g)].map((match) => match[1]));
  assert.ok(
    infoCategories.some((category) => usedCategories.has(category)),
    `정보 사이트맵 카테고리 ${infoCategories.join(", ")} 중 실제로 쓰이는 것이 없습니다.`,
  );
});

test("본문의 내부 링크와 이미지가 실제로 존재한다", async () => {
  const content = await readFile(new URL("../lib/content.ts", import.meta.url), "utf8");

  // 글 본문에서 /posts/... 로 거는 링크는 실제 slug여야 한다. 오타 한 글자면
  // 독자에게는 404이고, 애드센스 심사에서도 깨진 링크로 잡힌다.
  const slugs = new Set([...content.matchAll(/slug:"([a-z0-9-]+)"/g)].map((match) => match[1]));
  const linkedSlugs = new Set([...content.matchAll(/href="\/posts\/([a-z0-9-]+)"/g)].map((match) => match[1]));
  assert.ok(linkedSlugs.size > 20, `내부 링크를 ${linkedSlugs.size}종만 찾았습니다.`);
  for (const linked of linkedSlugs) {
    assert.ok(slugs.has(linked), `/posts/${linked} 는 존재하지 않는 slug입니다.`);
  }

  // 본문이 참조하는 이미지 파일도 실제로 있어야 한다.
  const imageRefs = new Set([...content.matchAll(/src="(\/article-(?:images|thumbnails)\/[^"]+)"/g)].map((match) => match[1]));
  for (const ref of imageRefs) {
    const file = new URL(`../public${ref}`, import.meta.url);
    await access(file);
  }
});

test("네이버 사이트 소유확인 코드가 모두 남아 있다", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

  // 서치어드바이저는 www와 non-www를 별개 사이트로 본다. 사이트를 추가할 때마다
  // 코드가 늘어나므로 배열로 유지해야 한다. 하나를 지우면 그 속성의 확인이 풀린다.
  const codes = ["afe0ef74210245a649d66c3a595329e9", "203792399c25da8d31e7b2eb66cc132ba531193f"];
  for (const code of codes) {
    assert.match(layout, new RegExp(code), `naver-site-verification 코드 ${code} 가 사라졌습니다.`);
  }
  assert.match(layout, /"naver-site-verification":\s*\[/, "코드를 배열로 두어야 여러 개가 함께 렌더됩니다.");

  // 파일 방식 확인용 파일도 함께 유지한다.
  await access(new URL("../public/naverafe0ef74210245a649d66c3a595329e9.html", import.meta.url));
});

test("자사 사이트를 안내하는 글은 제휴 관계를 본문 앞부분에서 밝힌다", async () => {
  const [content, enrichment, disclosure] = await Promise.all([
    readFile(new URL("../lib/content.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/article-enrichment.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/disclosure/page.tsx", import.meta.url), "utf8"),
  ]);

  // 공정위 표시·광고 심사지침은 경제적 이해관계를 독자가 판단하기 전에 보이는
  // 위치에 두라고 한다. 글 끝으로 밀면 위치 요건을 못 맞춘다.
  const post = content.slice(content.indexOf('slug:"affiliate-info-site-real-case"'));
  const body = post.slice(post.indexOf("body:`") + 6, post.indexOf("`, category:"));
  const notice = body.indexOf("애드블스가 직접 만든 자사 사이트");
  assert.ok(notice >= 0, "자사 운영 고지 문장이 사라졌습니다.");
  assert.ok(notice < 400, `고지가 본문 ${notice}자 뒤에 있습니다. 첫 문단에 두어야 합니다.`);
  assert.match(body, /수수료가 발생할 수 있습니다/, "수수료 발생 사실을 밝혀야 합니다.");

  // 자사 도메인을 "공식자료"로 자동 표시하면 제3자 공식 출처처럼 보인다.
  assert.match(enrichment, /isSelfOperatedUrl/, "자사 도메인 제외 로직이 사라졌습니다.");
  assert.match(enrichment, /urls\.filter\(\(url\) => !isSelfOperatedUrl\(url\)\)/);

  // 제휴 글을 발행한 뒤에도 "제휴 추천이 없다"고 적어두면 고지가 거짓이 된다.
  assert.doesNotMatch(disclosure, /별도의 제휴 추천이 없습니다/);
  assert.match(disclosure, /제휴 링크가 있어/);
});

test("편집자 이름은 실존 인물처럼 보이지 않고, 글마다 AI 편집 사실을 밝힌다", async () => {
  const [team, content, postPage, authorPage, css] = await Promise.all([
    readFile(new URL("../lib/editorial-team.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/content.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/posts/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/author/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  // 애드센스 정책은 "콘텐츠 제작자에 대한 정보를 허위로 전달하거나 숨기는" 것을
  // 막는다. 연금·세금·건강처럼 신뢰가 걸린 주제에서 실존 인물로 읽히는 이름을
  // 저자로 달면 여기에 걸린다. 성+이름 두 글자 형태를 아예 못 쓰게 막는다.
  const names = [...team.matchAll(/name: "([^"]+)"/g)].map((match) => match[1]);
  assert.ok(names.length >= 10, `편집자를 ${names.length}명만 찾았습니다.`);
  const surnames = "김이박최정강조윤장임한오서신권황안송류전홍";
  for (const name of names) {
    assert.ok(
      !(name.length === 3 && surnames.includes(name[0])),
      `"${name}" 은 실존 인물 이름으로 읽힙니다. 담당 업무를 가리키는 운영명을 쓰세요.`,
    );
  }

  // 글에 붙은 저자가 편집실에 없으면 표기가 어긋난다.
  const defined = new Set(names);
  for (const [, used] of content.matchAll(/authorName:"([^"]+)"/g)) {
    assert.ok(defined.has(used), `authorName "${used}" 이 editorial-team.ts에 없습니다.`);
  }

  // 고지는 /author 페이지에만 두면 글만 보는 독자에게 닿지 않는다.
  assert.match(team, /AI_EDITORIAL_NOTICE/);
  assert.match(postPage, /className="byline-ai"/, "바이라인의 AI 편집 표시가 사라졌습니다.");
  assert.match(postPage, /AI_EDITORIAL_NOTICE/, "본문 하단 고지가 사라졌습니다.");
  assert.match(postPage, /authorMetaName\(author\)/, "meta author가 사람 이름처럼 나갑니다.");
  assert.match(authorPage, /editorial-ai-disclosure/, "/author 상단 고지가 사라졌습니다.");
  for (const selector of [".byline-ai", ".ai-editorial-notice", ".editorial-ai-disclosure"]) {
    assert.ok(css.includes(selector), `${selector} 스타일이 없습니다.`);
  }
});

test("수익 금액을 약속하거나 지역명만 바꾼 페이지를 두지 않는다", async () => {
  // 애드센스 정책은 "'단기 고수익' 비법" 형태의 주장과, 게시자 콘텐츠가 없거나
  // 가치가 별로 없는 화면을 금지한다. adbles.com은 이 두 가지로 정책 위반 판정을
  // 받은 적이 있다. 같은 모양이 다시 들어오면 여기서 잡는다.
  const [portal, chrome, mobileMenu, challenge, home] = await Promise.all([
    readFile(new URL("../lib/portal.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/SiteChrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/MobileMenu.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/challenge/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);

  // 내비게이션과 챌린지 페이지에 구체적인 수입 금액을 걸지 않는다.
  // 전역 메뉴에 있으면 심사자가 어느 페이지를 열어도 보인다.
  //
  // 기간과 금액이 붙은 형태를 그 자체로 막는다. 예전에는 금액 뒤 12자 안에
  // "수입·벌다·만들기" 같은 말이 와야 걸리게 두어, 워크북 목차의 "월 100만원을
  // 주 단위로 쪼개기"와 "월 100만원 조합표"가 테스트를 통과한 채 라이브에 남았다.
  // 지출·자금 쪽 숫자("월 부족액 250만 원", "자금 6,000만 원")는 기간 바로 뒤에
  // 금액이 오지 않으므로 걸리지 않는다.
  const moneyPromise = /(월|주|하루)\s?(수입|수익|매출|목표)?\s?\d[\d,]*\s?만\s?원/;
  const moneyClaim = /\d[\d,]*\s?만\s?원[^<"]{0,12}(수입|벌|버는|만들기|달성|보장|가능)/;
  for (const [name, source] of [["portal", portal], ["SiteChrome", chrome], ["MobileMenu", mobileMenu], ["challenge", challenge], ["home", home]]) {
    assert.doesNotMatch(source, moneyPromise, `${name}에 기간별 수입 금액을 제시하는 문구가 있습니다.`);
    assert.doesNotMatch(source, moneyClaim, `${name}에 수입 금액을 약속하는 문구가 있습니다.`);
  }
  // 결과가 사람마다 다르다는 고지는 남아 있어야 한다.
  assert.match(challenge, /수익을 약속하지 않습니다/);

  // 템플릿만 같고 지역명만 바뀌는 페이지는 다시 만들지 않는다.
  for (const dir of ["../app/keyword-lab", "../app/local"]) {
    await assert.rejects(access(new URL(dir, import.meta.url)), `${dir} 가 되살아났습니다.`);
  }
  assert.doesNotMatch(portal, /liveKeywordPages/, "지역 페이지 목록이 되살아났습니다.");
  for (const [name, source] of [["SiteChrome", chrome], ["MobileMenu", mobileMenu], ["home", home], ["portal", portal]]) {
    assert.doesNotMatch(source, /\/keyword-lab/, `${name}에 삭제된 /keyword-lab 링크가 남아 있습니다.`);
  }
});
