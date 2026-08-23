import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("renders the finished Korean content site", async () => {
  const [page, layout, search, article, media, enrichment, content, footer, mobileMenu, site, css, richEditor, articleHtml, readerTools, management, repository] = await Promise.all([
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
  ]);
  assert.match(layout, /퇴\.기\.사/);
  assert.match(site, /100세시대! 퇴직이 기회가 되는 사람들/);
  assert.match(page, /퇴직 후 막막함을/);
  assert.match(page, /내 돈이 몇 달을 버틸지 계산하고/);
  assert.doesNotMatch(page, /공식 자료 검토/);
  assert.match(page, /project-hero-v2\.jpg/);
  assert.match(page, /hero-project-visual/);
  assert.match(page, /본문으로 바로가기/);
  assert.match(page, /hero-facts/);
  assert.match(page, /최근 발행 글/);
  assert.match(page, /recentPosts=posts\.slice\(0,5\)/);
  assert.match(page, /recent-title-list/);
  assert.match(page, /recent-post-category[^}]+post\.category/);
  assert.match(css, /\.recent-title-list a\{min-height:64px/);
  assert.match(css, /\.recent-title-list \.recent-post-category/);
  assert.match(repository, /sortPostsNewestFirst/);
  assert.match(repository, /publishedAt\.slice\(0, 10\)\.localeCompare\(a\.publishedAt\.slice\(0, 10\)\)/);
  assert.match(repository, /publishedDateOrder \|\| b\.id - a\.id/);
  assert.match(page, /ContactPoint/);
  assert.match(page, /master@adbles\.com/);
  assert.match(page, /MobileMenu/);
  assert.match(mobileMenu, /전체 메뉴 열기/);
  assert.match(mobileMenu, /월 100만원 챌린지/);
  assert.match(mobileMenu, /지원금·세무·연금/);
  assert.match(mobileMenu, /유용한 도구/);
  assert.match(mobileMenu, /건강·예방/);
  assert.match(css, /mobile-menu-drawer/);
  assert.match(css, /\.article-copy ul\{list-style:disc\}/);
  assert.match(css, /\.article-copy ol\{list-style:decimal\}/);
  assert.match(css, /trust-band/);
  assert.match(css, /grid-template-columns:1\.18fr \.82fr/);
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
  assert.match(css, /footer-contact/);
  assert.match(layout, /fonts\.googleapis\.com\/css2/);
  assert.match(layout, /Noto\+Sans\+KR/);
  assert.equal((layout.match(/google-adsense-account/g) ?? []).length, 1);
  assert.match(layout, /<meta name="google-adsense-account" content="ca-pub-4030620718116834"\/>/);
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
  assert.doesNotMatch(content, /990원|2,000원/);
  assert.match(content, /ProShot에 업로드하기 전 휴대폰 정면 셀카 예시/);
  assert.match(content, /ProShot으로 생성한 정장 차림의 스튜디오 비즈니스 프로필 사진 예시/);
  assert.match(content, /retirement-pay-irp-five-checks-before-withdrawal/);
  assert.match(content, /retirement-pay-irp-five-checks-before-withdrawal[\s\S]*publishedAt:"2026-08-15"/);
  assert.match(content, /proshot-mobile-id-studio-photo-guide[\s\S]*publishedAt:"2026-08-15"/);
  assert.match(content, /퇴직금이 IRP에 입금된 뒤 일시금과 연금 수령 절차를 확인하는 서류·일정표 일러스트/);
  assert.match(content, /박세온 · 세금·보험 편집자/);
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
  assert.match(media, /loading=\{variant === "hero" \? "eager" : "lazy"\}/);
  assert.match(css, /object-fit:cover/);
  assert.match(css, /object-fit:contain/);
  assert.match(css, /article-flow/);
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
  assert.match(css, /reader-large \.article-flow\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
  assert.match(articleHtml, /sanitizeArticleHtml/);
  assert.match(articleHtml, /blockedElements/);
  assert.match(articleHtml, /youtube-nocookie/);
  assert.doesNotMatch(`${page}\n${search}\n${article}\n${footer}`, /next\/link|<Link/);
  assert.doesNotMatch(`${page}\n${layout}`, /codex-preview|react-loading-skeleton/i);
});

test("redirects www to the canonical apex domain", async () => {
  const worker = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.match(worker, /url\.hostname === "www\.adbles\.com"/);
  assert.match(worker, /url\.hostname = "adbles\.com"/);
  assert.match(worker, /Response\.redirect\(url\.toString\(\), 301\)/);
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
  const [home,chrome,challenge,workbook,official,portal,tools,severance,health,keyword,localPage,agentsApi,agentsData,repository,admin,sitemap]=await Promise.all([
    readFile(new URL("../app/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/components/SiteChrome.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/challenge/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/challenge/ChallengeWorkbook.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/official-info/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../lib/portal.ts",import.meta.url),"utf8"),
    readFile(new URL("../app/tools/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/tools/severance-pay/SeveranceCalculator.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/health/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/keyword-lab/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/local/[region]/[topic]/page.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/api/agents/route.ts",import.meta.url),"utf8"),
    readFile(new URL("../lib/content-agents.ts",import.meta.url),"utf8"),
    readFile(new URL("../lib/repository.ts",import.meta.url),"utf8"),
    readFile(new URL("../app/admin/AdminClient.tsx",import.meta.url),"utf8"),
    readFile(new URL("../app/sitemap.ts",import.meta.url),"utf8"),
  ]);
  assert.match(home,/30일 수입 챌린지/);
  assert.match(chrome,/portalMenu/);
  assert.match(challenge,/내 경험으로 월 100만원 수입에 도전하기/);
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
  assert.match(severance,/예상 퇴직금/);
  assert.match(health,/youtube-nocookie\.com/);
  assert.match(health,/갑작스러운 위험 신호는 119/);
  assert.match(health,/이번 달 건강 점검/);
  assert.match(keyword,/우리 동네에서 시작할 수 있는 일과 지원/);
  assert.match(keyword,/index:false/);
  assert.match(localPage,/전화하기 전에 준비하면 좋은 질문/);
  assert.match(localPage,/index:false/);
  assert.match(agentsApi,/requireOwnerApi/);
  assert.match(agentsData,/health-column/);
  assert.match(repository,/runDueContentAgents/);
  assert.match(repository,/status:"draft"/);
  assert.match(repository,/경영관리팀의 발행정책 검토 대기열에 등록했습니다/);
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
  assert.match(companyRules,/월 100만원 수입 실험/);
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
  assert.match(editorialTeam, /name: "김기준"/);
  assert.match(editorialTeam, /name: "로컬"/);
  assert.match(editorialTeam, /name: "케어"/);
  assert.match(editorialTeam, /name: "박여유"/);
  assert.match(editorialTeam, /name: "서든든"/);
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
  assert.match(audit,/퇴\.기\.사 전 프로젝트/);
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
  assert.match(author, /AI 기반 실무자/);
  assert.match(post, /author\.role/);
  assert.match(post, /퇴\.기\.사 AI 편집자/);
  assert.match(sitemap, /contact/);
  assert.match(sitemap, /terms/);
  assert.match(content, /unemployment-benefit-eight-steps/);
  assert.match(content, /월별 장부에는 일곱 칸/);
  assert.match(content, /90일 동안 매주 같은 숫자를 기록합니다/);
  assert.match(repository, /adsense-readiness-v2/);
  assert.match(policy, /창작 과정에서 AI를 보조적으로 사용합니다/);
  assert.match(chrome, /WebPage/);
  assert.match(chrome, /BreadcrumbList/);
  assert.match(css, /scroll-snap-type:x mandatory/);
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

test("keeps the organization automation scheduler running without an external cron", async () => {
  const [repository, worker, cronRoute, automationRoute, admin, css, vercel, runbook] = await Promise.all([
    readFile(new URL("../lib/repository.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/cron/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/automation/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/AdminClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../vercel.json", import.meta.url), "utf8"),
    readFile(new URL("../AUTOMATION_RUNBOOK.md", import.meta.url), "utf8"),
  ]);

  // 한쪽 실패가 다른 자동화를 멈추지 않아야 합니다.
  assert.match(repository, /errors\.push\(`콘텐츠 에이전트/);
  assert.match(repository, /errors\.push\(`구성원 실행계획/);
  // next_run_at이 비어 실행 조건에 걸리지 않는 항목을 되살립니다.
  assert.match(repository, /reviveStalledAutomation/);
  assert.match(repository, /UPDATE content_agents SET next_run_at=\?,updated_at=CURRENT_TIMESTAMP WHERE status='active' AND next_run_at IS NULL/);
  assert.match(repository, /UPDATE member_activity_plans SET next_run_at=\?,updated_at=CURRENT_TIMESTAMP WHERE status='active' AND next_run_at IS NULL/);
  // 실행권은 한 번에 하나만 잡혀야 중복 실행이 생기지 않습니다.
  assert.match(repository, /runAutomationTickIfDue/);
  assert.match(repository, /WHERE site_settings\.value_json<=\?/);
  assert.match(repository, /getAutomationSchedulerStatus/);
  assert.match(repository, /AUTOMATION_TICK_INTERVAL_MINUTES=15/);

  // cron 트리거가 없는 환경에서도 일반 요청이 밀린 작업을 따라잡습니다.
  assert.match(worker, /shouldCatchUpAutomation/);
  assert.match(worker, /ctx\.waitUntil\(runAutomationTickIfDue\("request"\)/);
  assert.match(worker, /runScheduledOrganizationActivities\("cron"\)/);

  // 외부 스케줄러 입구는 비밀값이나 관리자 세션이 있어야 합니다.
  assert.match(cronRoute, /CRON_SECRET/);
  assert.match(cronRoute, /getAdminSession/);
  assert.match(cronRoute, /status: 401/);
  assert.match(cronRoute, /export async function GET/);
  assert.match(cronRoute, /export async function POST/);
  assert.match(vercel, /"path": "\/api\/cron"/);
  assert.match(vercel, /"schedule": "\*\/30 \* \* \* \*"/);

  // 관리자 화면에서 상태 확인과 즉시 실행이 가능해야 합니다.
  assert.match(automationRoute, /action === "run-scheduler"/);
  assert.match(automationRoute, /scheduler: await getAutomationSchedulerStatus\(\)/);
  assert.match(admin, /지금 자동화 실행/);
  assert.match(admin, /자동화 정지 감지/);
  assert.match(css, /\.scheduler-status\{/);
  assert.match(runbook, /\/api\/cron/);

  // 실패한 에이전트가 한정된 실행 슬롯을 독차지하면 정상 에이전트가 영원히 실행되지 못합니다.
  assert.match(repository, /AGENT_RETRY_BACKOFF_MINUTES=60/);
  assert.match(repository, /UPDATE content_agents SET next_run_at=\?,updated_at=CURRENT_TIMESTAMP WHERE id=\?/);
  // 품질 게이트 실패 사유는 어떤 기준이 모자란지 수치로 남겨야 합니다.
  assert.match(repository, /본문 \$\{plain\.length\}자\/최소 900자/);
});
