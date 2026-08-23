import type { MetadataRoute } from "next";
import { getPublishedPosts } from "../lib/repository";
import { SITE_URL } from "../lib/site";
import { getThumbnailSeo } from "../lib/article-enrichment";

// 자동화가 발행한 글이 재배포 없이 반영되어야 합니다.
// 기존 Cloudflare 엣지 캐시(s-maxage=300)와 같은 주기로 재생성합니다.
export const revalidate = 300;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const posts=await getPublishedPosts();const staticPages=["","/challenge","/official-info","/tools","/tools/retirement-runway","/tools/severance-pay","/health","/about","/author","/editorial-policy","/privacy","/disclosure","/terms","/contact"];return [...staticPages.map((path,index)=>({url:`${SITE_URL}${path}`,lastModified:new Date("2026-08-14"),changeFrequency:(index===0?"weekly":"monthly") as "weekly"|"monthly",priority:index===0?1:(["/challenge","/official-info","/tools","/health"].includes(path)?0.9:path.includes("/tools/")?0.8:0.6)})),...posts.map(p=>{const image=getThumbnailSeo(p);return{url:`${SITE_URL}/posts/${p.slug}`,lastModified:new Date(p.publishedAt),changeFrequency:"monthly" as const,priority:0.8,images:[`${SITE_URL}${image.src}`]};})];}
