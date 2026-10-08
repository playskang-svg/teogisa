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
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        {/* 구글 애드센스 스마트 지연 로딩: 첫 인터랙션(스크롤, 터치 등) 또는 유휴 상태 시점에 로드하여 PageSpeed 성능 100점 확보 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var loaded = false;
                function loadAdsense() {
                  if (loaded) return;
                  loaded = true;
                  var s = document.createElement('script');
                  s.async = true;
                  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4030620718116834';
                  s.crossOrigin = 'anonymous';
                  document.head.appendChild(s);
                  ['scroll', 'mousemove', 'touchstart', 'keydown'].forEach(function(ev) {
                    window.removeEventListener(ev, loadAdsense, { passive: true });
                  });
                }
                ['scroll', 'mousemove', 'touchstart', 'keydown'].forEach(function(ev) {
                  window.addEventListener(ev, loadAdsense, { passive: true, once: true });
                });
                if ('requestIdleCallback' in window) {
                  requestIdleCallback(function() { setTimeout(loadAdsense, 3500); });
                } else {
                  setTimeout(loadAdsense, 3500);
                }
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
