import { env } from "cloudflare:workers";
import { getAutomationSchedulerStatus, runScheduledOrganizationActivities } from "../../../lib/repository";
import { getAdminSession } from "../../../lib/site-admin";

/**
 * 외부 스케줄러(Vercel Cron, 업타임 모니터, 사내 배치)가 조직 자동화를 깨우는 입구입니다.
 * Cloudflare cron 트리거가 없는 환경에서도 이 주소만 주기적으로 호출하면 자동화가 유지됩니다.
 */
function cronSecret() {
  const bindings = env as unknown as { CRON_SECRET?: string };
  return bindings.CRON_SECRET || process.env.CRON_SECRET || "";
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function presentedSecret(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  if (header.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return new URL(request.url).searchParams.get("key") ?? "";
}

async function authorize(request: Request) {
  const secret = cronSecret();
  const presented = presentedSecret(request);
  if (secret && presented && safeEqual(presented, secret)) return true;
  return Boolean(await getAdminSession(request));
}

async function handle(request: Request) {
  if (!(await authorize(request))) {
    return Response.json(
      { error: "자동화 실행 권한이 없습니다. CRON_SECRET 값을 Authorization: Bearer 헤더로 보내거나 관리자로 로그인하세요." },
      { status: 401 },
    );
  }
  try {
    if (new URL(request.url).searchParams.get("status") === "1") {
      return Response.json({ scheduler: await getAutomationSchedulerStatus() });
    }
    const tick = await runScheduledOrganizationActivities(request.method === "GET" ? "cron-http" : "cron-http-post");
    return Response.json({ tick, scheduler: await getAutomationSchedulerStatus() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "자동화를 실행하지 못했습니다." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
