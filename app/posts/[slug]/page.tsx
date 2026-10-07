import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getPost, getPublishedPosts } from "../../../lib/repository";
import { SITE_NAME, SITE_URL } from "../../../lib/site";
import { Brand, PortalNav, SiteFooter } from "../../components/SiteChrome";
import { MobileMenu } from "../../components/MobileMenu";
import { ArticleSupport, ArticleThumbnail } from "../../components/ArticleMedia";
import { SeriesNav } from "../../components/SeriesNav";
import { enrichArticle, getThumbnailSeo } from "../../../lib/article-enrichment";
import { addGlossaryLinksToHtml, addOfficialOrganizationLinksToHtml, refreshOfficialUrl, sanitizeArticleHtml } from "../../../lib/article-html";
import { AI_EDITORIAL_NOTICE, authorMetaName, getEditorialAuthor } from "../../../lib/editorial-team";
import ArticleReaderTools from "./ArticleReaderTools";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const post=await getPost(slug);if(!post)return{};const image=getThumbnailSeo(post);const author=getEditorialAuthor(post.authorName);return{title:post.title,description:post.excerpt,keywords:post.tags,authors:[{name:authorMetaName(author),url:"/author"}],alternates:{canonical:`/posts/${post.slug}`},openGraph:{type:"article",title:post.title,description:post.excerpt,url:`/posts/${post.slug}`,publishedTime:post.publishedAt,authors:[authorMetaName(author)],section:post.category,tags:post.tags,images:[{url:image.src,width:image.width,height:image.height,alt:image.alt}]},twitter:{card:"summary_large_image",title:post.title,description:post.excerpt,images:[image.src]}};}

type GlossaryLink = { term: string; url: string };

