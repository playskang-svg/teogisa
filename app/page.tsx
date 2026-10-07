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

const LATEST_COUNT = 5; // 1 hero + 4 side
const PER_CATEGORY = 4;

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

const situationHubs = [
  { href: "/tools", label: "무료 계산", title: "퇴직금·퇴직생활비 계산하기", body: "예상 퇴직금과 보유 자금이 버틸 기간을 직접 계산해 다음 선택의 기준을 만듭니다." },
  { href: "/official-info", label: "놓친 혜택", title: "실업급여·국민연금 확인하기", body: "실업급여·연금·건강보험·지원금을 공식 창구에서 상황별로 찾아갈 수 있습니다." },
  { href: "/challenge", label: "새 수입", title: "퇴직 후 부업 시작하기", body: "막연한 부업 찾기를 멈추고, 하루 한 가지 행동으로 가능성을 시험합니다." },
  { href: "/health", label: "건강", title: "퇴직 후 건강검진 챙기기", body: "회사 검진이 끊긴 뒤 받아야 할 검사와 놓치기 쉬운 위험 신호를 확인합니다." },
];

export default async function Home() {
  const posts = await getPublishedPosts();
  
  // Hero and Top Stories
  const heroPost = posts[0];
  const topStories = posts.slice(1, LATEST_COUNT);
  
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

      <main id="main-content" className="newsroom-layout">
        <div className="newsroom-main">
          
          {/* Hero Section */}
          <section className="newsroom-hero" aria-labelledby="hero-title">
            <h2 id="hero-title" className="sr-only" style={{display: 'none'}}>최신 주요 기사</h2>
            
            <div className="newsroom-hero-main">
              {heroPost && (
                <Link href={`/posts/${heroPost.slug}`} className="hero-link">
                  <ArticleThumbnail post={heroPost} variant="hero" />
                </Link>
              )}
            </div>
            
            <div className="newsroom-hero-side">
              {topStories.map((post) => (
                <article className="post-card" key={post.slug}>
                  <Link href={`/posts/${post.slug}`} className="post-card-link" style={{display: 'contents'}}>
                    <ArticleThumbnail post={post} variant="search" />
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

          {/* Categories Grid */}
          <section aria-labelledby="category-browse-title">
            <h2 id="category-browse-title" className="sr-only" style={{display: 'none'}}>주제별로 모아보기</h2>
            
            {grouped.map(([category, items]) => {
              if (items.length === 0) return null;
              return (
                <div className="newsroom-category-block" id={`cat-${encodeURIComponent(category)}`} key={category}>
                  <div className="newsroom-category-block-header">
                    <h2>{category}</h2>
                    {items.length > PER_CATEGORY && (
                      <a href={`/search?category=${encodeURIComponent(category)}`}>
                        모두 보기 <span aria-hidden="true">→</span>
                      </a>
                    )}
                  </div>
                  <div className="newsroom-category-grid">
                    {items.slice(0, PER_CATEGORY).map((post) => (
                      <article className="post-card" key={post.slug}>
                        <Link href={`/posts/${post.slug}`} className="post-card-link" style={{display: 'contents'}}>
                          <ArticleThumbnail post={post} variant="search" />
                          <div className="post-body">
                            <p className="post-meta">{post.category} · {post.readingMinutes}분</p>
                            <h3>{post.title}</h3>
                            <p>{post.excerpt}</p>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

        </div>

        {/* Sidebar */}
        <aside className="newsroom-sidebar" aria-label="사이드바">
          <div className="newsroom-sidebar-sticky">
            <div className="sidebar-widget">
              <h3 className="sidebar-widget-title">상황별 솔루션</h3>
              <div>
                {situationHubs.map((hub) => (
                  <a href={hub.href} key={hub.href} className="sidebar-hub-item">
                    <span>{hub.label}</span>
                    <h4>{hub.title}</h4>
                    <p>{hub.body}</p>
                  </a>
                ))}
              </div>
            </div>

            <div className="sidebar-widget" style={{marginTop: '32px', backgroundColor: '#e67b32', color: '#fff', border: 'none'}}>
              <h3 className="sidebar-widget-title" style={{color: '#fff', borderColor: 'rgba(255,255,255,0.3)'}}>퇴직생활비 계산기</h3>
              <p style={{fontSize: '13px', lineHeight: '1.6', marginBottom: '16px'}}>지금 가진 돈으로 몇 개월을 버틸 수 있을까요? 준비기간을 미리 파악해보세요.</p>
              <a href="/tools/retirement-runway" style={{display: 'inline-block', backgroundColor: '#fff', color: '#e67b32', padding: '8px 16px', borderRadius: '4px', fontSize: '13px', fontWeight: '800'}}>바로 계산하기 →</a>
            </div>
          </div>
        </aside>

      </main>

      <SiteFooter/>
    </>
  );
}
