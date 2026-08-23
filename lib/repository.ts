import postgres from "postgres";
import { env } from "cloudflare:workers";
import { seedPosts, type Post } from "./content";
import { contentAgentProfiles, type ContentAgentProfile } from "./content-agents";
import { EDITOR_IN_CHIEF } from "./editorial-team";
import { SITE_NAME } from "./site";
import { assertPublicationReady, inspectPublicationPolicy, managementDepartment } from "./management-department";
import { organizationNotice, organizationPolicyCoverage, organizationPolicyRecipients } from "./organization-policy";
import { checkAgainstSources, compareOriginality, OriginalityCheckError } from "./originality-check";
import { companyResourceRegistry, companyRules, COMPANY_RULES_VERSION } from "./company-rules";
import { buildMarketingChannelPlans, type MarketingChannelPlan } from "./marketing-campaigns";
import { AUDIT_SCOPE, auditDomains, auditOfficers } from "./internal-audit";
import { qualityDesignGates, qualityDesignTeam } from "./quality-design-team";
import { assertTeamPermission } from "./team-permissions";
import { safeReleasePolicy } from "./release-policy";
import { memberActivityPlans, nextMemberActivityRunAt, type ActivityAction } from "./member-activity-plans";

let pgSql: ReturnType<typeof postgres> | null = null;
export function getPgClient() {
  const url = process.env.DATABASE_URL;
  if (url) {
    if (!pgSql) {
      pgSql = postgres(url, { idle_timeout: 20, max: 10 });
    }
    return pgSql;
  }
  return null;
}


export type QueueItem = {
  id: number;
  postId: number;
  title: string;
  status: string;
  sourceUrl: string | null;
  scheduledAt: string | null;
  attempts: number;
};

export type ContentAgentState = ContentAgentProfile & { status:"active"|"paused"; nextRunAt:string|null; lastRunAt:string|null; topicCursor:number };
export type AgentRun = { id:number; agentId:string; agentName:string; status:string; topic:string; postId:number|null; message:string|null; createdAt:string };
export type PromotionCampaign = { id:number; postId:number; title:string; slug:string; status:"prepared"|"executed"; headline:string; socialCopy:string; communityCopy:string; hashtags:string[]; channels:string[]; channelPlans:MarketingChannelPlan[]; createdAt:string; executedAt:string|null };
export type ManagementIssue = { id:number; issueKey:string; auditorId:string; auditorName:string; severity:"critical"|"warning"|"info"; scope:string; status:"open"|"resolved"; title:string; details:string; actionTaken:string|null; postId:number|null; postTitle:string|null; createdAt:string; resolvedAt:string|null };
export type ManagementRun = { id:number; status:string; checkedCount:number; issueCount:number; actionCount:number; summary:string; createdAt:string };
export type OriginalityCheck = { id:number; postId:number|null; editorName:string; title:string; sourceUrl:string|null; status:"passed"|"blocked"|"unavailable"; overlapRatio:number; longestMatchChars:number; message:string; checkedAt:string };
export type AuditRun = { id:number; scope:string; leadAuditor:string; status:string; overallOpinion:string; totalItems:number; passedItems:number; findingCount:number; startedAt:string; completedAt:string|null };
export type AuditFinding = { id:number; auditRunId:number; domain:string; severity:"critical"|"major"|"minor"|"info"; status:"compliant"|"open"|"resolved"; title:string; details:string; actionOwner:string; dueAt:string|null; resolution:string|null; createdAt:string; resolvedAt:string|null };
export type MemberActivityPlanState={id:string;memberId:string;memberName:string;teamId:string;teamName:string;role:string;frequency:"hourly"|"daily";intervalHours:number|null;dailyHourKst:number|null;minuteOffset:number;action:ActivityAction;taskTitle:string;instruction:string;safeOutput:string;requiresApproval:boolean;status:"active"|"paused";nextRunAt:string|null;lastRunAt:string|null};
export type MemberActivityRun={id:number;planId:string;memberName:string;teamName:string;action:ActivityAction;status:"completed"|"noop"|"failed"|"review";summary:string;startedAt:string;completedAt:string|null};

let initialized = false;
const CONTENT_QUALITY_REVISION="2026-08-14-adsense-readiness-v2-deposit-protection-v1-official-source-refresh-v1";

