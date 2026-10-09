import type { Metadata, Viewport } from "next";
import { after } from "next/server";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../lib/site";
import { describeDatabaseTarget, runAutomationTickIfDue } from "../lib/repository";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/", types: { "application/rss+xml": `${SITE_URL}/rss.xml` } },
  applicationName: SITE_NAME,
  creator: "퇴.기.사 편집실",
  publisher: SITE_NAME,
  category: "retirement planning",
  robots: { index:true, follow:true, googleBot:{ index:true, follow:true, "max-image-preview":"large", "max-snippet":-1, "max-video-preview":-1 } },
  icons: { icon: "/brand-mark-v2.png", apple: "/brand-mark-v2.png" },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/project-og-v2.jpg", width: 1200, height: 630, alt: "퇴.기.사 — 100세시대! 퇴직이 기회가 되는 사람들" }],
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
  // 자동화 따라잡기의 기본 경로입니다. 응답을 보낸 뒤 Node 런타임에서 실행되므로
  // 페이지 속도에 영향이 없고, 비밀값이나 HTTP 왕복 없이 데이터베이스에 직접 붙습니다.
  // 실제 실행 여부는 실행권이 판단하므로 최소 간격 안에서는 한 번만 돕니다.
  after(async () => {
    try {
      await runAutomationTickIfDue("request");
    } catch (error) {
      console.error(JSON.stringify({
        event: "automation_tick_failed",
        message: error instanceof Error ? error.message : String(error),
        // 드라이버 오류만으로는 설정이 비었는지 틀렸는지 구분되지 않습니다.
        target: describeDatabaseTarget(),
      }));
    }
  });

  return <html lang="ko"><head><script async src="https://www.googletagmanager.com/gtag/js?id=G-88QZEDWBT8"></script><script dangerouslySetInnerHTML={{ __html: "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-88QZEDWBT8');" }}/><meta name="google-adsense-account" content="ca-pub-4030620718116834"/><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&family=Noto+Serif+KR:wght@400;600;700&display=swap"/></head><body>{children}</body></html>;
}
