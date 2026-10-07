import { COMPANY_NAME, COMPANY_URL, SITE_NAME, SITE_TAGLINE, SITE_URL } from "../../lib/site";
import { portalMenu } from "../../lib/portal";
import { MobileMenu } from "./MobileMenu";

export function Brand() {
  return <a className="brand" href="/" aria-label={`${SITE_NAME} 홈`}><img className="brand-logo" src="/brand-mark-v2.png" width="40" height="40" alt={SITE_NAME}/><span className="brand-copy"><strong>{SITE_NAME}</strong><small>{SITE_TAGLINE}</small></span></a>;
}

export function PortalNav({ className="portal-nav" }:{className?:string}){
  return <nav className={className} aria-label="주요 서비스">{portalMenu.map(item=><a href={item.href} key={item.href}>{item.label}</a>)}</nav>;
}

export function InnerHeader({ eyebrow, title, description, path }:{ eyebrow:string; title:string; description?:string; path?:string }) {
  const url=path?`${SITE_URL}${path}`:undefined;
  const jsonLd=url?{"@context":"https://schema.org","@graph":[{"@type":"WebPage","@id":`${url}#webpage`,url,name:title,description,inLanguage:"ko-KR",isPartOf:{"@id":`${SITE_URL}/#website`}},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"홈",item:SITE_URL},{"@type":"ListItem",position:2,name:title,item:url}]}]}:null;
  return <>{jsonLd&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/>}<header className="inner-header"><div className="inner-brand-row"><Brand/><PortalNav className="inner-portal-nav"/><MobileMenu/></div>{path&&<nav className="breadcrumb inner-breadcrumb" aria-label="현재 위치"><a href="/">홈</a><span>›</span><span aria-current="page">{title}</span></nav>}<p className="eyebrow inner-eyebrow">{eyebrow}</p><h1>{title}</h1>{description&&<p className="inner-description">{description}</p>}</header></>;
}

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-grid">
      <section className="footer-intro" aria-labelledby="footer-site-name">
        <Brand/>
        <h2 id="footer-site-name">퇴직 이후의 생활을<br/>공식 자료로 확인합니다</h2>
        <p>생활비와 제도를 점검하고, 내가 가진 경험으로 새로운 일을 시작할 수 있도록 검증 가능한 정보와 실행 도구를 제공합니다.</p>
        <div className="footer-contact" aria-label="사이트 운영 및 문의 정보">
          <p><span>관리자</span><strong>어썸라이프</strong></p>
          <p><span>이메일 문의</span><a href="mailto:master@adbles.com">master@adbles.com</a></p>
          <p><span>운영사</span><strong>{COMPANY_NAME}</strong><a href={COMPANY_URL} target="_blank" rel="noreferrer">Adbles.com <span aria-hidden="true">↗</span></a></p>
        </div>
      </section>
      <div className="footer-links">
        <nav aria-label="주요 콘텐츠">
          <strong>살펴보기</strong>
          <a href="/tools">퇴직금 계산기</a>
          <a href="/official-info">실업급여·국민연금</a>
          <a href="/challenge">퇴직 후 부업</a>
          <a href="/health">건강검진·질병예방</a><a href="/site">사이트 모음</a>
        </nav>
        <nav aria-label="사이트 신뢰 정보">
          <strong>사이트 정보</strong>
          <a href="/about">사이트 소개</a>
          <a href="/author">운영자 및 편집실</a>
          <a href="/editorial-policy">콘텐츠 원칙</a>
          <a href="/privacy">개인정보처리방침</a>
          <a href="/disclosure">광고·이용 안내</a>
          <a href="/terms">이용약관</a>
          <a href="/contact">문의·오류 제보</a>
        </nav>
      </div>
    </div>
    <div className="footer-bottom">
      <small>© 2026 {COMPANY_NAME}. All rights reserved. ‘{SITE_NAME}’는 애드블스가 운영합니다.</small>
      <p>콘텐츠는 일반적인 정보 제공을 목적으로 하며 개인별 투자·세무·노무·법률·의료 자문을 대신하지 않습니다. 중요한 결정 전에는 글의 기준일과 공식 기관의 최신 원문을 확인하세요.</p>
    </div>
  </footer>;
}
