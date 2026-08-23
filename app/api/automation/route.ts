import { createAutomationDraft, getAutomationSchedulerStatus, getPostingQueue, runScheduledOrganizationActivities } from "../../../lib/repository";
import { requireOwnerApi } from "../../../lib/site-admin";
import { assertTeamPermission } from "../../../lib/team-permissions";

export async function GET(request:Request) {
  const auth = await requireOwnerApi(request);
  if (auth.response) return auth.response;
  try {
    const [queue, scheduler] = await Promise.all([getPostingQueue(), getAutomationSchedulerStatus()]);
    return Response.json({ queue, scheduler });
  }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "발행 대기열을 불러오지 못했습니다." }, { status: 500 }); }
}

export async function POST(request: Request) {
  const auth = await requireOwnerApi(request);
  if (auth.response) return auth.response;
  try {
    const payload = (await request.json()) as Record<string, string>;
    if (payload.action === "run-scheduler") {
      assertTeamPermission("owner", "automation.run");
      const tick = await runScheduledOrganizationActivities("admin");
      return Response.json({ tick, scheduler: await getAutomationSchedulerStatus() });
    }
    assertTeamPermission("owner", "content.draft.create");
    if (!payload.topic?.trim() || !payload.sourceUrl?.trim()) {
      return Response.json({ error: "글 주제와 공식 자료 주소를 입력하세요." }, { status: 400 });
    }
    const post = await createAutomationDraft({
      topic: payload.topic.trim(),
      category: payload.category || "정부지원·실업급여",
      sourceUrl: payload.sourceUrl.trim(),
      scheduledAt: payload.scheduledAt || null,
    });
    return Response.json({ post }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "자동 초안을 만들지 못했습니다." }, { status: 500 });
  }
}
