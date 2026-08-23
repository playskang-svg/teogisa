import type { Metadata } from "next";
import { getPublishedPosts } from "../lib/repository";
import { Brand, PortalNav, SiteFooter } from "./components/SiteChrome";
import { MobileMenu } from "./components/MobileMenu";
import { ArticleThumbnail } from "./components/ArticleMedia";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "../lib/site";
import { toolCatalog } from "../lib/portal";

// 자동화가 발행한 글이 재배포 없이 반영되어야 합니다.
// 기존 Cloudflare 엣지 캐시(s-maxage=300)와 같은 주기로 재생성합니다.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "퇴직 후 생활비·지원제도·새 수입 가이드",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const journeys = [
  { label: "생활비 방어", value: "실업급여·지원금", tone: "blue" },
  { label: "현금흐름 1", value: "재취업·N잡", tone: "teal" },
  { label: "현금흐름 2", value: "콘텐츠·AI", tone: "orange" },
  { label: "자산 만들기", value: "투자·재테크", tone: "navy" },
];

const categories = [
  ["퇴직 준비", "흔들리지 않도록 먼저 숫자를 정리합니다.", "01"],
  ["정부지원·실업급여", "놓치기 쉬운 제도를 공식 자료로 확인합니다.", "02"],
  ["재취업·N잡", "경험을 다시 소득으로 바꾸는 방법을 찾습니다.", "03"],
  ["블로그·애드센스", "검색되는 글이 수익이 되는 과정을 기록합니다.", "04"],
  ["AI 활용", "혼자서도 오래 운영할 수 있게 일을 줄입니다.", "05"],
  ["온라인 부업", "작게 검증하고 되는 것에 시간을 더 씁니다.", "06"],
  ["투자·재테크", "버는 돈을 지키고 천천히 불립니다.", "07"],
  ["실제 수익실험", "말보다 숫자로, 과정과 결과를 공개합니다.", "08"],
];