async function db(options:{initialize?:boolean}={}) {
  const d1 = (env as unknown as { DB?: D1Database }).DB;
  if (!d1) throw new Error("DB binding unavailable");

  // Public page reads must never wait for schema checks or seed writes.
  if (options.initialize === false) return d1;

  if (!initialized) {
    await d1.batch([
      d1.prepare(`CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0)`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, excerpt TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', category TEXT NOT NULL, tags_json TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'draft', published_at TEXT, scheduled_at TEXT, reading_minutes INTEGER NOT NULL DEFAULT 5, visual TEXT NOT NULL DEFAULT 'NEW', author_name TEXT NOT NULL DEFAULT '데스크', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS posting_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'waiting', source_url TEXT, scheduled_at TEXT, attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(post_id) REFERENCES posts(id))`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS admin_login_attempts (attempt_key TEXT PRIMARY KEY, failures INTEGER NOT NULL DEFAULT 0, window_started_at INTEGER NOT NULL, blocked_until INTEGER NOT NULL DEFAULT 0)`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS content_agents (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, mission TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', cadence_hours INTEGER NOT NULL DEFAULT 168, sources_json TEXT NOT NULL DEFAULT '[]', topics_json TEXT NOT NULL DEFAULT '[]', video_json TEXT, next_run_at TEXT, last_run_at TEXT, topic_cursor INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS agent_runs (id INTEGER PRIMARY KEY AUTOINCREMENT, agent_id TEXT NOT NULL, status TEXT NOT NULL, topic TEXT NOT NULL, post_id INTEGER, message TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(agent_id) REFERENCES content_agents(id), FOREIGN KEY(post_id) REFERENCES posts(id))`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS promotion_campaigns (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'prepared', headline TEXT NOT NULL, social_copy TEXT NOT NULL, community_copy TEXT NOT NULL, hashtags_json TEXT NOT NULL DEFAULT '[]', channels_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, executed_at TEXT, FOREIGN KEY(post_id) REFERENCES posts(id))`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS management_issues (id INTEGER PRIMARY KEY AUTOINCREMENT, issue_key TEXT NOT NULL UNIQUE, auditor_id TEXT NOT NULL, severity TEXT NOT NULL, scope TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', title TEXT NOT NULL, details TEXT NOT NULL, action_taken TEXT, post_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, resolved_at TEXT, FOREIGN KEY(post_id) REFERENCES posts(id))`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS management_runs (id INTEGER PRIMARY KEY AUTOINCREMENT, status TEXT NOT NULL, checked_count INTEGER NOT NULL DEFAULT 0, issue_count INTEGER NOT NULL DEFAULT 0, action_count INTEGER NOT NULL DEFAULT 0, summary TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS originality_checks (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER, editor_name TEXT NOT NULL, title TEXT NOT NULL, source_url TEXT, status TEXT NOT NULL, overlap_ratio INTEGER NOT NULL DEFAULT 0, longest_match_chars INTEGER NOT NULL DEFAULT 0, message TEXT NOT NULL, checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(post_id) REFERENCES posts(id))`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS audit_runs (id INTEGER PRIMARY KEY AUTOINCREMENT, scope TEXT NOT NULL, lead_auditor TEXT NOT NULL, status TEXT NOT NULL, overall_opinion TEXT NOT NULL, total_items INTEGER NOT NULL DEFAULT 0, passed_items INTEGER NOT NULL DEFAULT 0, finding_count INTEGER NOT NULL DEFAULT 0, started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT)`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS audit_findings (id INTEGER PRIMARY KEY AUTOINCREMENT, audit_run_id INTEGER NOT NULL, domain TEXT NOT NULL, severity TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', title TEXT NOT NULL, details TEXT NOT NULL, action_owner TEXT NOT NULL, due_at TEXT, resolution TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, resolved_at TEXT, FOREIGN KEY(audit_run_id) REFERENCES audit_runs(id))`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS member_activity_plans (id TEXT PRIMARY KEY, member_id TEXT NOT NULL UNIQUE, member_name TEXT NOT NULL, team_id TEXT NOT NULL, team_name TEXT NOT NULL, role TEXT NOT NULL, frequency TEXT NOT NULL, interval_hours INTEGER, daily_hour_kst INTEGER, minute_offset INTEGER NOT NULL DEFAULT 0, action TEXT NOT NULL, task_title TEXT NOT NULL, instruction TEXT NOT NULL, safe_output TEXT NOT NULL, requires_approval INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', next_run_at TEXT, last_run_at TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
      d1.prepare(`CREATE TABLE IF NOT EXISTS member_activity_runs (id INTEGER PRIMARY KEY AUTOINCREMENT, plan_id TEXT NOT NULL, member_name TEXT NOT NULL, team_name TEXT NOT NULL, action TEXT NOT NULL, status TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '', started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT, FOREIGN KEY(plan_id) REFERENCES member_activity_plans(id))`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_status_published ON posts(status, published_at)`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_queue_status_scheduled ON posting_queue(status, scheduled_at)`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_content_agents_status_next ON content_agents(status, next_run_at)`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_created ON agent_runs(agent_id, created_at)`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_promotion_status_created ON promotion_campaigns(status, created_at)`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_management_issues_status_severity ON management_issues(status, severity, updated_at)`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_management_runs_created ON management_runs(created_at)`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_originality_checks_status_checked ON originality_checks(status, checked_at)`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_runs_completed ON audit_runs(completed_at)`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_findings_run_status ON audit_findings(audit_run_id, status)`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_findings_status_due ON audit_findings(status, due_at)`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_member_activity_plans_status_next ON member_activity_plans(status, next_run_at)`),
      d1.prepare(`CREATE INDEX IF NOT EXISTS idx_member_activity_runs_plan_started ON member_activity_runs(plan_id, started_at)`),
    ]);

    for (const post of seedPosts) {
      await d1
        .prepare(
          "INSERT OR IGNORE INTO posts (title,slug,excerpt,body,category,tags_json,status,published_at,scheduled_at,reading_minutes,visual,author_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        )
        .bind(
          post.title,
          post.slug,
          post.excerpt,
          post.body,
          post.category,
          JSON.stringify(post.tags),
          post.status,
          post.publishedAt,
          post.scheduledAt,
          post.readingMinutes,
          post.visual,
          post.authorName ?? EDITOR_IN_CHIEF.name,
        )
        .run();
    }
    const appliedRevision=await d1.prepare("SELECT value_json FROM site_settings WHERE key='content_quality_revision'").first<{value_json:string}>();
    if(appliedRevision?.value_json!==JSON.stringify(CONTENT_QUALITY_REVISION)){
      for(const post of seedPosts){
        await d1.prepare("UPDATE posts SET excerpt=?,body=?,tags_json=?,reading_minutes=?,author_name=?,updated_at=CURRENT_TIMESTAMP WHERE slug=?").bind(post.excerpt,post.body,JSON.stringify(post.tags),post.readingMinutes,post.authorName ?? EDITOR_IN_CHIEF.name,post.slug).run();
      }
      await d1.prepare("INSERT INTO site_settings (key,value_json,updated_at) VALUES ('content_quality_revision',?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=CURRENT_TIMESTAMP").bind(JSON.stringify(CONTENT_QUALITY_REVISION)).run();
    }
    await d1.prepare("INSERT INTO site_settings (key,value_json,updated_at) VALUES ('company_rules_version',?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=CURRENT_TIMESTAMP").bind(JSON.stringify(COMPANY_RULES_VERSION)).run();
    for (const agent of contentAgentProfiles) {
      const nextRunAt=new Date(Date.now()+agent.cadenceHours*60*60*1000).toISOString();
      await d1.prepare(`INSERT INTO content_agents (id,name,category,mission,status,cadence_hours,sources_json,topics_json,video_json,next_run_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          category=excluded.category,
          mission=excluded.mission,
          cadence_hours=excluded.cadence_hours,
          sources_json=excluded.sources_json,
          topics_json=excluded.topics_json,
          video_json=excluded.video_json,
          next_run_at=CASE
            WHEN content_agents.next_run_at IS NULL OR content_agents.next_run_at>excluded.next_run_at THEN excluded.next_run_at
            ELSE content_agents.next_run_at
          END,
          updated_at=CURRENT_TIMESTAMP`)
        .bind(agent.id,agent.name,agent.category,agent.mission,"active",agent.cadenceHours,JSON.stringify(agent.sources),JSON.stringify(agent.topics),agent.video?JSON.stringify(agent.video):null,nextRunAt).run();
    }
    for(const plan of memberActivityPlans){
      await d1.prepare(`INSERT INTO member_activity_plans (id,member_id,member_name,team_id,team_name,role,frequency,interval_hours,daily_hour_kst,minute_offset,action,task_title,instruction,safe_output,requires_approval,status,next_run_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'active',?)
        ON CONFLICT(id) DO UPDATE SET member_name=excluded.member_name,team_id=excluded.team_id,team_name=excluded.team_name,role=excluded.role,frequency=excluded.frequency,interval_hours=excluded.interval_hours,daily_hour_kst=excluded.daily_hour_kst,minute_offset=excluded.minute_offset,action=excluded.action,task_title=excluded.task_title,instruction=excluded.instruction,safe_output=excluded.safe_output,requires_approval=excluded.requires_approval,next_run_at=COALESCE(member_activity_plans.next_run_at,excluded.next_run_at),updated_at=CURRENT_TIMESTAMP`)
        .bind(plan.id,plan.memberId,plan.memberName,plan.teamId,plan.teamName,plan.role,plan.frequency,plan.intervalHours,plan.dailyHourKst,plan.minuteOffset,plan.action,plan.taskTitle,plan.instruction,plan.safeOutput,plan.requiresApproval?1:0,nextMemberActivityRunAt(plan)).run();
    }
    initialized = true;
  }
  return d1;
}

function mapPost(row: Record<string, unknown>): Post {
  return {
    id: Number(row.id),
    title: String(row.title),
    slug: String(row.slug),
    excerpt: String(row.excerpt ?? ""),
    body: String(row.body ?? ""),
    category: String(row.category),
    tags: JSON.parse(String(row.tags_json ?? "[]")),
    status: row.status as Post["status"],
    publishedAt: String(row.published_at ?? ""),
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : null,
    readingMinutes: Number(row.reading_minutes ?? 5),
    visual: String(row.visual ?? "NEW"),
    authorName: String(row.author_name ?? EDITOR_IN_CHIEF.name),
  };
}

export function sortPostsNewestFirst(posts: readonly Post[]) {
  return posts.toSorted((a, b) => {
    const publishedDateOrder = b.publishedAt.slice(0, 10).localeCompare(a.publishedAt.slice(0, 10));
    return publishedDateOrder || b.id - a.id || b.publishedAt.localeCompare(a.publishedAt);
  });
}

export async function publishDuePosts() {
  const d1 = await db();
  const now = new Date().toISOString();
  await d1.batch([
    d1.prepare("UPDATE posts SET status='published', published_at=substr(?,1,10), updated_at=CURRENT_TIMESTAMP WHERE status='scheduled' AND scheduled_at IS NOT NULL AND scheduled_at<=?").bind(now, now),
    d1.prepare("UPDATE posting_queue SET status='published' WHERE status='scheduled' AND scheduled_at IS NOT NULL AND scheduled_at<=?").bind(now),
  ]);
}

export async function getPublishedPosts() {
  try {
    const pg = getPgClient();
    if (pg) {
      const rows = await pg`SELECT * FROM posts ORDER BY published_at DESC, id DESC`;
      const persisted = rows.map((row) => mapPost(row as Record<string, unknown>));
      const persistedSlugs = new Set(persisted.map((post) => post.slug));
      const persistedTitles = new Set(persisted.map((post) => post.title.trim()));
      return sortPostsNewestFirst([
        ...persisted.filter((post) => post.status === "published"),
        ...seedPosts.filter((post) => post.status === "published" && !persistedSlugs.has(post.slug) && !persistedTitles.has(post.title.trim())),
      ]);
    }
    const d1 = await db({initialize:false});
    const result = await d1
      // Read every persisted status so an editor's explicit draft/unpublish
      // decision always wins over a bundled fallback post.
      .prepare("SELECT * FROM posts ORDER BY published_at DESC, id DESC")
      .all();
    const persisted=result.results.map((row) => mapPost(row as Record<string, unknown>));
    const persistedSlugs=new Set(persisted.map(post=>post.slug));
    const persistedTitles=new Set(persisted.map(post=>post.title.trim()));
    return sortPostsNewestFirst([
      ...persisted.filter(post=>post.status==="published"),
      ...seedPosts.filter(post=>post.status==="published"&&!persistedSlugs.has(post.slug)&&!persistedTitles.has(post.title.trim())),
    ]);
  } catch {
    return sortPostsNewestFirst(seedPosts.filter((post) => post.status === "published"));
  }
}

export async function getAllPosts() {
  await publishDuePosts();
  const pg = getPgClient();
  if (pg) {
    const rows = await pg`SELECT * FROM posts ORDER BY updated_at DESC, id DESC`;
    return rows.map((row) => mapPost(row as Record<string, unknown>));
  }
  const d1 = await db();
  const result = await d1.prepare("SELECT * FROM posts ORDER BY updated_at DESC, id DESC").all();
  return result.results.map((row) => mapPost(row as Record<string, unknown>));
}

function normalizePostSlug(slug:string){
  try{return decodeURIComponent(slug).normalize("NFC");}
  catch{return slug.normalize("NFC");}
}

const legacyPostSlugAliases:Record<string,string>={
  "퇴직-후-건강보험료-첫-고지서-전에-확인할-3가지":"health-insurance-after-retirement-three-checks",
};

function findSeedPost(slug:string){
  const seedSlug=legacyPostSlugAliases[slug]??slug;
  return seedPosts.find((post)=>post.slug.normalize("NFC")===seedSlug)??null;
}

export async function getPost(slug: string) {
  const normalizedSlug=normalizePostSlug(slug);
  try {
    const pg = getPgClient();
    if (pg) {
      const rows = await pg`SELECT * FROM posts WHERE slug = ${normalizedSlug} AND status = 'published' LIMIT 1`;
      return rows[0] ? mapPost(rows[0] as Record<string, unknown>) : findSeedPost(normalizedSlug);
    }
    const d1 = await db({initialize:false});
    const row = await d1
      .prepare("SELECT * FROM posts WHERE slug=? AND status='published'")
      .bind(normalizedSlug)
      .first();
    return row
      ? mapPost(row as Record<string, unknown>)
      : findSeedPost(normalizedSlug);
  } catch {
    return findSeedPost(normalizedSlug);
  }
}

export async function createPost(input: Omit<Post, "id">) {
  if (input.status === "published" || input.status === "scheduled") assertPublicationReady(input);
  const pg = getPgClient();
  if (pg) {
    const rows = await pg`
      INSERT INTO posts (title, slug, excerpt, body, category, tags_json, status, published_at, scheduled_at, reading_minutes, visual, author_name)
      VALUES (${input.title}, ${input.slug}, ${input.excerpt}, ${input.body}, ${input.category}, ${JSON.stringify(input.tags)}, ${input.status}, ${input.publishedAt || null}, ${input.scheduledAt}, ${input.readingMinutes}, ${input.visual}, ${input.authorName || EDITOR_IN_CHIEF.name})
      RETURNING *
    `;
    return mapPost(rows[0] as Record<string, unknown>);
  }
  const d1 = await db();
  const row = await d1
    .prepare("INSERT INTO posts (title,slug,excerpt,body,category,tags_json,status,published_at,scheduled_at,reading_minutes,visual,author_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *")
    .bind(input.title, input.slug, input.excerpt, input.body, input.category, JSON.stringify(input.tags), input.status, input.publishedAt || null, input.scheduledAt, input.readingMinutes, input.visual, input.authorName || EDITOR_IN_CHIEF.name)
    .first();
  return mapPost(row as Record<string, unknown>);
}

export async function updatePost(id: number, input: Omit<Post, "id">) {
  if (input.status === "published" || input.status === "scheduled") assertPublicationReady(input);
  const pg = getPgClient();
  if (pg) {
    const rows = await pg`
      UPDATE posts SET title=${input.title}, slug=${input.slug}, excerpt=${input.excerpt}, body=${input.body}, category=${input.category}, tags_json=${JSON.stringify(input.tags)}, status=${input.status}, published_at=${input.publishedAt || null}, scheduled_at=${input.scheduledAt}, reading_minutes=${input.readingMinutes}, visual=${input.visual}, author_name=${input.authorName || EDITOR_IN_CHIEF.name}, updated_at=NOW()
      WHERE id=${id} RETURNING *
    `;
    if (!rows[0]) throw new Error("수정할 글을 찾지 못했습니다.");
    await pg`UPDATE posting_queue SET status=${input.status === "published" ? "published" : input.status}, scheduled_at=${input.scheduledAt} WHERE post_id=${id}`;
    return mapPost(rows[0] as Record<string, unknown>);
  }
  const d1 = await db();
  const row = await d1
    .prepare("UPDATE posts SET title=?,slug=?,excerpt=?,body=?,category=?,tags_json=?,status=?,published_at=?,scheduled_at=?,reading_minutes=?,visual=?,author_name=?,updated_at=CURRENT_TIMESTAMP WHERE id=? RETURNING *")
    .bind(input.title, input.slug, input.excerpt, input.body, input.category, JSON.stringify(input.tags), input.status, input.publishedAt || null, input.scheduledAt, input.readingMinutes, input.visual, input.authorName || EDITOR_IN_CHIEF.name, id)
    .first();
  if (!row) throw new Error("수정할 글을 찾지 못했습니다.");
  await d1
    .prepare("UPDATE posting_queue SET status=?, scheduled_at=? WHERE post_id=?")
    .bind(input.status === "published" ? "published" : input.status, input.scheduledAt, id)
    .run();
  return mapPost(row as Record<string, unknown>);
}

export async function verifyPublicationOriginality(input:{body:string;sourceUrls:string[];editorName:string;title:string;postId?:number}){
  const d1=await db();let result=await checkAgainstSources(input.body,input.sourceUrls);
  const existing=await d1.prepare("SELECT id,title,body FROM posts WHERE (? IS NULL OR id!=?) ORDER BY updated_at DESC LIMIT 80").bind(input.postId??null,input.postId??null).all();
  for(const row of existing.results){const internal=compareOriginality(input.body,String(row.body??""));if(internal.status==="blocked"&&(internal.overlapRatio>result.overlapRatio||result.status!=="blocked")){result={...internal,sourceUrl:`internal:post:${Number(row.id)}`,message:`기존 글 ‘${String(row.title)}’과 동일한 문장이 과도합니다. 문장 구조와 설명 사례를 새로 작성하세요.`};}}
  await d1.prepare("INSERT INTO originality_checks (post_id,editor_name,title,source_url,status,overlap_ratio,longest_match_chars,message) VALUES (?,?,?,?,?,?,?,?)").bind(input.postId??null,input.editorName,input.title,result.sourceUrl,result.status,Math.round(result.overlapRatio*1000),result.longestMatchChars,result.message).run();
  if(result.status!=="passed")throw new OriginalityCheckError(result);return result;
}

export async function createAutomationDraft(input: {
  topic: string;
  category: string;
  sourceUrl: string;
  scheduledAt: string | null;
}) {
  const post = await createPost({
    title: input.topic,
    slug: `${input.topic.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`,
    excerpt: "공식 자료를 바탕으로 검토 중인 콘텐츠 초안입니다.",
    body: `이 글은 아래 공식 자료를 바탕으로 작성하는 검토용 초안입니다.\n\n## 독자가 궁금한 핵심 질문\n\n- 누가 대상인가요?\n- 언제, 어디에서 신청하나요?\n- 놓치기 쉬운 조건은 무엇인가요?\n\n## 편집 전 확인\n\n숫자, 날짜, 신청 조건을 원문과 다시 대조하세요. 개인의 상황에 따라 적용 결과가 달라질 수 있다는 안내를 추가하세요.\n\n출처: ${input.sourceUrl}`,
    category: input.category,
    tags: ["자동 초안", "공식 자료"],
    status: "draft",
    publishedAt: "",
    scheduledAt: input.scheduledAt,
    readingMinutes: 4,
    visual: "DRAFT",
    authorName: EDITOR_IN_CHIEF.name,
  });
  const d1 = await db();
  await d1
    .prepare("INSERT INTO posting_queue (post_id,status,source_url,scheduled_at) VALUES (?,?,?,?)")
    .bind(post.id, "review", input.sourceUrl, input.scheduledAt)
    .run();
  return post;
}

export async function getPostingQueue() {
  const d1 = await db();
  const result = await d1
    .prepare("SELECT q.id,q.post_id,p.title,q.status,q.source_url,q.scheduled_at,q.attempts FROM posting_queue q JOIN posts p ON p.id=q.post_id ORDER BY q.created_at DESC")
    .all();
  return result.results.map((row) => ({
    id: Number(row.id),
    postId: Number(row.post_id),
    title: String(row.title),
    status: String(row.status),
    sourceUrl: row.source_url ? String(row.source_url) : null,
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : null,
    attempts: Number(row.attempts ?? 0),
  } satisfies QueueItem));
}

export async function exportAll() {
  const d1 = await db();
  const exportedAt=new Date().toISOString();
  await d1.prepare("INSERT INTO site_settings (key,value_json,updated_at) VALUES ('last_backup_at',?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=CURRENT_TIMESTAMP").bind(JSON.stringify(exportedAt)).run();
  const [posts, categories, queue, settings, agents, agentRuns, promotions, managementIssues, managementRuns, originalityChecks, auditRuns, auditFindings] = await Promise.all([
    d1.prepare("SELECT * FROM posts").all(),
    d1.prepare("SELECT * FROM categories").all(),
    d1.prepare("SELECT * FROM posting_queue").all(),
    d1.prepare("SELECT * FROM site_settings").all(),
    d1.prepare("SELECT * FROM content_agents").all(),
    d1.prepare("SELECT * FROM agent_runs").all(),
    d1.prepare("SELECT * FROM promotion_campaigns").all(),
    d1.prepare("SELECT * FROM management_issues").all(),
    d1.prepare("SELECT * FROM management_runs").all(),
    d1.prepare("SELECT * FROM originality_checks").all(),
    d1.prepare("SELECT * FROM audit_runs").all(),
    d1.prepare("SELECT * FROM audit_findings").all(),
  ]);
  return {
    format: "retire-rich-content-v1",
    exportedAt,
    posts: posts.results,
    categories: categories.results,
    postingQueue: queue.results,
    siteSettings: settings.results,
    contentAgents: agents.results,
    agentRuns: agentRuns.results,
    promotionCampaigns: promotions.results,
    managementIssues: managementIssues.results,
    managementRuns: managementRuns.results,
    originalityChecks: originalityChecks.results,
    auditRuns: auditRuns.results,
    auditFindings: auditFindings.results,
  };
}

function mapAgent(row:Record<string,unknown>):ContentAgentState{return{id:String(row.id),name:String(row.name),category:String(row.category),mission:String(row.mission),status:row.status==="paused"?"paused":"active",cadenceHours:Number(row.cadence_hours),sources:JSON.parse(String(row.sources_json??"[]")),topics:JSON.parse(String(row.topics_json??"[]")),video:row.video_json?JSON.parse(String(row.video_json)):undefined,nextRunAt:row.next_run_at?String(row.next_run_at):null,lastRunAt:row.last_run_at?String(row.last_run_at):null,topicCursor:Number(row.topic_cursor??0)};}
function mapAgentRun(row:Record<string,unknown>):AgentRun{return{id:Number(row.id),agentId:String(row.agent_id),agentName:String(row.agent_name??""),status:String(row.status),topic:String(row.topic),postId:row.post_id?Number(row.post_id):null,message:row.message?String(row.message):null,createdAt:String(row.created_at)};}
function mapPromotion(row:Record<string,unknown>):PromotionCampaign{const hashtags=JSON.parse(String(row.hashtags_json??"[]")) as string[];return{id:Number(row.id),postId:Number(row.post_id),title:String(row.title),slug:String(row.slug),status:row.status==="executed"?"executed":"prepared",headline:String(row.headline),socialCopy:String(row.social_copy),communityCopy:String(row.community_copy),hashtags,channels:JSON.parse(String(row.channels_json??"[]")),channelPlans:buildMarketingChannelPlans({slug:String(row.slug),title:String(row.title),excerpt:row.excerpt?String(row.excerpt):undefined,category:row.category?String(row.category):undefined,hashtags}),createdAt:String(row.created_at),executedAt:row.executed_at?String(row.executed_at):null};}
function htmlEscape(value:string){return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
export async function getContentAgentDashboard(){const d1=await db();const [agents,runs]=await Promise.all([d1.prepare("SELECT * FROM content_agents ORDER BY name").all(),d1.prepare("SELECT r.*,a.name AS agent_name FROM agent_runs r JOIN content_agents a ON a.id=r.agent_id ORDER BY r.created_at DESC,r.id DESC LIMIT 30").all()]);return{agents:agents.results.map(row=>mapAgent(row as Record<string,unknown>)),runs:runs.results.map(row=>mapAgentRun(row as Record<string,unknown>))};}

export async function setContentAgentStatus(id:string,status:"active"|"paused"){const d1=await db();const row=await d1.prepare("UPDATE content_agents SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? RETURNING *").bind(status,id).first();if(!row)throw new Error("에이전트를 찾지 못했습니다.");return mapAgent(row as Record<string,unknown>);}

export async function getPromotionCampaigns(){const d1=await db();const result=await d1.prepare("SELECT c.*,p.title,p.slug,p.excerpt,p.category FROM promotion_campaigns c JOIN posts p ON p.id=c.post_id ORDER BY c.created_at DESC,c.id DESC LIMIT 30").all();return result.results.map(row=>mapPromotion(row as Record<string,unknown>));}

export async function preparePromotionCampaign(postId?:number){
  assertTeamPermission("promotion","promotion.prepare");
  const d1=await db();
  const post=postId
    ? await d1.prepare("SELECT * FROM posts WHERE id=? AND status='published'").bind(postId).first()
    : await d1.prepare("SELECT p.* FROM posts p WHERE p.status='published' AND NOT EXISTS (SELECT 1 FROM promotion_campaigns c WHERE c.post_id=p.id) ORDER BY p.published_at DESC,p.id DESC LIMIT 1").first();
  if(!post)throw new Error("홍보할 새 발행 글을 찾지 못했습니다.");
  const existing=await d1.prepare("SELECT c.*,p.title,p.slug,p.excerpt,p.category FROM promotion_campaigns c JOIN posts p ON p.id=c.post_id WHERE c.post_id=?").bind(Number(post.id)).first();
  if(existing)return mapPromotion(existing as Record<string,unknown>);
  const title=String(post.title);const excerpt=String(post.excerpt??"").trim();const slug=String(post.slug);const category=String(post.category);
  const postTags=JSON.parse(String(post.tags_json??"[]")) as string[];
  const hashtags=Array.from(new Set(["퇴기사",category.replace(/[^0-9A-Za-z가-힣]/g,""),...postTags.map(tag=>String(tag).replace(/[^0-9A-Za-z가-힣]/g,""))].filter(Boolean))).slice(0,6);
  const url=`https://adbles.com/posts/${slug}`;
  const summary=excerpt||`${title}에 관한 핵심 내용과 실행 순서를 정리했습니다.`;
  const headline=`${title} | ${SITE_NAME}`;
  const socialCopy=`${summary}\n\n지금 확인하기: ${url}\n${hashtags.map(tag=>`#${tag}`).join(" ")}`;
  const communityCopy=`퇴직 이후의 돈·일·건강을 준비하는 분께 도움이 될 글을 공유합니다.\n\n${title}\n${summary}\n\n본문에서는 확인해야 할 기준과 바로 실행할 순서를 함께 정리했습니다.\n${url}\n\n※ 중요한 결정 전에는 글에 연결된 공식 기관의 최신 원문도 확인하세요.`;
  const channels=["네이버 블로그·카페","카카오톡","페이스북","X"];
  const created=await d1.prepare("INSERT INTO promotion_campaigns (post_id,status,headline,social_copy,community_copy,hashtags_json,channels_json) VALUES (?,'prepared',?,?,?,?,?) RETURNING *").bind(Number(post.id),headline,socialCopy,communityCopy,JSON.stringify(hashtags),JSON.stringify(channels)).first();
  return mapPromotion({...created,title,slug,excerpt,category} as Record<string,unknown>);
}

export async function executePromotionCampaign(id:number){assertTeamPermission("promotion","promotion.execute.record");const d1=await db();const row=await d1.prepare("UPDATE promotion_campaigns SET status='executed',executed_at=CURRENT_TIMESTAMP WHERE id=? RETURNING *").bind(id).first();if(!row)throw new Error("홍보 작업을 찾지 못했습니다.");const post=await d1.prepare("SELECT title,slug,excerpt,category FROM posts WHERE id=?").bind(Number(row.post_id)).first();return mapPromotion({...row,...post} as Record<string,unknown>);}

const agentScenarios:Record<string,string>={
  "실제 수익실험":"예를 들어 첫 달 목표를 매출이 아니라 유료 문의 1건으로 정하고, 준비시간과 실제 작업시간을 나눠 기록합니다.",
  "정부지원·세무":"예를 들어 대상 여부, 신청기한, 제출서류와 담당기관 답변을 한 장에 적어 경험담과 공식 기준을 섞지 않습니다.",
  "유용한 도구":"예를 들어 계산 결과만 보여주지 않고 입력값의 뜻, 계산식, 결과가 달라지는 조건과 공식 확인처를 함께 제공합니다.",
  "지역 생활정보":"예를 들어 지역명만 바꾸지 않고 실제 담당기관, 신청 창구, 운영기간과 문의 전 준비할 질문을 확인합니다.",
  "건강·예방":"예를 들어 증상만 나열하지 않고 응급 신호, 예방 행동, 진료가 필요한 시점과 공공기관 안내를 구분합니다.",
  "영상 큐레이션":"예를 들어 조회수만 보지 않고 공식 채널 여부, 설명의 최신성, 본문과의 관련성, 과장 표현 여부를 함께 확인합니다.",
};

function buildAgentArticleBody(agent:ContentAgentState,topic:string){
  const sourceRows=agent.sources.map(source=>`<tr><td><a href="${htmlEscape(source.url)}" target="_blank" rel="noopener noreferrer">${htmlEscape(source.name)} 공식 원문</a></td><td>대상·기준일·신청 또는 실행 조건</td><td>발행 전 재확인</td></tr>`).join("");
  const sourceList=agent.sources.map(source=>`<li><a href="${htmlEscape(source.url)}" target="_blank" rel="noopener noreferrer">${htmlEscape(source.name)}에서 최신 기준 확인</a></li>`).join("");
  const scenario=agentScenarios[agent.category]??"예를 들어 실제 조건과 숫자를 넣은 작은 사례를 만들고, 독자가 자기 상황에 적용할 때 바꿔야 할 항목을 따로 표시합니다.";
  const video=agent.video?`<h2>글과 함께 확인할 공식 영상</h2><p>아래 영상은 글의 핵심 개념을 다른 방식으로 이해하는 보조자료입니다. 영상의 게시일과 설명란도 함께 확인하세요.</p><div class="embedded-video"><iframe src="${htmlEscape(agent.video.embedUrl)}" title="${htmlEscape(agent.video.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p><a href="${htmlEscape(agent.video.sourceUrl)}" target="_blank" rel="noopener noreferrer">${htmlEscape(agent.video.title)} 원본 영상과 채널 확인</a></p>`:"";
  const body=`<p><strong>${htmlEscape(topic)}</strong>을 알아볼 때 가장 먼저 해야 할 일은 검색 결과를 많이 모으는 것이 아니라, 내 조건에 적용되는 공식 기준과 실행 순서를 분리하는 것입니다. 이 글은 ${htmlEscape(agent.mission)} 독자가 직접 확인할 수 있도록 원문 링크, 사례, 표와 체크리스트를 함께 구성했습니다.</p><h2>이 글이 답할 질문</h2><ul><li>누가 이 내용을 먼저 확인해야 하는가?</li><li>금액·기간·대상 조건 중 개인별로 달라지는 것은 무엇인가?</li><li>오늘 바로 할 수 있는 가장 작은 행동은 무엇인가?</li></ul><h2>실제 상황에 적용하는 예시</h2><p>${htmlEscape(scenario)}</p><blockquote>사례의 숫자와 조건은 설명을 위한 예시입니다. 실제 신청·신고·진료·투자 판단은 본인의 조건과 최신 원문을 기준으로 확인하세요.</blockquote><h2>원문을 대조하는 표</h2><table><thead><tr><th>확인처</th><th>확인할 내용</th><th>점검 시점</th></tr></thead><tbody>${sourceRows}</tbody></table><h2>실행 전 체크리스트</h2><ol><li>공식 페이지의 게시일과 적용기간을 확인합니다.</li><li>대상·소득·연령·지역처럼 달라지는 조건을 표시합니다.</li><li>전화나 방문 문의가 필요하면 질문을 세 문장으로 적습니다.</li><li>결과뿐 아니라 걸린 시간과 비용을 기록합니다.</li></ol><h2>공식 확인처</h2><ul>${sourceList}</ul>${video}<h2>편집실의 판단 기준</h2><p>과장된 수익 보장, 근거 없는 숫자, 출처가 불분명한 경험담은 결론의 근거로 사용하지 않습니다. 공식 기준과 실제 사례가 다르면 차이가 생긴 조건을 설명하고, 변경 가능성이 큰 정보에는 신청 또는 실행 시점의 재확인을 안내합니다.</p>`;
  const plain=body.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
  const headings=(body.match(/<h2>/g)??[]).length;
  // 실패 사유를 수치로 남겨야 어떤 기준이 모자란지 관리자 화면에서 바로 확인할 수 있습니다.
  if(agent.sources.length===0||plain.length<900||headings<5)throw new Error(`콘텐츠 품질 기준을 충족하지 못해 발행하지 않았습니다. (공식 출처 ${agent.sources.length}곳/최소 1곳, 본문 ${plain.length}자/최소 900자, 소제목 ${headings}개/최소 5개)`);
  return body;
}

export async function runContentAgent(id:string){
  assertTeamPermission("editorial","content.draft.create");
  const d1=await db();
  const row=await d1.prepare("SELECT * FROM content_agents WHERE id=?").bind(id).first();
  if(!row)throw new Error("에이전트를 찾지 못했습니다.");
  const agent=mapAgent(row as Record<string,unknown>);
  if(agent.status!=="active")throw new Error("일시정지된 에이전트입니다.");
  const topic=agent.topics[agent.topicCursor%agent.topics.length]??`${agent.category} 업데이트`;
  const body=buildAgentArticleBody(agent,topic);
  const now=new Date();
  const post=await createPost({title:topic,slug:`${topic.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g,"-").replace(/^-|-$/g,"")}-${Date.now().toString(36)}`,excerpt:`${agent.mission} 공식 원문, 적용 사례, 비교표와 실행 체크리스트를 함께 정리했습니다.`,body,category:agent.category,tags:[agent.name,"공식 자료","사례·체크리스트","정책 검토 대기"],status:"draft",publishedAt:"",scheduledAt:null,readingMinutes:8,visual:"REVIEW",authorName:agent.name});
  const next=new Date(now.getTime()+agent.cadenceHours*60*60*1000).toISOString();
  await d1.batch([
    d1.prepare("INSERT INTO posting_queue (post_id,status,source_url,scheduled_at) VALUES (?,?,?,NULL)").bind(post.id,"review",agent.sources[0]?.url??null),
    d1.prepare("UPDATE content_agents SET last_run_at=?,next_run_at=?,topic_cursor=topic_cursor+1,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(now.toISOString(),next,id),
    d1.prepare("INSERT INTO agent_runs (agent_id,status,topic,post_id,message) VALUES (?,?,?,?,?)").bind(id,"review",topic,post.id,"초안을 생성했고 경영관리팀의 발행정책 검토 대기열에 등록했습니다."),
  ]);
  return post;
}

/** 실패한 에이전트가 다시 시도하기까지 쉬는 시간입니다. */
export const AGENT_RETRY_BACKOFF_MINUTES=60;

export async function runDueContentAgents(){
  assertTeamPermission("management","automation.run");
  await publishDuePosts();
  const d1=await db();
  const now=new Date();
  const due=await d1.prepare("SELECT id FROM content_agents WHERE status='active' AND next_run_at IS NOT NULL AND next_run_at<=? ORDER BY next_run_at LIMIT 2").bind(now.toISOString()).all();
  let failed=0;
  for(const row of due.results){
    try{await runContentAgent(String(row.id));}
    catch(error){
      failed++;
      // 실패해도 다음 실행 시각을 미뤄야 합니다. 그러지 않으면 항상 가장 오래된 실행 대기 상태로 남아
      // 매 실행마다 한정된 실행 슬롯을 독차지하고, 정상 동작하는 에이전트가 영원히 실행되지 못합니다.
      await d1.batch([
        d1.prepare("INSERT INTO agent_runs (agent_id,status,topic,message) VALUES (?,?,?,?)").bind(String(row.id),"failed","자동 업데이트",errorMessage(error)),
        d1.prepare("UPDATE content_agents SET next_run_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(new Date(now.getTime()+AGENT_RETRY_BACKOFF_MINUTES*60*1000).toISOString(),String(row.id)),
      ]);
    }
  }
  return{checked:due.results.length,failed};
}

function mapManagementIssue(row:Record<string,unknown>):ManagementIssue{return{id:Number(row.id),issueKey:String(row.issue_key),auditorId:String(row.auditor_id),auditorName:managementDepartment.find(member=>member.id===row.auditor_id)?.name??String(row.auditor_id),severity:row.severity==="critical"?"critical":row.severity==="warning"?"warning":"info",scope:String(row.scope),status:row.status==="resolved"?"resolved":"open",title:String(row.title),details:String(row.details),actionTaken:row.action_taken?String(row.action_taken):null,postId:row.post_id?Number(row.post_id):null,postTitle:row.post_title?String(row.post_title):null,createdAt:String(row.created_at),resolvedAt:row.resolved_at?String(row.resolved_at):null};}
function mapManagementRun(row:Record<string,unknown>):ManagementRun{return{id:Number(row.id),status:String(row.status),checkedCount:Number(row.checked_count),issueCount:Number(row.issue_count),actionCount:Number(row.action_count),summary:String(row.summary),createdAt:String(row.created_at)};}
function mapOriginalityCheck(row:Record<string,unknown>):OriginalityCheck{return{id:Number(row.id),postId:row.post_id?Number(row.post_id):null,editorName:String(row.editor_name),title:String(row.title),sourceUrl:row.source_url?String(row.source_url):null,status:row.status==="blocked"?"blocked":row.status==="unavailable"?"unavailable":"passed",overlapRatio:Number(row.overlap_ratio??0)/1000,longestMatchChars:Number(row.longest_match_chars??0),message:String(row.message),checkedAt:String(row.checked_at)};}

export async function runSiteManagementAudit(){
  assertTeamPermission("management","audit.run");
  const d1=await db();
  const [postRows,queueRows,failedRows,agentRows,originalityRows]=await Promise.all([
    d1.prepare("SELECT * FROM posts WHERE status IN ('published','scheduled') ORDER BY id").all(),
    d1.prepare("SELECT q.*,p.title FROM posting_queue q JOIN posts p ON p.id=q.post_id WHERE q.status='review' AND julianday('now')-julianday(q.created_at)>=2").all(),
    d1.prepare("SELECT r.*,a.name AS agent_name FROM agent_runs r JOIN content_agents a ON a.id=r.agent_id WHERE r.status='failed' AND julianday('now')-julianday(r.created_at)<=7").all(),
    d1.prepare("SELECT * FROM content_agents WHERE status='active' AND (json_array_length(sources_json)=0 OR (next_run_at IS NOT NULL AND next_run_at<?))").bind(new Date(Date.now()-2*60*60*1000).toISOString()).all(),
    d1.prepare("SELECT * FROM originality_checks WHERE status!='passed' AND julianday('now')-julianday(checked_at)<=7 ORDER BY checked_at DESC LIMIT 30").all(),
  ]);
  const activeKeys=new Set<string>();let actionCount=0;
  const report=async(issue:{key:string;auditorId:string;severity:string;scope:string;title:string;details:string;action?:string;postId?:number})=>{activeKeys.add(issue.key);await d1.prepare(`INSERT INTO management_issues (issue_key,auditor_id,severity,scope,status,title,details,action_taken,post_id) VALUES (?,?,?,?,'open',?,?,?,?,?) ON CONFLICT(issue_key) DO UPDATE SET auditor_id=excluded.auditor_id,severity=excluded.severity,scope=excluded.scope,status='open',title=excluded.title,details=excluded.details,action_taken=excluded.action_taken,post_id=excluded.post_id,updated_at=CURRENT_TIMESTAMP,resolved_at=NULL`).bind(issue.key,issue.auditorId,issue.severity,issue.scope,issue.title,issue.details,issue.action??null,issue.postId??null).run();};

  for(const row of postRows.results){const post=mapPost(row as Record<string,unknown>);for(const finding of inspectPublicationPolicy(post)){let action:string|undefined;if(post.status==="scheduled"&&finding.severity==="critical"){await d1.batch([d1.prepare("UPDATE posts SET status='draft',scheduled_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(post.id),d1.prepare("UPDATE posting_queue SET status='review',scheduled_at=NULL,last_error=? WHERE post_id=?").bind(finding.title,post.id)]);action="예약 발행을 중지하고 검토 대기로 전환했습니다.";actionCount++;}await report({key:`policy:${post.id}:${finding.code}`,auditorId:"policy-lead",severity:finding.severity,scope:"발행정책",title:finding.title,details:`‘${post.title}’ — ${finding.details}`,action,postId:post.id});}}
  for(const row of queueRows.results)await report({key:`queue-overdue:${row.id}`,auditorId:"operations-guard",severity:"warning",scope:"검토 대기",title:"검토 대기가 48시간을 넘었습니다",details:`‘${String(row.title)}’ 초안의 담당자와 처리 기한을 확인하세요.`,postId:Number(row.post_id)});
  for(const row of failedRows.results)await report({key:`agent-failed:${row.id}`,auditorId:"operations-guard",severity:"critical",scope:"자동화",title:"콘텐츠 자동화가 실패했습니다",details:`${String(row.agent_name)} — ${String(row.message??"원인을 확인하세요.")}`,postId:row.post_id?Number(row.post_id):undefined});
  for(const row of agentRows.results){const noSources=JSON.parse(String(row.sources_json??"[]")).length===0;let action:string|undefined;if(noSources){await d1.prepare("UPDATE content_agents SET status='paused',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(String(row.id)).run();action="공식 출처가 없는 에이전트를 자동으로 일시정지했습니다.";actionCount++;}await report({key:`agent-health:${row.id}`,auditorId:"site-safety",severity:noSources?"critical":"warning",scope:"사이트 운영",title:noSources?"에이전트의 공식 출처가 없습니다":"자동화 실행이 예정 시각보다 늦었습니다",details:`${String(row.name)}의 설정과 실행 상태를 확인하세요.`,action});}
  for(const row of originalityRows.results){if(row.status==="blocked")actionCount++;await report({key:`originality:${row.id}`,auditorId:"policy-lead",severity:row.status==="blocked"?"critical":"warning",scope:"원문 복사 감시",title:row.status==="blocked"?"원문 복사 의심으로 발행을 차단했습니다":"원문 대조를 완료하지 못했습니다",details:`${String(row.editor_name)} 편집자의 ‘${String(row.title)}’ — ${String(row.message)}`,action:"편집자에게 원문을 그대로 옮기지 말고 독자용 설명·사례·표로 재작성하도록 자동 요청했습니다.",postId:row.post_id?Number(row.post_id):undefined});}

  const openRows=await d1.prepare("SELECT issue_key FROM management_issues WHERE status='open'").all();for(const row of openRows.results){const key=String(row.issue_key);if(!activeKeys.has(key))await d1.prepare("UPDATE management_issues SET status='resolved',resolved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE issue_key=?").bind(key).run();}
  const signalCount=queueRows.results.length+failedRows.results.length+agentRows.results.length+originalityRows.results.length;const summary=`글 ${postRows.results.length}건과 운영 신호 ${signalCount}건을 점검했습니다.`;
  const run=await d1.prepare("INSERT INTO management_runs (status,checked_count,issue_count,action_count,summary) VALUES ('completed',?,?,?,?) RETURNING *").bind(postRows.results.length+signalCount,activeKeys.size,actionCount,summary).first();
  return mapManagementRun(run as Record<string,unknown>);
}

export async function getSiteManagementDashboard(){const d1=await db();const [issues,runs,originalityChecks]=await Promise.all([d1.prepare("SELECT i.*,p.title AS post_title FROM management_issues i LEFT JOIN posts p ON p.id=i.post_id ORDER BY CASE i.status WHEN 'open' THEN 0 ELSE 1 END,CASE i.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,i.updated_at DESC LIMIT 60").all(),d1.prepare("SELECT * FROM management_runs ORDER BY created_at DESC,id DESC LIMIT 20").all(),d1.prepare("SELECT * FROM originality_checks ORDER BY checked_at DESC,id DESC LIMIT 30").all()]);return{members:managementDepartment,companyRules,companyResources:companyResourceRegistry,safeReleasePolicy,notice:organizationNotice,policyCoverage:organizationPolicyCoverage,policyRecipients:organizationPolicyRecipients,originalityChecks:originalityChecks.results.map(row=>mapOriginalityCheck(row as Record<string,unknown>)),issues:issues.results.map(row=>mapManagementIssue(row as Record<string,unknown>)),runs:runs.results.map(row=>mapManagementRun(row as Record<string,unknown>))};}
export async function runDueSiteManagementAudit(){const d1=await db();const recent=await d1.prepare("SELECT id FROM management_runs WHERE created_at>=datetime('now','-6 hours') LIMIT 1").first();return recent?null:runSiteManagementAudit();}
export async function resolveManagementIssue(id:number){assertTeamPermission("management","audit.resolve");const d1=await db();const row=await d1.prepare("UPDATE management_issues SET status='resolved',resolved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=? RETURNING *").bind(id).first();if(!row)throw new Error("관리 문제를 찾지 못했습니다.");return mapManagementIssue(row as Record<string,unknown>);}

function mapAuditRun(row:Record<string,unknown>):AuditRun{return{id:Number(row.id),scope:String(row.scope),leadAuditor:String(row.lead_auditor),status:String(row.status),overallOpinion:String(row.overall_opinion),totalItems:Number(row.total_items),passedItems:Number(row.passed_items),findingCount:Number(row.finding_count),startedAt:String(row.started_at),completedAt:row.completed_at?String(row.completed_at):null};}
function mapAuditFinding(row:Record<string,unknown>):AuditFinding{return{id:Number(row.id),auditRunId:Number(row.audit_run_id),domain:String(row.domain),severity:row.severity==="critical"?"critical":row.severity==="major"?"major":row.severity==="minor"?"minor":"info",status:row.status==="resolved"?"resolved":row.status==="compliant"?"compliant":"open",title:String(row.title),details:String(row.details),actionOwner:String(row.action_owner),dueAt:row.due_at?String(row.due_at):null,resolution:row.resolution?String(row.resolution):null,createdAt:String(row.created_at),resolvedAt:row.resolved_at?String(row.resolved_at):null};}

type AuditCheck={domain:string;severity:AuditFinding["severity"];title:string;details:string;actionOwner:string};
function dueDate(severity:AuditFinding["severity"]){const days=severity==="critical"?3:severity==="major"?7:severity==="minor"?14:0;return days?new Date(Date.now()+days*86400000).toISOString():null;}

export async function runOrganizationAudit(){
  assertTeamPermission("management","audit.run");
  const d1=await db();
  const started=await d1.prepare("INSERT INTO audit_runs (scope,lead_auditor,status,overall_opinion) VALUES (?,?,'running','산정 중') RETURNING *").bind(AUDIT_SCOPE,"박지안").first();
  if(!started)throw new Error("감사 실행 이력을 만들지 못했습니다.");
  const auditRunId=Number(started.id);
  try{
    const [posts,overdue,failed,agents,originality,promotions,settings,openCritical]=await Promise.all([
      d1.prepare("SELECT * FROM posts WHERE status IN ('published','scheduled')").all(),
      d1.prepare("SELECT COUNT(*) AS count FROM posting_queue WHERE status='review' AND julianday('now')-julianday(created_at)>=2").first<{count:number}>(),
      d1.prepare("SELECT COUNT(*) AS count FROM agent_runs WHERE status='failed' AND julianday('now')-julianday(created_at)<=7").first<{count:number}>(),
      d1.prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN json_array_length(sources_json)=0 THEN 1 ELSE 0 END) AS no_sources FROM content_agents WHERE status='active'").first<{total:number;no_sources:number}>(),
      d1.prepare("SELECT status,COUNT(*) AS count FROM originality_checks WHERE julianday('now')-julianday(checked_at)<=30 GROUP BY status").all(),
      d1.prepare("SELECT COUNT(*) AS count FROM promotion_campaigns c JOIN posts p ON p.id=c.post_id WHERE c.status='executed' AND p.status!='published'").first<{count:number}>(),
      d1.prepare("SELECT key,value_json FROM site_settings WHERE key IN ('company_rules_version','last_backup_at')").all(),
      d1.prepare("SELECT COUNT(*) AS count FROM management_issues WHERE status='open' AND severity='critical'").first<{count:number}>(),
    ]);
    const settingsMap=new Map(settings.results.map(row=>[String(row.key),String(row.value_json)]));
    const policyProblems=posts.results.reduce((sum,row)=>sum+inspectPublicationPolicy(mapPost(row as Record<string,unknown>)).length,0);
    const originalityCounts=new Map(originality.results.map(row=>[String(row.status),Number(row.count)]));
    const security=env as unknown as {ADMIN_USERNAME?:string;ADMIN_PASSWORD_HASH?:string;ADMIN_SESSION_SECRET?:string};
    const checks:AuditCheck[]=[
      {domain:"governance",severity:settingsMap.get("company_rules_version")===JSON.stringify(COMPANY_RULES_VERSION)&&companyRules.strategicObjectives.every(item=>item.owner&&item.kpis.length)?"info":"major",title:"사규·경영목표 책임체계",details:`사규 ${COMPANY_RULES_VERSION}, 경영목표 ${companyRules.strategicObjectives.length}개와 담당자를 대조했습니다.`,actionOwner:"강한결"},
      {domain:"people",severity:organizationPolicyCoverage.applied===organizationPolicyCoverage.total?"info":"major",title:"전 직원 사규 적용",details:`전사 적용 ${organizationPolicyCoverage.applied}/${organizationPolicyCoverage.total}명, ${organizationPolicyCoverage.departments.length}개 팀을 확인했습니다.`,actionOwner:"강한결"},
      {domain:"resources",severity:companyResourceRegistry.every(item=>item.owner&&item.custodian&&item.control)?"info":"major",title:"리소스 책임자 지정",details:`핵심 리소스 ${companyResourceRegistry.length}종의 소유팀·실무관리·통제기준을 점검했습니다.`,actionOwner:"윤서진"},
      {domain:"content",severity:policyProblems?"critical":"info",title:"공개·예약 콘텐츠 발행정책",details:`대상 ${posts.results.length}건에서 정책 위반 신호 ${policyProblems}건을 확인했습니다.`,actionOwner:"데스크"},
      {domain:"content",severity:(originalityCounts.get("blocked")??0)>0?"major":(originalityCounts.get("unavailable")??0)>0?"minor":"info",title:"원문 복사·독창성 검사",details:`최근 30일 차단 ${originalityCounts.get("blocked")??0}건, 직접 확인 필요 ${originalityCounts.get("unavailable")??0}건입니다.`,actionOwner:"박지안"},
      {domain:"quality",severity:qualityDesignTeam.length===7&&qualityDesignGates.length===5?"info":"major",title:"품질디자인 게이트",details:`품질디자인 담당 ${qualityDesignTeam.length}명과 발행 게이트 ${qualityDesignGates.length}단계를 확인했습니다.`,actionOwner:"결"},
      {domain:"promotion",severity:Number(promotions?.count??0)>0?"major":"info",title:"승인 콘텐츠 홍보",details:`비공개 글의 홍보 실행 기록 ${Number(promotions?.count??0)}건을 확인했습니다.`,actionOwner:"픽"},
      {domain:"security",severity:security.ADMIN_USERNAME&&security.ADMIN_PASSWORD_HASH&&security.ADMIN_SESSION_SECRET?"info":"critical",title:"관리자 인증 구성",details:"관리자 계정·비밀번호 해시·세션 비밀의 구성 여부만 확인했습니다. 비밀값은 감사기록에 저장하지 않습니다.",actionOwner:"강한결"},
      {domain:"data",severity:settingsMap.has("last_backup_at")?"info":"minor",title:"최근 백업 증거",details:settingsMap.has("last_backup_at")?"전체 내보내기 시각이 운영설정에 기록되어 있습니다.":"최근 전체 내보내기 시각이 아직 운영설정에 기록되지 않았습니다.",actionOwner:"박지안"},
      {domain:"automation",severity:Number(failed?.count??0)>0||Number(agents?.no_sources??0)>0?"major":Number(overdue?.count??0)>0?"minor":"info",title:"자동화·검토대기 건전성",details:`실패 ${Number(failed?.count??0)}건, 출처 없는 가동 에이전트 ${Number(agents?.no_sources??0)}건, 48시간 초과 검토 ${Number(overdue?.count??0)}건입니다.`,actionOwner:"윤서진"},
      {domain:"governance",severity:Number(openCritical?.count??0)>0?"major":"info",title:"경영관리팀 긴급 문제 후속조치",details:`미해결 긴급 관리문제 ${Number(openCritical?.count??0)}건을 확인했습니다.`,actionOwner:"윤서진"},
      {domain:"deployment",severity:"minor",title:"배포 승인·운영 검증 증거",details:"로컬 감사에서는 운영 배포 승인, 원격 DB 반영, 배포 후 사용자 검증을 확정할 수 없습니다. 배포 작업별 증거를 별도 첨부해야 합니다.",actionOwner:"박지안"},
    ];
    await d1.batch(checks.map(check=>d1.prepare("INSERT INTO audit_findings (audit_run_id,domain,severity,status,title,details,action_owner,due_at) VALUES (?,?,?,?,?,?,?,?)").bind(auditRunId,check.domain,check.severity,check.severity==="info"?"compliant":"open",check.title,check.details,check.actionOwner,dueDate(check.severity))));
    const passed=checks.filter(check=>check.severity==="info").length;const findings=checks.length-passed;
    const opinion=checks.some(check=>check.severity==="critical"||check.severity==="major")?"시정조치 필요":findings?"조건부 적정":"적정";
    const completed=await d1.prepare("UPDATE audit_runs SET status='completed',overall_opinion=?,total_items=?,passed_items=?,finding_count=?,completed_at=CURRENT_TIMESTAMP WHERE id=? RETURNING *").bind(opinion,checks.length,passed,findings,auditRunId).first();
    return mapAuditRun(completed as Record<string,unknown>);
  }catch(error){await d1.prepare("UPDATE audit_runs SET status='failed',overall_opinion=?,completed_at=CURRENT_TIMESTAMP WHERE id=?").bind(error instanceof Error?error.message:"감사 중 오류",auditRunId).run();throw error;}
}

export async function getAuditDashboard(){const d1=await db();const [runs,findings]=await Promise.all([d1.prepare("SELECT * FROM audit_runs ORDER BY started_at DESC,id DESC LIMIT 20").all(),d1.prepare("SELECT * FROM audit_findings ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'resolved' THEN 1 ELSE 2 END,CASE severity WHEN 'critical' THEN 0 WHEN 'major' THEN 1 WHEN 'minor' THEN 2 ELSE 3 END,created_at DESC,id DESC LIMIT 100").all()]);return{scope:AUDIT_SCOPE,officers:auditOfficers,domains:auditDomains,runs:runs.results.map(row=>mapAuditRun(row as Record<string,unknown>)),findings:findings.results.map(row=>mapAuditFinding(row as Record<string,unknown>))};}
export async function runDueOrganizationAudit(){const d1=await db();const recent=await d1.prepare("SELECT id FROM audit_runs WHERE status='completed' AND completed_at>=datetime('now','-30 days') LIMIT 1").first();return recent?null:runOrganizationAudit();}
export async function resolveAuditFinding(id:number,resolution:string){assertTeamPermission("management","audit.resolve");if(!resolution.trim())throw new Error("시정조치 내용을 입력하세요.");const d1=await db();const row=await d1.prepare("UPDATE audit_findings SET status='resolved',resolution=?,resolved_at=CURRENT_TIMESTAMP WHERE id=? AND status='open' RETURNING *").bind(resolution.trim(),id).first();if(!row)throw new Error("열린 감사 지적사항을 찾지 못했습니다.");return mapAuditFinding(row as Record<string,unknown>);}

function mapMemberActivityPlan(row:Record<string,unknown>):MemberActivityPlanState{return{id:String(row.id),memberId:String(row.member_id),memberName:String(row.member_name),teamId:String(row.team_id),teamName:String(row.team_name),role:String(row.role),frequency:row.frequency==="hourly"?"hourly":"daily",intervalHours:row.interval_hours==null?null:Number(row.interval_hours),dailyHourKst:row.daily_hour_kst==null?null:Number(row.daily_hour_kst),minuteOffset:Number(row.minute_offset??0),action:row.action as ActivityAction,taskTitle:String(row.task_title),instruction:String(row.instruction),safeOutput:String(row.safe_output),requiresApproval:Number(row.requires_approval)===1,status:row.status==="paused"?"paused":"active",nextRunAt:row.next_run_at?String(row.next_run_at):null,lastRunAt:row.last_run_at?String(row.last_run_at):null};}
function mapMemberActivityRun(row:Record<string,unknown>):MemberActivityRun{return{id:Number(row.id),planId:String(row.plan_id),memberName:String(row.member_name),teamName:String(row.team_name),action:row.action as ActivityAction,status:row.status==="failed"?"failed":row.status==="noop"?"noop":row.status==="review"?"review":"completed",summary:String(row.summary),startedAt:String(row.started_at),completedAt:row.completed_at?String(row.completed_at):null};}

async function activitySnapshot(d1:D1Database,action:ActivityAction){
  if(action==="management-monitor"){const run=await runDueSiteManagementAudit();return run?{status:"completed" as const,summary:`사이트 운영 ${run.checkedCount}건을 점검하고 문제 ${run.issueCount}건, 즉시조치 ${run.actionCount}건을 기록했습니다.`}:{status:"noop" as const,summary:"최근 6시간 내 사이트 점검이 완료되어 중복 감사를 생략했습니다."};}
  if(action==="management-audit"){const run=await runDueOrganizationAudit();return run?{status:"completed" as const,summary:`전 프로젝트 감사 ${run.totalItems}개 항목을 수행하고 지적 ${run.findingCount}건을 문서화했습니다.`}:{status:"noop" as const,summary:"최근 30일 내 전사 감사가 완료되어 중복 감사를 생략했습니다."};}
  const [posts,queue,issues,promotions]=await Promise.all([
    d1.prepare("SELECT status,COUNT(*) AS count FROM posts GROUP BY status").all(),
    d1.prepare("SELECT COUNT(*) AS count FROM posting_queue WHERE status='review'").first<{count:number}>(),
    d1.prepare("SELECT COUNT(*) AS count FROM management_issues WHERE status='open'").first<{count:number}>(),
    d1.prepare("SELECT status,COUNT(*) AS count FROM promotion_campaigns GROUP BY status").all(),
  ]);
  const postCounts=new Map(posts.results.map(row=>[String(row.status),Number(row.count)]));
  const promotionCounts=new Map(promotions.results.map(row=>[String(row.status),Number(row.count)]));
  if(action==="planning-scan")return{status:"completed" as const,summary:`초안 ${postCounts.get("draft")??0}건, 검토대기 ${Number(queue?.count??0)}건을 확인하고 다음 기획 후보 점검 기록을 남겼습니다.`};
  if(action==="editorial-review")return{status:"review" as const,summary:`검토대기 ${Number(queue?.count??0)}건과 초안 ${postCounts.get("draft")??0}건을 확인했습니다. 원문 복사 없이 출처 대조·재작성 후 승인받아야 합니다.`};
  if(action==="quality-review")return{status:"review" as const,summary:`공개 ${postCounts.get("published")??0}건, 예약 ${postCounts.get("scheduled")??0}건, 열린 관리문제 ${Number(issues?.count??0)}건의 품질 게이트 검토 대상을 기록했습니다.`};
  return{status:"review" as const,summary:`준비된 홍보안 ${promotionCounts.get("prepared")??0}건을 확인했습니다. 외부 게시 없이 검토용 준비 상태만 기록했습니다.`};
}

async function executeMemberActivity(plan:MemberActivityPlanState){
  const d1=await db();const started=await d1.prepare("INSERT INTO member_activity_runs (plan_id,member_name,team_name,action,status,summary) VALUES (?,?,?,?, 'running','실행 중') RETURNING id").bind(plan.id,plan.memberName,plan.teamName,plan.action).first<{id:number}>();
  if(!started)throw new Error("구성원 실행 이력을 만들지 못했습니다.");
  const definition=memberActivityPlans.find(item=>item.id===plan.id);const next=nextMemberActivityRunAt(definition??plan);
  try{const result=await activitySnapshot(d1,plan.action);await d1.batch([d1.prepare("UPDATE member_activity_runs SET status=?,summary=?,completed_at=CURRENT_TIMESTAMP WHERE id=?").bind(result.status,result.summary,started.id),d1.prepare("UPDATE member_activity_plans SET last_run_at=CURRENT_TIMESTAMP,next_run_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(next,plan.id)]);return{...result,id:started.id};}
  catch(error){const message=error instanceof Error?error.message:"알 수 없는 실행 오류";await d1.batch([d1.prepare("UPDATE member_activity_runs SET status='failed',summary=?,completed_at=CURRENT_TIMESTAMP WHERE id=?").bind(message,started.id),d1.prepare("UPDATE member_activity_plans SET last_run_at=CURRENT_TIMESTAMP,next_run_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(next,plan.id)]);throw error;}
}

export async function getMemberActivityDashboard(){const d1=await db();const [plans,runs]=await Promise.all([d1.prepare("SELECT * FROM member_activity_plans ORDER BY team_name,member_name").all(),d1.prepare("SELECT * FROM member_activity_runs ORDER BY started_at DESC,id DESC LIMIT 100").all()]);return{scheduler:{intervalMinutes:30,timeZone:"Asia/Seoul",automatic:true,safeBoundary:"내부 점검·초안·준비 기록만 자동 실행하며 발행·외부 게시·배포는 승인이 필요합니다."},plans:plans.results.map(row=>mapMemberActivityPlan(row as Record<string,unknown>)),runs:runs.results.map(row=>mapMemberActivityRun(row as Record<string,unknown>))};}
export async function runMemberActivityPlan(id:string){assertTeamPermission("owner","automation.run");const d1=await db();const row=await d1.prepare("SELECT * FROM member_activity_plans WHERE id=?").bind(id).first();if(!row)throw new Error("실행계획을 찾지 못했습니다.");return executeMemberActivity(mapMemberActivityPlan(row as Record<string,unknown>));}
export async function setMemberActivityPlanStatus(id:string,status:"active"|"paused"){assertTeamPermission("owner","automation.manage");const d1=await db();const row=await d1.prepare("UPDATE member_activity_plans SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? RETURNING *").bind(status,id).first();if(!row)throw new Error("실행계획을 찾지 못했습니다.");return mapMemberActivityPlan(row as Record<string,unknown>);}
export async function runDueMemberActivities(){assertTeamPermission("management","automation.run");const d1=await db();const due=await d1.prepare("SELECT * FROM member_activity_plans WHERE status='active' AND next_run_at IS NOT NULL AND next_run_at<=? ORDER BY next_run_at LIMIT 10").bind(new Date().toISOString()).all();let executed=0,failed=0;for(const row of due.results){const plan=mapMemberActivityPlan(row as Record<string,unknown>);const definition=memberActivityPlans.find(item=>item.id===plan.id);const claimed=await d1.prepare("UPDATE member_activity_plans SET next_run_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='active' AND next_run_at=?").bind(nextMemberActivityRunAt(definition??plan),plan.id,plan.nextRunAt).run();if(Number(claimed.meta?.changes??0)===0)continue;try{await executeMemberActivity(plan);executed++;}catch{failed++;}}return{checked:due.results.length,executed,failed};}
const AUTOMATION_CLAIM_SETTING="automation_scheduler_claim";
const AUTOMATION_TICK_SETTING="automation_scheduler_tick";
/** 요청 기반 자동 실행은 이 간격 안에서 한 번만 수행합니다. */
export const AUTOMATION_TICK_INTERVAL_MINUTES=15;
/** 이 시간 동안 실행 기록이 없으면 스케줄러가 멈춘 것으로 봅니다. */
export const AUTOMATION_STALL_MINUTES=90;

export type AutomationTick={source:string;startedAt:string;finishedAt:string;revived:{agents:number;plans:number};content:{checked:number;failed:number}|null;members:{checked:number;executed:number;failed:number}|null;errors:string[]};
export type AutomationTargetStatus={active:number;paused:number;due:number;stalled:number};
export type AutomationSchedulerStatus={intervalMinutes:number;stallMinutes:number;running:boolean;lastTick:AutomationTick|null;lastTickAt:string|null;minutesSinceLastTick:number|null;agents:AutomationTargetStatus;plans:AutomationTargetStatus;lastAgentRunAt:string|null;lastMemberRunAt:string|null};

async function readSetting<T>(d1:D1Database,key:string){const row=await d1.prepare("SELECT value_json FROM site_settings WHERE key=?").bind(key).first<{value_json:string}>();if(!row)return null;try{return JSON.parse(String(row.value_json)) as T;}catch{return null;}}
async function writeSetting(d1:D1Database,key:string,value:unknown){await d1.prepare("INSERT INTO site_settings (key,value_json,updated_at) VALUES (?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=CURRENT_TIMESTAMP").bind(key,JSON.stringify(value)).run();}
function errorMessage(error:unknown){return error instanceof Error?error.message:"알 수 없는 오류";}

/**
 * `next_run_at`이 비어 있는 활성 에이전트·실행계획은 실행 조건(`next_run_at<=now`)에 영원히
 * 걸리지 않습니다. 멈춘 항목을 즉시 실행 대상으로 되돌려 자동화가 조용히 정지하는 것을 막습니다.
 */
export async function reviveStalledAutomation(){
  const d1=await db();
  const now=new Date().toISOString();
  const agents=await d1.prepare("UPDATE content_agents SET next_run_at=?,updated_at=CURRENT_TIMESTAMP WHERE status='active' AND next_run_at IS NULL").bind(now).run();
  const plans=await d1.prepare("UPDATE member_activity_plans SET next_run_at=?,updated_at=CURRENT_TIMESTAMP WHERE status='active' AND next_run_at IS NULL").bind(now).run();
  return {agents:Number(agents.meta?.changes??0),plans:Number(plans.meta?.changes??0)};
}

/**
 * 조직 자동화 1회 실행. 콘텐츠 에이전트와 구성원 실행계획은 서로 독립적으로 처리해
 * 한쪽이 실패해도 나머지가 멈추지 않게 하고, 결과는 항상 운영설정에 기록합니다.
 */
export async function runScheduledOrganizationActivities(source:string="scheduled"):Promise<AutomationTick>{
  const startedAt=new Date().toISOString();
  const errors:string[]=[];
  let revived={agents:0,plans:0};
  try{revived=await reviveStalledAutomation();}catch(error){errors.push(`정지 항목 복구: ${errorMessage(error)}`);}
  let content:{checked:number;failed:number}|null=null;
  try{content=await runDueContentAgents();}catch(error){errors.push(`콘텐츠 에이전트: ${errorMessage(error)}`);}
  let members:{checked:number;executed:number;failed:number}|null=null;
  try{members=await runDueMemberActivities();}catch(error){errors.push(`구성원 실행계획: ${errorMessage(error)}`);}
  const tick:AutomationTick={source,startedAt,finishedAt:new Date().toISOString(),revived,content,members,errors};
  try{await writeSetting(await db(),AUTOMATION_TICK_SETTING,tick);}catch(error){errors.push(`실행 기록 저장: ${errorMessage(error)}`);}
  return tick;
}

/**
 * 마지막 실행이 `minIntervalMinutes`보다 오래됐을 때만 실행합니다. 실행권은 D1의 조건부 갱신으로
 * 한 번에 하나만 잡히므로, 동시에 들어온 요청이 중복 실행하지 않습니다. 실행하지 않으면 null.
 */
export async function runAutomationTickIfDue(source:string="request",minIntervalMinutes:number=AUTOMATION_TICK_INTERVAL_MINUTES){
  const d1=await db();
  const now=new Date();
  const claim=await d1.prepare(`INSERT INTO site_settings (key,value_json,updated_at) VALUES (?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=CURRENT_TIMESTAMP
    WHERE site_settings.value_json<=?`)
    .bind(AUTOMATION_CLAIM_SETTING,JSON.stringify(now.toISOString()),JSON.stringify(new Date(now.getTime()-minIntervalMinutes*60*1000).toISOString())).run();
  if(Number(claim.meta?.changes??0)===0)return null;
  return runScheduledOrganizationActivities(source);
}

async function automationTargetStatus(d1:D1Database,table:"content_agents"|"member_activity_plans",now:string){
  const row=await d1.prepare(`SELECT
    SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active,
    SUM(CASE WHEN status<>'active' THEN 1 ELSE 0 END) AS paused,
    SUM(CASE WHEN status='active' AND next_run_at IS NOT NULL AND next_run_at<=? THEN 1 ELSE 0 END) AS due,
    SUM(CASE WHEN status='active' AND next_run_at IS NULL THEN 1 ELSE 0 END) AS stalled
    FROM ${table}`).bind(now).first<{active:number;paused:number;due:number;stalled:number}>();
  return {active:Number(row?.active??0),paused:Number(row?.paused??0),due:Number(row?.due??0),stalled:Number(row?.stalled??0)} satisfies AutomationTargetStatus;
}

/** 관리자 화면과 점검용 API가 “자동화가 실제로 돌고 있는지”를 확인하는 단일 창구입니다. */
export async function getAutomationSchedulerStatus():Promise<AutomationSchedulerStatus>{
  const d1=await db();
  const now=new Date();
  const nowText=now.toISOString();
  const [lastTick,agents,plans,lastAgentRun,lastMemberRun]=await Promise.all([
    readSetting<AutomationTick>(d1,AUTOMATION_TICK_SETTING),
    automationTargetStatus(d1,"content_agents",nowText),
    automationTargetStatus(d1,"member_activity_plans",nowText),
    d1.prepare("SELECT created_at FROM agent_runs ORDER BY created_at DESC,id DESC LIMIT 1").first<{created_at:string}>(),
    d1.prepare("SELECT started_at FROM member_activity_runs ORDER BY started_at DESC,id DESC LIMIT 1").first<{started_at:string}>(),
  ]);
  const lastTickAt=lastTick?.finishedAt??null;
  const elapsed=lastTickAt?Math.max(0,Math.round((now.getTime()-new Date(lastTickAt).getTime())/60000)):null;
  return {
    intervalMinutes:AUTOMATION_TICK_INTERVAL_MINUTES,
    stallMinutes:AUTOMATION_STALL_MINUTES,
    running:elapsed!==null&&elapsed<=AUTOMATION_STALL_MINUTES,
    lastTick,
    lastTickAt,
    minutesSinceLastTick:elapsed,
    agents,
    plans,
    lastAgentRunAt:lastAgentRun?.created_at?String(lastAgentRun.created_at):null,
    lastMemberRunAt:lastMemberRun?.started_at?String(lastMemberRun.started_at):null,
  };
}

export async function isAdminLoginAllowed(attemptKey:string){const d1=await db();const now=Math.floor(Date.now()/1000);const row=await d1.prepare("SELECT blocked_until FROM admin_login_attempts WHERE attempt_key=?").bind(attemptKey).first<{blocked_until:number}>();return !row||Number(row.blocked_until)<=now;}
export async function recordAdminLoginFailure(attemptKey:string){const d1=await db();const now=Math.floor(Date.now()/1000);const windowStart=now-15*60;await d1.prepare(`INSERT INTO admin_login_attempts (attempt_key,failures,window_started_at,blocked_until) VALUES (?,1,?,0) ON CONFLICT(attempt_key) DO UPDATE SET failures=CASE WHEN window_started_at<? THEN 1 ELSE failures+1 END,window_started_at=CASE WHEN window_started_at<? THEN ? ELSE window_started_at END,blocked_until=CASE WHEN window_started_at>=? AND failures+1>=5 THEN ? ELSE 0 END`).bind(attemptKey,now,windowStart,windowStart,now,windowStart,now+15*60).run();}
export async function clearAdminLoginFailures(attemptKey:string){const d1=await db();await d1.prepare("DELETE FROM admin_login_attempts WHERE attempt_key=?").bind(attemptKey).run();}
