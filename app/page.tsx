import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "../lib/repository";
import { Brand, PortalNav, SiteFooter } from "./components/SiteChrome";
import { MobileMenu } from "./components/MobileMenu";
import { ArticleThumbnail } from "./components/ArticleMedia";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../lib/site";

export const metadata: Metadata = {
  title: "퇴직 후 생활비·지원제도·새 수입 가이드",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export const revalidate = 3600;

// 홈은 콘텐츠 탐색이 목적이다. 브랜드 소개와 슬로건은 /about으로 옮겼다.
// 첫 화면에서 바로 글을 고를 수 있도록 주제 이동 → 최신 글 → 주제별 모아보기
// 순서로 둔다.
const LATEST_COUNT = 12;
const PER_CATEGORY = 4;

/** 왼쪽부터 자주 찾는 순서. 여기 없는 카테고리는 글 수가 많은 순으로 뒤에 붙는다. */
const categoryOrder = [
  "퇴직금·노후 생활비",
  "실업급여",
  "국민연금·퇴직연금",
  "건강보험료·건강검진",
  "정부지원금·세금",
  "퇴직 후 부업·N잡",
  "중장년 재취업·창업",
  "AI 활용·바이브코딩",
  "무료 도구 활용법",
];

function groupByCategory(posts: Awaited<ReturnType<typeof getPublishedPosts>>) {
  const groups = new Map<string, typeof posts>();
  for (const post of posts) {
    const bucket = groups.get(post.category);
    if (bucket) bucket.push(post);
    else groups.set(post.category, [post]);
  }
  return [...groups.entries()].sort((a, b) => {
    const orderA = categoryOrder.indexOf(a[0]);
    const orderB = categoryOrder.indexOf(b[0]);
    if (orderA !== -1 && orderB !== -1) return orderA - orderB;
    if (orderA !== -1) return -1;
    if (orderB !== -1) return 1;
    return b[1].length - a[1].length;
  });
}

// 카드 제목도 메뉴와 같은 검색어로 시작한다. 홈에서 허브로 가는 링크가
// 사이트 안에서 가장 많이 반복되는 앵커텍스트다.
const situationHubs = [
  { href: "/tools", label: "무료 계산", title: "퇴직금·퇴직생활비 계산하기", body: "예상 퇴직금과 보유 자금이 버틸 기간을 직접 계산해 다음 선택의 기준을 만듭니다." },
  { href: "/official-info", label: "놓친 혜택", title: "실업급여·국민연금 확인하기", body: "실업급여·연금·건강보험·지원금을 공식 창구에서 상황별로 찾아갈 수 있습니다." },
  { href: "/challenge", label: "새 수입", title: "퇴직 후 부업 시작하기", body: "막연한 부업 찾기를 멈추고, 하루 한 가지 행동으로 가능성을 시험합니다." },
  { href: "/health", label: "건강", title: "퇴직 후 건강검진 챙기기", body: "회사 검진이 끊긴 뒤 받아야 할 검사와 놓치기 쉬운 위험 신호를 확인합니다." },
];

export default async function Home() {
  const posts = await getPublishedPosts();
  const latest = posts.slice(0, LATEST_COUNT);
  const grouped = groupByCategory(posts);
  const jsonLd = {"@context":"https://schema.org","@graph":[
    {"@type":"Organization","@id":`${SITE_URL}/#organization`,name:SITE_NAME,legalName:"애드블스",url:SITE_URL,logo:{"@type":"ImageObject",url:`${SITE_URL}/brand-mark-v2.png`},contactPoint:{"@type":"ContactPoint",contactType:"customer support",email:"master@adbles.com",url:`${SITE_URL}/contact`,availableLanguage:"Korean"}},
    {"@type":"WebSite","@id":`${SITE_URL}/#website`,url:SITE_URL,name:SITE_NAME,description:SITE_DESCRIPTION,publisher:{"@id":`${SITE_URL}/#organization`},inLanguage:"ko-KR",potentialAction:{"@type":"SearchAction",target:{"@type":"EntryPoint",urlTemplate:`${SITE_URL}/search?q={search_term_string}`},"query-input":"required name=search_term_string"}},
    {"@type":"CollectionPage","@id":`${SITE_URL}/#webpage`,url:SITE_URL,name:SITE_NAME,description:SITE_DESCRIPTION,isPartOf:{"@id":`${SITE_URL}/#website`},about:["퇴직금","퇴직 후 생활비","실업급여","국민연금","중장년 재취업","퇴직 후 부업","건강검진"]}
  ]};

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/>
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>
      <header className="site-header">
        <Brand/>
        <PortalNav className="main-nav"/>
        <div className="header-tools"><a className="tool-link" href="/tools/retirement-runway">내 준비기간 계산</a><a className="search-link" href="/search" aria-label="글 검색">검색 <span>⌕</span></a><MobileMenu/></div>
      </header>

      <main id="main-content">
        <aside className="home-value-bar" aria-label="연구소 핵심 안내">
          <div className="home-value-inner">
            <span className="home-value-badge">퇴직생활연구소</span>
            <p className="home-value-text">
              퇴직 전후 3년, 막막한 생활비·정부지원제도·새 수입을 숫자로 알기 쉽게 정리합니다.
            </p>
            <a className="home-value-link" href="/tools/retirement-runway">
              내 준비기간 계산 <span aria-hidden="true">→</span>
            </a>
          </div>
        </aside>

        <nav className="topic-nav" aria-label="주제별 글 찾기">
          <ul>
            <li><a className="topic-nav-all" href="/search">전체 {posts.length}편</a></li>
            {grouped.map(([category, items]) => (
              <li key={category}>
                <a href={`#cat-${encodeURIComponent(category)}`}>{category} <b>{items.length}</b></a>
              </li>
            ))}
          </ul>
        </nav>

        <section className="latest section-wrap" id="latest" aria-labelledby="recent-posts-title">
          <div className="section-heading">
            <div><h2 id="recent-posts-title">최근 발행 글</h2></div>
            <a href="/search">모든 글 보기 <span aria-hidden="true">→</span></a>
          </div>
          <div className="explore-grid">
            {latest.map((post) => (
              <article className="post-card" key={post.slug}>
                <Link className="post-card-link" href={`/posts/${post.slug}`}>
                  <ArticleThumbnail post={post}/>
                  <div className="post-body">
                    <p className="post-meta">{post.category} · {post.readingMinutes}분</p>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="category-browse section-wrap" aria-labelledby="category-browse-title">
          <div className="section-heading"><div><h2 id="category-browse-title">주제별로 모아보기</h2></div></div>
          <div className="category-columns">
            {grouped.map(([category, items]) => (
              <section className="category-column" id={`cat-${encodeURIComponent(category)}`} key={category}>
                <h3>{category} <span>{items.length}편</span></h3>
                <ul>
                  {items.slice(0, PER_CATEGORY).map((post) => (
                    <li key={post.slug}><a href={`/posts/${post.slug}`}>{post.title}</a></li>
                  ))}
                </ul>
                {items.length > PER_CATEGORY && (
                  <a className="category-more" href={`/search?category=${encodeURIComponent(category)}`}>
                    {category} 전체 보기 <span aria-hidden="true">→</span>
                  </a>
                )}
              </section>
            ))}
          </div>
        </section>

        <section className="home-hubs section-wrap" aria-labelledby="hub-title">
          <div className="section-heading"><div><h2 id="hub-title">지금 상황부터 고르셔도 됩니다</h2></div></div>
          <div className="hub-grid">
            {situationHubs.map((hub) => (
              <a href={hub.href} key={hub.href}><span>{hub.label}</span><h3>{hub.title}</h3><p>{hub.body}</p><b>바로 가기 →</b></a>
            ))}
          </div>
        </section>

        <section className="tool-promo section-wrap" aria-labelledby="tool-title">
          <div className="tool-promo-copy"><p className="eyebrow">FREE RETIREMENT TOOL</p><h2 id="tool-title">지금 가진 돈으로<br/>몇 개월을 버틸 수 있을까요?</h2><p>보유 자금, 월 필수생활비, 고정 수입 세 가지만 입력하면 재취업과 새 수입원을 준비할 수 있는 시간을 바로 계산합니다. 입력값은 저장하지 않습니다.</p><a className="primary-button" href="/tools/retirement-runway">퇴직생활비 계산기 <span aria-hidden="true">→</span></a></div>
          <div className="tool-promo-result" aria-hidden="true"><span>예시 계산</span><strong>24개월</strong><p>자금 6,000만 원<br/>월 부족액 250만 원</p></div>
        </section>
      </main>

      <SiteFooter/>
    </>
  );
}