export default async function Home() {
  const posts = await getPublishedPosts();
  const recentPosts=posts.slice(0,5);
  const jsonLd = {"@context":"https://schema.org","@graph":[
    {"@type":"Organization","@id":`${SITE_URL}/#organization`,name:SITE_NAME,legalName:"애드블스",url:SITE_URL,logo:{"@type":"ImageObject",url:`${SITE_URL}/brand-mark-v2.png`},contactPoint:{"@type":"ContactPoint",contactType:"customer support",email:"master@adbles.com",url:`${SITE_URL}/contact`,availableLanguage:"Korean"}},
    {"@type":"WebSite","@id":`${SITE_URL}/#website`,url:SITE_URL,name:SITE_NAME,description:SITE_DESCRIPTION,publisher:{"@id":`${SITE_URL}/#organization`},inLanguage:"ko-KR",potentialAction:{"@type":"SearchAction",target:{"@type":"EntryPoint",urlTemplate:`${SITE_URL}/search?q={search_term_string}`},"query-input":"required name=search_term_string"}},
    {"@type":"WebPage","@id":`${SITE_URL}/#webpage`,url:SITE_URL,name:SITE_NAME,description:SITE_DESCRIPTION,isPartOf:{"@id":`${SITE_URL}/#website`},about:["퇴직 준비","생활비","재취업","중장년 부업","건강 관리"]}
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
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{SITE_TAGLINE}</p>
            <h1>퇴직 후 막막함을,<br/><em>실행 가능한 계획으로.</em></h1>
            <p className="hero-lead">내 돈이 몇 달을 버틸지 계산하고, 놓치기 쉬운 지원을 챙기고, 지금까지의 경험으로 새로운 수입을 만드는 순서까지. 오늘 필요한 한 단계부터 시작하세요.</p>
            <dl className="hero-facts" aria-label="사이트 콘텐츠 현황">
              <div><dt>발행한 연구노트</dt><dd>{posts.length}편</dd></div><div><dt>30일 워크북</dt><dd>30칸</dd></div><div><dt>사용 가능 도구</dt><dd>{toolCatalog.filter(tool=>tool.status==="사용 가능").length}개</dd></div>
            </dl>
            <div className="hero-actions">
              <a className="primary-button" href="/tools/retirement-runway">내 준비기간 계산하기 <span aria-hidden="true">→</span></a>
              <a className="text-button" href="/challenge">30일 수입 챌린지</a>
            </div>
          </div>
          <figure className="hero-project-visual">
            <div className="hero-image-window"><img src="/project-hero-v2.jpg" width="1600" height="840" alt="퇴직 후 경험을 새로운 수입으로 연결하는 중년의 작업 장면" fetchPriority="high"/></div>
            <figcaption><span>SECOND INCOME PROJECT</span><strong>경험을 수입으로 바꾸는<br/>두 번째 시작</strong></figcaption>
            <div className="hero-visual-badge" aria-hidden="true"><b>30</b><span>DAY<br/>ACTION</span></div>
          </figure>
        </section>

        <section className="recent-posts section-wrap" aria-labelledby="recent-posts-title">
          <header className="recent-posts-header">
            <div><p className="eyebrow">LATEST UPDATES</p><h2 id="recent-posts-title">최근 발행 글</h2></div>
            <a href="/search">모든 글 보기 <span aria-hidden="true">→</span></a>
          </header>
          <ol className="recent-title-list">
            {recentPosts.map(post=><li key={post.slug}><a href={`/posts/${post.slug}`}><span className="recent-post-category">{post.category}</span><strong>{post.title}</strong><span className="recent-post-arrow" aria-hidden="true">→</span></a></li>)}
          </ol>
        </section>

        <section className="home-hubs section-wrap" aria-labelledby="hub-title">
          <div className="section-heading"><div><p className="eyebrow">지금 가장 불안한 것부터</p><h2 id="hub-title">내 상황에 맞는 답을 골라보세요.</h2><p className="section-intro">한꺼번에 준비하려 애쓰지 않아도 됩니다. 생활비, 받을 수 있는 제도, 새로운 일, 지역 정보, 건강 중 지금 필요한 곳에서 시작하세요.</p></div></div>
          <div className="hub-grid">
            <a href="/challenge"><span>새 수입</span><h3>내 경험으로 첫 수입 만들기</h3><p>막연한 부업 찾기를 멈추고, 하루 한 가지 행동으로 가능성을 시험합니다.</p><b>30일 워크북 시작 →</b></a>
            <a href="/official-info"><span>놓친 혜택</span><h3>내가 받을 수 있는 제도 찾기</h3><p>지원금·실업급여·연금·세금 정보를 상황별로 찾아갈 수 있습니다.</p><b>확인 순서 보기 →</b></a>
            <a href="/tools"><span>무료 계산</span><h3>숫자로 불안 줄이기</h3><p>퇴직생활비와 예상 퇴직금을 직접 계산해 다음 선택의 기준을 만듭니다.</p><b>도구 사용하기 →</b></a>
            <a href="/keyword-lab"><span>우리 지역</span><h3>가까운 기회부터 찾기</h3><p>사는 곳에 따라 달라지는 일자리와 지원 정보를 지역별로 찾아봅니다.</p><b>지역 정보 보기 →</b></a>
            <a href="/health"><span>건강</span><h3>오래 일하기 위한 몸 챙기기</h3><p>놓치기 쉬운 위험 신호와 생활 속 예방 행동을 쉽게 확인합니다.</p><b>건강 체크 시작 →</b></a>
          </div>
        </section>

        <section className="journey-strip" id="roadmap" aria-label="수입 로드맵 단계">
          <div className="journey-intro"><span>지금부터</span><strong>4개의 수입 층을<br/>차례로 쌓습니다.</strong></div>
          {journeys.map((item, index) => (
            <div className={`journey-card ${item.tone}`} key={item.label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </div>
          ))}
        </section>

        <section className="latest section-wrap" id="latest">
          <div className="section-heading">
            <div><p className="eyebrow">지금 많이 필요한 질문 · {posts.length}편</p><h2>오늘 바로 써먹을 수 있는 글</h2><p className="section-intro">읽고 나면 계산할 숫자, 확인할 서류, 오늘 해볼 행동 하나가 남는 글부터 골랐습니다.</p></div>
            <a href="/search">모든 글 보기 <span aria-hidden="true">→</span></a>
          </div>
          <div className="post-grid">
            {posts.slice(0, 3).map((post, index) => (
              <article className={`post-card post-${index + 1}`} key={post.slug}>
                <ArticleThumbnail post={post}/>
                <div className="post-body">
                  <p className="post-meta">{index === 0 ? "이번 주 대표 글" : post.category} · {post.readingMinutes}분</p>
                  <h3><a href={`/posts/${post.slug}`}>{post.title}</a></h3>
                  <p>{post.excerpt}</p>
                  <a className="read-more" href={`/posts/${post.slug}`}>읽어보기 <span aria-hidden="true">↗</span></a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="tool-promo section-wrap" aria-labelledby="tool-title">
          <div className="tool-promo-copy"><p className="eyebrow">FREE RETIREMENT TOOL</p><h2 id="tool-title">지금 가진 돈으로<br/>몇 개월을 버틸 수 있을까요?</h2><p>보유 자금, 월 필수생활비, 고정 수입 세 가지만 입력하면 재취업과 새 수입원을 준비할 수 있는 시간을 바로 계산합니다. 입력값은 저장하지 않습니다.</p><a className="primary-button" href="/tools/retirement-runway">퇴직생활비 계산기 <span aria-hidden="true">→</span></a></div>
          <div className="tool-promo-result" aria-hidden="true"><span>예시 계산</span><strong>24개월</strong><p>자금 6,000만 원<br/>월 부족액 250만 원</p></div>
        </section>

        <section className="topics section-wrap" id="topics">
          <div className="section-heading topic-heading"><div><p className="eyebrow">THE RESEARCH SHELF</p><h2>필요한 주제부터 꺼내 보세요.</h2></div></div>
          <div className="topic-list">
            {categories.map(([title, description, number]) => (
              <a href={`/search?category=${encodeURIComponent(title)}`} className="topic-row" key={title}>
                <span>{number}</span><strong>{title}</strong><p>{description}</p><b aria-hidden="true">→</b>
              </a>
            ))}
          </div>
        </section>

        <section className="closing-note">
          <p className="eyebrow">START WITH THE NUMBERS</p>
          <h2>오늘 할 일은 하나면 됩니다.<br/><em>내 최소 생활비부터 적어보기.</em></h2>
          <a className="primary-button" href="/posts/first-30-days-after-retirement">첫 30일 체크리스트 <span aria-hidden="true">→</span></a>
        </section>
      </main>

      <SiteFooter/>
    </>
  );
}
