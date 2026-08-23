/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { runAutomationTickIfDue, runScheduledOrganizationActivities } from "../lib/repository";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface EdgeCacheStorage extends CacheStorage {
  readonly default: Cache;
}

type WorkerGlobalWithCache=typeof globalThis&{caches?:EdgeCacheStorage};

const PUBLIC_CACHE_CONTROL="public, max-age=0, s-maxage=300, stale-while-revalidate=86400";
const NAVER_SITE_VERIFICATION_PATH="/naverafe0ef74210245a649d66c3a595329e9.html";
const NAVER_SITE_VERIFICATION_CONTENT="naver-site-verification: naverafe0ef74210245a649d66c3a595329e9.html";

function isPublicDocumentRequest(request:Request,url:URL){
  if(request.method!=="GET"||url.search!=="")return false;
  if(url.pathname.startsWith("/admin")||url.pathname.startsWith("/api/")||url.pathname.startsWith("/_vinext/"))return false;
  if(request.headers.has("cookie")||request.headers.has("rsc")||request.headers.has("next-router-state-tree"))return false;
  return request.headers.get("accept")?.includes("text/html")===true;
}

function logAutomationFailure(source:string,error:unknown){console.error(JSON.stringify({event:"scheduled_organization_activity_failed",source,message:error instanceof Error?error.message:String(error)}));}

// Cron 트리거가 등록되지 않은 환경에서도 자동화가 멈추지 않도록, 일반 요청에서도
// 밀린 작업을 따라잡습니다. 실제 실행은 D1 실행권을 잡은 요청 하나만 수행하고
// 응답 이후에 처리되므로 사용자 응답 속도에는 영향을 주지 않습니다.
function shouldCatchUpAutomation(request:Request,url:URL){
  if(request.method!=="GET"&&request.method!=="HEAD")return false;
  if(url.pathname.startsWith("/_vinext/")||url.pathname.startsWith("/api/cron"))return false;
  return !url.pathname.includes(".");
}

function cacheKey(url:URL){return new Request(`${url.origin}${url.pathname}`,{headers:{accept:"text/html"}});}

function withCacheHeader(response:Response,status:"HIT"|"MISS"){
  const headers=new Headers(response.headers);
  headers.set("cache-control",PUBLIC_CACHE_CONTROL);
  headers.set("x-site-cache",status);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === "www.adbles.com") {
      url.protocol = "https:";
      url.hostname = "adbles.com";
      url.port = "";
      return Response.redirect(url.toString(), 301);
    }

    if (request.method === "GET" && url.pathname === NAVER_SITE_VERIFICATION_PATH) {
      return new Response(NAVER_SITE_VERIFICATION_CONTENT, {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" },
      });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    if(shouldCatchUpAutomation(request,url))ctx.waitUntil(runAutomationTickIfDue("request").catch(error=>logAutomationFailure("request",error)));

    const cacheable=isPublicDocumentRequest(request,url);
    // Sites preview/runtime variants may not expose the Cache API. Caching is
    // therefore an optimization, never a requirement for serving the page.
    let edgeCache:Cache|undefined;
    if(cacheable){
      try{edgeCache=(globalThis as WorkerGlobalWithCache).caches?.default;}
      catch(error){console.warn(JSON.stringify({event:"public_cache_unavailable",path:url.pathname,message:error instanceof Error?error.message:String(error)}));}
    }
    const key=cacheable?cacheKey(url):null;
    if(key&&edgeCache){
      const cached=await edgeCache.match(key);
      if(cached)return withCacheHeader(cached,"HIT");
    }

    const response=await handler.fetch(request, env, ctx);
    if(key&&response.status===200&&response.headers.get("content-type")?.includes("text/html")&&!response.headers.has("set-cookie")){
      const publicResponse=withCacheHeader(response,"MISS");
      if(edgeCache)ctx.waitUntil(edgeCache.put(key,publicResponse.clone()).catch(error=>console.error(JSON.stringify({event:"public_cache_write_failed",path:url.pathname,message:error instanceof Error?error.message:String(error)}))));
      return publicResponse;
    }
    return response;
  },
  async scheduled(_controller:ScheduledController,_env:Env,ctx:ExecutionContext){ctx.waitUntil(runScheduledOrganizationActivities("cron").catch(error=>logAutomationFailure("cron",error)));},
};

export default worker;
