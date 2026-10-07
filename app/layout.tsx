import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/", types: { "application/rss+xml": `${SITE_URL}/rss.xml` } },
  applicationName: SITE_NAME,
  creator: "퇴직생활연구소 편집실",
  publisher: SITE_NAME,
  category: "retirement planning",
  robots: { index:true, follow:true, googleBot:{ index:true, follow:true, "max-image-preview":"large", "max-snippet":-1, "max-video-preview":-1 } },
  verification: {
    other: {
      // 네이버 서치어드바이저는 www와 non-www를 별개 사이트로 본다.
      // 사이트를 추가 등록할 때마다 코드가 하나씩 늘어나므로, 기존 코드를
      // 지우지 말고 배열로 함께 둔다. 지우면 이미 확인된 속성이 풀린다.
      "naver-site-verification": [
        "afe0ef74210245a649d66c3a595329e9",
        "203792399c25da8d31e7b2eb66cc132ba531193f",
      ],
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand-mark-v2.png", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/brand-mark-v2.png",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/project-og-v2.jpg", width: 1200, height: 630, alt: "퇴직생활연구소 — 퇴직 이후의 생활을 공식 자료로 확인합니다" }],
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION, images:["/project-og-v2.jpg"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7faf8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <meta name="google-adsense-account" content="ca-pub-4030620718116834" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4030620718116834"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&family=Noto+Serif+KR:wght@400;600;700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
