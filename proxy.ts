import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

/**
 * Cloudflare Worker 의 fetch 핸들러를 대신합니다. 라우팅과 cleanUrls 보다 먼저 실행되므로
 * 도메인 정규화와 소유확인 파일을 원래 동작 그대로 처리할 수 있습니다.
 */
export const config = {
  // 정적 자산은 제외하되, 소유확인 파일(.html)은 지나갈 수 있어야 합니다.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

const NAVER_SITE_VERIFICATION_PATH = "/naverafe0ef74210245a649d66c3a595329e9.html";
const NAVER_SITE_VERIFICATION_CONTENT = "naver-site-verification: naverafe0ef74210245a649d66c3a595329e9.html";

/**
 * 매 요청마다 자동화를 깨우면 실행권 검사만 하고 끝나는 호출이 트래픽만큼 쌓입니다.
 * 일부만 표본으로 깨워도 실제 트래픽에서는 몇 분 안에 밀린 작업을 따라잡습니다.
 */
const WAKE_SAMPLE_RATE = 0.05;

/**
 * cron 트리거만 믿으면 자동화가 멈출 수 있습니다(트리거 미등록, 요금제별 주기 제한).
 * 실제 실행 여부는 /api/cron 이 데이터베이스 실행권으로 판단하므로 최소 간격 안에서는
 * 한 번만 실행됩니다. 미들웨어는 Edge 런타임이라 DB 드라이버를 직접 쓸 수 없어,
 * 같은 배포의 cron 엔드포인트를 깨워 Node 런타임으로 넘깁니다.
 */
function wakeAutomation(request: NextRequest, event: NextFetchEvent) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return;
  if (request.nextUrl.pathname.startsWith("/api/cron")) return;
  if (Math.random() > WAKE_SAMPLE_RATE) return;
  event.waitUntil(
    fetch(new URL("/api/cron", request.url), {
      method: "POST",
      headers: { authorization: `Bearer ${secret}`, "x-automation-source": "request" },
    }).then(
      () => undefined,
      () => undefined,
    ),
  );
}

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const url = new URL(request.url);
  // 프록시 뒤에서는 request.url 이 내부 주소라 실제 요청 호스트를 반영하지 않습니다.
  const host = request.headers.get("host") ?? url.hostname;

  if (host === "www.adbles.com") {
    url.protocol = "https:";
    url.hostname = "adbles.com";
    url.port = "";
    return NextResponse.redirect(url.toString(), 301);
  }

  // 검색엔진 소유확인 파일은 리다이렉트 없이 200 으로 원문을 그대로 돌려줘야 합니다.
  // cleanUrls 가 .html 을 확장자 없는 주소로 돌리기 때문에 라우팅에 맡기지 않습니다.
  if (request.method === "GET" && url.pathname === NAVER_SITE_VERIFICATION_PATH) {
    return new NextResponse(NAVER_SITE_VERIFICATION_CONTENT, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600",
        "x-content-type-options": "nosniff",
      },
    });
  }

  wakeAutomation(request, event);
  return NextResponse.next();
}
