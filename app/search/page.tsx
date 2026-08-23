import type { Metadata } from "next";
import { getPublishedPosts } from "../../lib/repository";
import { InnerHeader, SiteFooter } from "../components/SiteChrome";
import { ArticleThumbnail } from "../components/ArticleMedia";

// 자동화가 발행한 글이 재배포 없이 반영되어야 합니다.
// 기존 Cloudflare 엣지 캐시(s-maxage=300)와 같은 주기로 재생성합니다.
export const revalidate = 300;
export const metadata:Metadata={title:"글 검색",description:"퇴직 준비, 실업급여, N잡, AI, 재테크 글을 찾아보세요.",robots:{index:false,follow:true}};
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string;category?:string}>}){const {q="",category=""}=await searchParams;const all=await getPublishedPosts();const posts=all.filter(p=>(!q||`${p.title} ${p.excerpt} ${p.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()))&&(!category||p.category===category));return <><InnerHeader eyebrow="FIND YOUR NEXT STEP" title={category||"지금 필요한 답을 찾아보세요"} description="생활비, 실업급여, 새 일, 부업, 건강처럼 궁금한 단어를 입력하면 관련 글을 모아 보여드립니다."/><main className="content-shell"><form className="search-form"><label htmlFor="site-search">검색어</label><div className="search-field"><input id="site-search" name="q" defaultValue={q} placeholder="예: 퇴직금, 실업급여, N잡"/><button>검색</button></div>{category&&<input type="hidden" name="category" value={category}/>}</form><p className="search-count" aria-live="polite">{posts.length}개의 글을 찾았습니다.</p><div className="search-results">{posts.map(p=><a href={`/posts/${p.slug}`} key={p.slug}><ArticleThumbnail post={p} variant="search"/><div className="search-result-copy"><span>{p.category} · {p.readingMinutes}분</span><strong>{p.title}</strong><p>{p.excerpt}</p></div></a>)}</div></main><SiteFooter/></>}
