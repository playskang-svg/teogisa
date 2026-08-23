import { getPublishedPosts } from "../../lib/repository";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../../lib/site";

// 자동화가 발행한 글이 재배포 없이 반영되어야 합니다.
// 기존 Cloudflare 엣지 캐시(s-maxage=300)와 같은 주기로 재생성합니다.
export const revalidate = 300;

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(value: string) {
  return value.replace(/]]>/g, "]]]]><![CDATA[>");
}

function publicationDate(value: string) {
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00+09:00` : value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

export async function GET() {
  const posts = (await getPublishedPosts())
    .filter((post) => post.status === "published")
    .toSorted((a, b) => publicationDate(b.publishedAt).getTime() - publicationDate(a.publishedAt).getTime())
    .slice(0, 50);
  const lastBuildDate = posts[0] ? publicationDate(posts[0].publishedAt) : new Date();
  const items = posts.map((post) => {
    const url = `${SITE_URL}/posts/${post.slug}`;
    const body = post.body.trim() || `<p>${escapeXml(post.excerpt)}</p>`;
    return `<item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${publicationDate(post.publishedAt).toUTCString()}</pubDate>
      <category>${escapeXml(post.category)}</category>
      <description><![CDATA[${cdata(body)}]]></description>
      <content:encoded><![CDATA[${cdata(body)}]]></content:encoded>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko-KR</language>
    <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${SITE_URL}/rss.xml`)}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}