function linkGlossaryTerms(text:string, glossary:GlossaryLink[], linked:Set<string>):ReactNode {
  const terms=glossary.map(item=>item.term).sort((a,b)=>b.length-a.length);
  if(terms.length===0)return text;
  const escaped=terms.map(term=>term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
  const pattern=new RegExp(`(${escaped.join("|")})`,"g");
  return text.split(pattern).map((part,index)=>{
    const item=glossary.find(candidate=>candidate.term===part);
    if(!item||linked.has(part))return part;
    linked.add(part);
    return <a className="glossary-link" href={item.url} target="_blank" rel="noreferrer" title={`${part} 뜻을 위키백과에서 확인`} key={`${part}-${index}`}>{part}</a>;
  });
}

function paragraphWithSource(text:string,glossary:GlossaryLink[],linked:Set<string>){const match=text.match(/\n\n출처: (https?:\/\/\S+)$/);if(!match)return <p>{linkGlossaryTerms(text,glossary,linked)}</p>;return <><p>{linkGlossaryTerms(text.slice(0,match.index).trim(),glossary,linked)}</p><a className="source-link" href={refreshOfficialUrl(match[1])} target="_blank" rel="noreferrer">공식 자료 원문 확인 ↗</a></>}
function renderBody(body:string,glossary:GlossaryLink[]){const linked=new Set<string>();return body.split(/\n(?=## )/).map((part,i)=>{const [first,...rest]=part.split("\n");return first.startsWith("## ")?<section key={i}><h2>{first.slice(3)}</h2>{paragraphWithSource(rest.join("\n").trim(),glossary,linked)}</section>:<div key={i}>{paragraphWithSource(part.trim(),glossary,linked)}</div>});}
function renderRichBody(body:string,glossary:GlossaryLink[]){if(!/<(?:p|h[1-6]|div|figure|ul|ol|blockquote|table)\b/i.test(body))return renderBody(body,glossary);const html=addGlossaryLinksToHtml(addOfficialOrganizationLinksToHtml(sanitizeArticleHtml(body)),glossary);return <div className="rich-article-body" dangerouslySetInnerHTML={{__html:html}}/>;}

export default async function PostPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const [post,all]=await Promise.all([getPost(slug),getPublishedPosts()]);if(!post)notFound();
  const related=all.filter(item=>item.slug!==post.slug&&(item.category===post.category||item.tags.some(tag=>post.tags.includes(tag)))).slice(0,3);
  const url=`${SITE_URL}/posts/${post.slug}`;
  const image=getThumbnailSeo(post);
  const author=getEditorialAuthor(post.authorName);
  const enrichment=enrichArticle(post);
  const glossary=enrichment.glossary;
  const imageUrl=`${SITE_URL}${image.src}`;
  const citations=Array.from(new Set([...(post.body.match(/https?:\/\/[^\s)<>'"]+/g)??[]),...enrichment.officialLinks.map(link=>link.url),...(enrichment.video?[enrichment.video.sourceUrl]:[])].map(refreshOfficialUrl)));
  const wordCount=post.body.replace(/<[^>]+>/g," ").split(/\s+/).filter(Boolean).length;
  const jsonLd={"@context":"https://schema.org","@graph":[{"@type":"BlogPosting","@id":`${url}#article`,headline:post.title,description:post.excerpt,url,mainEntityOfPage:{"@type":"WebPage","@id":url},image:{"@type":"ImageObject",url:imageUrl,contentUrl:imageUrl,width:image.width,height:image.height,caption:image.alt},thumbnailUrl:imageUrl,datePublished:post.publishedAt,inLanguage:"ko-KR",articleSection:post.category,keywords:post.tags.join(", "),wordCount,citation:citations,author:{"@type":"Organization","@id":`${SITE_URL}/author#${author.id}`,name:`${author.name} · ${author.role}`,description:`퇴직생활연구소 AI 편집자. ${author.specialty}`,url:`${SITE_URL}/author`},publisher:{"@type":"Organization","@id":`${SITE_URL}/#organization`,name:SITE_NAME,url:SITE_URL,logo:{"@type":"ImageObject",url:`${SITE_URL}/brand-mark-v2.png`}}},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"홈",item:SITE_URL},{"@type":"ListItem",position:2,name:post.category,item:`${SITE_URL}/search?category=${encodeURIComponent(post.category)}`},{"@type":"ListItem",position:3,name:post.title,item:url}]}]};
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/><header className="inner-header article-header"><div className="inner-brand-row"><Brand/><PortalNav className="inner-portal-nav"/><MobileMenu/></div><nav className="breadcrumb" aria-label="현재 위치"><a href="/">홈</a><span>›</span><a href={`/search?category=${encodeURIComponent(post.category)}`}>{post.category}</a></nav><p className="eyebrow">{post.category} · {post.readingMinutes}분</p><h1>{post.title}</h1><p className="inner-description">{post.excerpt}</p><div className="byline"><a href={`/author#${author.id}`}><strong>{author.name}</strong><small>{author.role}</small></a><a className="byline-ai" href="/author" title="편집자 운영 방식과 AI 사용 고지 보기">AI 편집</a><span>발행 {post.publishedAt}</span></div></header><main className="content-shell"><ArticleThumbnail post={post} variant="hero"/><ArticleReaderTools articleId="article-body" readingMinutes={post.readingMinutes}/><div className="article-layout"><article className="article-copy" id="article-body">{renderRichBody(post.body,glossary)}<SeriesNav post={post}/><ArticleSupport post={post}/><p className="ai-editorial-notice">{AI_EDITORIAL_NOTICE} <a href="/author">편집실 운영 방식 보기</a></p></article><aside className="article-aside"><strong>내 상황에 적용하기 전에</strong><p>금액·기한·대상 조건은 사람마다 다를 수 있습니다.</p><a className="aside-link" href="/official-info">공식 확인처 찾기 →</a><strong>관련 태그</strong><div>{post.tags.map(t=><span className="chip" key={t}>#{t}</span>)}</div></aside></div>{related.length>0&&<section className="related-posts" aria-labelledby="related-title"><p className="eyebrow">다음 질문도 이어서</p><h2 id="related-title">함께 보면 좋은 글</h2><div>{related.map(item=><a href={`/posts/${item.slug}`} key={item.slug}><ArticleThumbnail post={item} variant="search"/><span>{item.category}</span><strong>{item.title}</strong><p>{item.excerpt}</p></a>)}</div></section>}</main><SiteFooter/></>;
}
