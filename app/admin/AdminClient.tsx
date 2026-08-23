"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Post } from "../../lib/content";
import type { AgentRun, AuditFinding, AuditRun, AutomationSchedulerStatus, ContentAgentState, ManagementIssue, ManagementRun, MemberActivityPlanState, MemberActivityRun, OriginalityCheck, PromotionCampaign, QueueItem } from "../../lib/repository";
import type { AuditDomain, AuditOfficer } from "../../lib/internal-audit";
import type { ManagementMember } from "../../lib/management-department";
import type { OrganizationPolicyRecipient } from "../../lib/organization-policy";
import { getPromotionMember, promotionTeam, searchPrograms } from "../../lib/promotion-team";
import { allEditorialAuthors, EDITOR_IN_CHIEF } from "../../lib/editorial-team";
import { qualityDesignGates, qualityDesignTeam } from "../../lib/quality-design-team";
import type { CompanyResource } from "../../lib/company-rules";
import { contentPlanningFirstMonth, contentPlanningTeam, contentPlanningWorkflow } from "../../lib/content-planning-team";
import { teamPermissions } from "../../lib/team-permissions";
import { safeReleasePolicy } from "../../lib/release-policy";
import RichTextEditor from "./RichTextEditor";

const categories = ["퇴직 준비", "정부지원·실업급여", "정부지원·세무", "재취업·N잡", "블로그·애드센스", "AI 활용", "온라인 부업", "투자·재테크", "실제 수익실험", "유용한 도구", "지역 생활정보", "건강·예방", "영상 큐레이션"];

function datetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function AdminClient({ username }: { username: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [scheduler,setScheduler]=useState<AutomationSchedulerStatus|null>(null);
  const [agents,setAgents]=useState<ContentAgentState[]>([]);
  const [agentRuns,setAgentRuns]=useState<AgentRun[]>([]);
  const [promotions,setPromotions]=useState<PromotionCampaign[]>([]);
  const [managementMembers,setManagementMembers]=useState<ManagementMember[]>([]);
  const [managementIssues,setManagementIssues]=useState<ManagementIssue[]>([]);
  const [managementRuns,setManagementRuns]=useState<ManagementRun[]>([]);
  const [organizationNotice,setOrganizationNotice]=useState<{title:string;issuedBy:string;effectiveDate:string;message:string;rules:readonly string[]}|null>(null);
  const [policyCoverage,setPolicyCoverage]=useState<{total:number;applied:number;departments:Array<{department:string;count:number}>}>({total:0,applied:0,departments:[]});
  const [policyRecipients,setPolicyRecipients]=useState<OrganizationPolicyRecipient[]>([]);
  const [originalityChecks,setOriginalityChecks]=useState<OriginalityCheck[]>([]);
  const [companyRules,setCompanyRules]=useState<{title:string;version:string;effectiveAt:string;authority:string;vision:string;mission:string;purpose:string;strategicObjectives:readonly {id:string;title:string;description:string;kpis:readonly string[]}[];coreRules:readonly string[];chapters:readonly {number:number;title:string;articles:readonly string[]}[]}|null>(null);
  const [companyResources,setCompanyResources]=useState<CompanyResource[]>([]);
  const [auditScope,setAuditScope]=useState("");
  const [auditOfficers,setAuditOfficers]=useState<AuditOfficer[]>([]);
  const [auditDomains,setAuditDomains]=useState<AuditDomain[]>([]);
  const [auditRuns,setAuditRuns]=useState<AuditRun[]>([]);
  const [auditFindings,setAuditFindings]=useState<AuditFinding[]>([]);
  const [activityPlans,setActivityPlans]=useState<MemberActivityPlanState[]>([]);
  const [activityRuns,setActivityRuns]=useState<MemberActivityRun[]>([]);
  const [selected, setSelected] = useState<Post | null>(null);
  const [message, setMessage] = useState("편집실을 준비하고 있습니다…");
  const [saving, setSaving] = useState(false);
  const editorPanelRef = useRef<HTMLElement>(null);

  async function load() {
    const [postsResponse, queueResponse, agentsResponse, promotionsResponse, managementResponse,auditResponse,activityResponse] = await Promise.all([fetch("/api/posts"), fetch("/api/automation"),fetch("/api/agents"),fetch("/api/promotions"),fetch("/api/management"),fetch("/api/audits"),fetch("/api/activity-plans")]);
    const postsData = await postsResponse.json();
    const queueData = await queueResponse.json();
    const agentsData=await agentsResponse.json();
    const promotionsData=await promotionsResponse.json();
    const managementData=await managementResponse.json();
    const auditData=await auditResponse.json();
    const activityData=await activityResponse.json();
    if (postsResponse.ok && queueResponse.ok && agentsResponse.ok && promotionsResponse.ok && managementResponse.ok&&auditResponse.ok&&activityResponse.ok) {
      setPosts(postsData.posts);
      setQueue(queueData.queue);
      setScheduler(queueData.scheduler??null);
      setAgents(agentsData.agents);
      setAgentRuns(agentsData.runs);
      setPromotions(promotionsData.campaigns);
      setManagementMembers(managementData.members);
      setManagementIssues(managementData.issues);
      setManagementRuns(managementData.runs);
      setOrganizationNotice(managementData.notice);
      setPolicyCoverage(managementData.policyCoverage);
      setPolicyRecipients(managementData.policyRecipients);
      setOriginalityChecks(managementData.originalityChecks);
      setCompanyRules(managementData.companyRules);
      setCompanyResources(managementData.companyResources);
      setAuditScope(auditData.scope);setAuditOfficers(auditData.officers);setAuditDomains(auditData.domains);setAuditRuns(auditData.runs);setAuditFindings(auditData.findings);
      setActivityPlans(activityData.plans);setActivityRuns(activityData.runs);
      const requestedPostId = Number(new URLSearchParams(window.location.search).get("post"));
      const requestedPost = postsData.posts.find((post: Post) => post.id === requestedPostId);
      if (requestedPost) {
        setSelected(requestedPost);
        setMessage(`‘${requestedPost.title}’ 글을 편집기로 열었습니다.`);
      } else {
        setMessage("");
      }
    } else {
      setMessage(postsData.error || queueData.error || agentsData.error || promotionsData.error || managementData.error||auditData.error||activityData.error || "편집실 자료를 불러오지 못했습니다.");
    }
  }

  useEffect(() => { const frame=requestAnimationFrame(()=>void load());return()=>cancelAnimationFrame(frame); }, []);

  function openEditor(post: Post) {
    setSelected(post);
    setMessage(`‘${post.title}’ 글을 편집기로 열었습니다.`);
    window.history.replaceState(null, "", `/admin?post=${post.id}#article-editor`);
    requestAnimationFrame(() => {
      editorPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function startNewPost() {
    setSelected(null);
    window.history.replaceState(null, "", "/admin#article-editor");
    requestAnimationFrame(() => {
      editorPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    const payload = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    if (payload.scheduledAt) payload.scheduledAt = new Date(payload.scheduledAt).toISOString();
    const response = await fetch(selected ? `/api/posts/${selected.id}` : "/api/posts", {
      method: selected ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setSaving(false);
    if (response.ok) {
      setMessage(`‘${data.post.title}’ 글을 저장했습니다.`);
      setSelected(null);
      form.reset();
      await load();
    } else setMessage(data.error);
  }

  async function createQueueDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    if (payload.scheduledAt) payload.scheduledAt = new Date(payload.scheduledAt).toISOString();
    setSaving(true);
    const response = await fetch("/api/automation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    setSaving(false);
    if (response.ok) {
      setMessage(`‘${data.post.title}’ 검토용 초안을 만들었습니다.`);
      form.reset();
      await load();
    } else setMessage(data.error);
  }

  async function runScheduler(){
    setSaving(true);
    const response=await fetch("/api/automation",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"run-scheduler"})});
    const data=await response.json();
    setSaving(false);
    if(!response.ok){setMessage(data.error||"자동화를 실행하지 못했습니다.");return;}
    const tick=data.tick as {revived:{agents:number;plans:number};content:{checked:number;failed:number}|null;members:{checked:number;executed:number;failed:number}|null;errors:string[]};
    setMessage(tick.errors.length>0
      ?`자동화를 실행했지만 일부 작업이 실패했습니다: ${tick.errors.join(" / ")}`
      :`자동화를 실행했습니다. 에이전트 ${tick.content?.checked??0}건, 구성원 실행 ${tick.members?.executed??0}건, 멈춰 있던 항목 ${tick.revived.agents+tick.revived.plans}건을 다시 가동했습니다.`);
    await load();
  }

  async function controlAgent(id:string,action:"run"|"status",status?:"active"|"paused"){
    setSaving(true);const response=await fetch("/api/agents",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id,action,status})});const data=await response.json();setSaving(false);if(response.ok){setMessage(action==="run"?`‘${data.post.title}’ 초안을 만들고 정책 검토 대기에 등록했습니다.`:`에이전트를 ${status==="active"?"가동":"일시정지"}했습니다.`);await load();}else setMessage(data.error);
  }

  async function controlActivity(id:string,action:"run"|"status",status?:"active"|"paused"){
    setSaving(true);const response=await fetch("/api/activity-plans",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id,action,status})});const data=await response.json();setSaving(false);if(response.ok){setMessage(action==="run"?"구성원 업무를 실행하고 결과를 기록했습니다.":`구성원 계획을 ${status==="active"?"가동":"일시정지"}했습니다.`);await load();}else setMessage(data.error);
  }

  async function manageSite(action:"audit"|"resolve",id?:number){setSaving(true);const response=await fetch("/api/management",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,id})});const data=await response.json();setSaving(false);if(response.ok){setMessage(action==="audit"?`전사 점검을 마쳤습니다. 문제 ${data.run.issueCount}건, 즉시 조치 ${data.run.actionCount}건입니다.`:"문제를 조치 완료로 표시했습니다.");await load();}else setMessage(data.error);}

  async function auditOrganization(action:"run"|"resolve",id?:number){const resolution=action==="resolve"?window.prompt("완료한 시정조치와 확인 증거를 입력하세요.","")??"":"";if(action==="resolve"&&!resolution.trim())return;setSaving(true);const response=await fetch("/api/audits",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,id,resolution})});const data=await response.json();setSaving(false);if(response.ok){setMessage(action==="run"?`전 프로젝트 감사를 마쳤습니다. 감사의견 ‘${data.run.overallOpinion}’, 지적 ${data.run.findingCount}건입니다.`:"시정조치와 완료 증거를 감사 이력에 기록했습니다.");await load();}else setMessage(data.error);}

  async function preparePromotion(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const postId=Number(new FormData(event.currentTarget).get("promotionPostId"));setSaving(true);const response=await fetch("/api/promotions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"prepare",postId})});const data=await response.json();setSaving(false);if(response.ok){setMessage(`‘${data.campaign.title}’ 홍보안을 준비했습니다.`);await load();}else setMessage(data.error);
  }

  async function finishPromotion(id:number){
    setSaving(true);const response=await fetch("/api/promotions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"execute",id})});const data=await response.json();setSaving(false);if(response.ok){setMessage(`‘${data.campaign.title}’ 홍보 실행을 기록했습니다.`);await load();}else setMessage(data.error);
  }

  async function copyPromotion(text:string,label:string){try{await navigator.clipboard.writeText(text);setMessage(`${label}을 복사했습니다. 원하는 채널에 붙여넣어 확인한 뒤 게시하세요.`);}catch{setMessage("복사하지 못했습니다. 문구를 직접 선택해 복사하세요.");}}

  async function logout(){await fetch("/api/admin/session",{method:"DELETE"});window.location.href="/admin/login";}

  const count = (status: string) => posts.filter((post) => post.status === status).length;

  return (
    <main className="admin-shell">
      <header className="admin-top">
        <div><strong>퇴.기.사 · 편집실</strong><span>{username} · 독립 관리자</span></div>
        <div className="admin-actions"><a className="admin-button secondary" href="/api/export">전체 백업</a><Link className="admin-button secondary" href="/">사이트 보기</Link><button className="admin-button secondary" type="button" onClick={logout}>로그아웃</button></div>
      </header>

      <div className="admin-dashboard">
        <section>
          <div className="admin-stats"><div className="stat"><span>발행 글</span><strong>{count("published")}</strong></div><div className="stat"><span>초안</span><strong>{count("draft")}</strong></div><div className="stat"><span>예약</span><strong>{count("scheduled")}</strong></div></div>
          <div className="panel">
            <div className="panel-title"><div><p className="eyebrow">CONTENT LIBRARY</p><h2>콘텐츠 보관함</h2></div><button className="admin-button secondary" type="button" onClick={startNewPost}>새 글</button></div>
            {message && <p className="admin-message" role="status">{message}</p>}
            <div className="admin-list">{posts.map((post) => <button type="button" className={`admin-item ${selected?.id === post.id ? "selected" : ""}`} onClick={() => openEditor(post)} aria-label={`${post.title} 글 편집하기`} aria-pressed={selected?.id === post.id} key={post.id}><span className={`status status-${post.status}`}>{post.status === "published" ? "발행" : post.status === "scheduled" ? "예약" : "초안"}</span><p>{post.title}</p><span>{post.category} · {post.publishedAt || (post.scheduledAt ? new Date(post.scheduledAt).toLocaleString("ko-KR") : "날짜 미정")}</span></button>)}</div>
          </div>
        </section>

        <section className="panel editor-panel" id="article-editor" ref={editorPanelRef}>
          <div className="panel-title"><div><p className="eyebrow">{selected ? "EDIT ARTICLE" : "NEW ARTICLE"}</p><h2>{selected ? `글 수정 · ${selected.title}` : "새 글 작성"}</h2></div>{selected && <button className="admin-button secondary" type="button" onClick={() => setSelected(null)}>취소</button>}</div>
          <form key={selected?.id ?? "new"} onSubmit={savePost}>
            <div className="field"><label htmlFor="title">제목</label><input id="title" name="title" required defaultValue={selected?.title} placeholder="독자가 찾을 구체적인 제목" /></div>
            <div className="field"><label htmlFor="excerpt">한 줄 요약</label><input id="excerpt" name="excerpt" defaultValue={selected?.excerpt} placeholder="검색 결과에 보일 120자 안팎의 설명" /></div>
            <div className="form-row"><div className="field"><label htmlFor="category">카테고리</label><select id="category" name="category" defaultValue={selected?.category}>{categories.map((category) => <option key={category}>{category}</option>)}</select></div><div className="field"><label htmlFor="visual">표지 표시</label><input id="visual" name="visual" maxLength={6} defaultValue={selected?.visual} placeholder="예: 30D" /></div></div>
            <div className="field"><label htmlFor="authorName">글 작성자</label><select id="authorName" name="authorName" defaultValue={selected?.authorName || EDITOR_IN_CHIEF.name}>{allEditorialAuthors.map(author=><option value={author.name} key={author.id}>{author.name} · {author.role}</option>)}</select><small>선택한 이름이 글 상단과 검색엔진용 작성자 정보에 함께 표시됩니다.</small></div>
            <div className="field"><label htmlFor="tags">태그</label><input id="tags" name="tags" defaultValue={selected?.tags.join(", ")} placeholder="쉼표로 구분: 퇴직, 생활비" /></div>
            <div className="field"><label htmlFor="sourceUrl">공식자료 주소 <span>(선택)</span></label><input id="sourceUrl" name="sourceUrl" type="url" placeholder="https://www.work24.go.kr/..." /><small>입력하면 본문 끝에 출처 링크가 추가되고 공개 글의 공식자료 영역에 자동 표시됩니다.</small></div>
            <div className="field"><div className="field-label" id="body-editor-label">본문 편집기</div><RichTextEditor initialValue={selected?.body}/></div>
            <div className="form-row"><div className="field"><label htmlFor="status">저장 상태</label><select id="status" name="status" defaultValue={selected?.status || "draft"}><option value="draft">초안</option><option value="scheduled">예약</option><option value="published">바로 발행</option></select></div><div className="field"><label htmlFor="scheduledAt">예약 일시</label><input id="scheduledAt" name="scheduledAt" type="datetime-local" defaultValue={datetimeLocal(selected?.scheduledAt ?? null)} /></div></div>
            <input type="hidden" name="publishedAt" value={selected?.publishedAt || ""} />
            <button className="admin-button" disabled={saving}>{saving ? "저장 중…" : selected ? "변경사항 저장" : "글 저장"}</button>
          </form>
        </section>

        <section className="panel automation-panel">
          <div className="panel-title"><div><p className="eyebrow">REVIEW QUEUE</p><h2>자동 포스팅 준비</h2></div><span className="queue-count">검토 {queue.filter((item) => item.status === "review").length}</span></div>
          <section className={`scheduler-status ${scheduler?scheduler.running?"running":"stopped":"unknown"}`} aria-label="자동화 스케줄러 상태">
            <header>
              <div><span>{scheduler?scheduler.running?"자동화 가동 중":"자동화 정지 감지":"상태 확인 중"}</span><strong>{scheduler?.lastTickAt?`최근 실행 ${new Date(scheduler.lastTickAt).toLocaleString("ko-KR")}`:"아직 실행 기록이 없습니다."}</strong></div>
              <button className="admin-button" type="button" disabled={saving} onClick={()=>void runScheduler()}>지금 자동화 실행</button>
            </header>
            {scheduler&&<dl>
              <div><dt>에이전트</dt><dd>가동 {scheduler.agents.active} · 실행대기 {scheduler.agents.due}{scheduler.agents.stalled>0?` · 멈춤 ${scheduler.agents.stalled}`:""}</dd></div>
              <div><dt>구성원 실행계획</dt><dd>가동 {scheduler.plans.active} · 실행대기 {scheduler.plans.due}{scheduler.plans.stalled>0?` · 멈춤 ${scheduler.plans.stalled}`:""}</dd></div>
              <div><dt>점검 주기</dt><dd>{scheduler.intervalMinutes}분마다 자동 확인</dd></div>
            </dl>}
            {scheduler&&scheduler.lastTick&&scheduler.lastTick.errors.length>0&&<p className="scheduler-error">직전 실행 오류: {scheduler.lastTick.errors.join(" / ")}</p>}
            {scheduler&&!scheduler.running&&<p className="scheduler-help">{scheduler.stallMinutes}분 넘게 자동 실행 기록이 없습니다. 위 버튼으로 즉시 실행하고, 외부 스케줄러가 <code>/api/cron</code>을 주기적으로 호출하는지 확인하세요.</p>}
          </section>
          <p className="panel-help">공식 자료 주소와 주제를 넣으면 검토 체크리스트가 포함된 초안을 만듭니다. 공개 글에는 전용 썸네일, 핵심 흐름 다이어그램, 확인표, 공식자료와 위키백과 용어 링크가 자동 구성됩니다. 초안을 확인해 예약 상태로 바꾸면 지정 시각 이후 자동으로 공개됩니다.</p>
          <form className="queue-form" onSubmit={createQueueDraft}>
            <div className="field"><label htmlFor="topic">글 주제</label><input id="topic" name="topic" required placeholder="예: 2026년 실업크레딧 신청 방법" /></div>
            <div className="field"><label htmlFor="sourceUrl">공식 자료 주소</label><input id="sourceUrl" name="sourceUrl" required type="url" placeholder="https://www.work24.go.kr/..." /></div>
            <div className="form-row"><div className="field"><label htmlFor="queueCategory">카테고리</label><select id="queueCategory" name="category">{categories.map((category) => <option key={category}>{category}</option>)}</select></div><div className="field"><label htmlFor="queueTime">희망 발행 시각</label><input id="queueTime" name="scheduledAt" type="datetime-local" /></div></div>
            <button className="admin-button" disabled={saving}>검토용 초안 만들기</button>
          </form>
          <div className="queue-list">{queue.map((item) => <button type="button" key={item.id} onClick={() => { const post = posts.find((candidate) => candidate.id === item.postId); if (post) openEditor(post); }}><span>{item.status === "review" ? "검토 필요" : item.status}</span><strong>{item.title}</strong><small>{item.sourceUrl}</small></button>)}</div>
        </section>

        <section className="panel member-activity-panel">
          <div className="panel-title"><div><p className="eyebrow">ORGANIZATION SCHEDULER</p><h2>전 구성원 자동 실행계획</h2></div><span className="queue-count">가동 {activityPlans.filter(plan=>plan.status==="active").length}/{activityPlans.length}</span></div>
          <p className="panel-help">기존 30분 주기 스케줄러가 각 구성원의 시간 단위·일 단위 계획 중 실행 시각이 된 업무를 처리합니다. 내부 점검·초안·준비 기록만 자동화하며 발행, 외부 게시와 운영 배포는 승인 후 실행합니다.</p>
          <div className="activity-summary"><article><span>시간 단위</span><strong>{activityPlans.filter(plan=>plan.frequency==="hourly").length}명</strong></article><article><span>일 단위</span><strong>{activityPlans.filter(plan=>plan.frequency==="daily").length}명</strong></article><article><span>검토 필요</span><strong>{activityRuns.filter(run=>run.status==="review").length}건</strong></article><article><span>최근 실패</span><strong>{activityRuns.filter(run=>run.status==="failed").length}건</strong></article></div>
          <div className="activity-team-list">{Array.from(new Set(activityPlans.map(plan=>plan.teamName))).map(teamName=><details key={teamName} open={teamName==="경영관리팀"}><summary><strong>{teamName}</strong><span>{activityPlans.filter(plan=>plan.teamName===teamName).length}명</span></summary><div>{activityPlans.filter(plan=>plan.teamName===teamName).map(plan=><article className={plan.status} key={plan.id}><header><div><span>{plan.memberName}</span><strong>{plan.role}</strong></div><small>{plan.frequency==="hourly"?`${plan.intervalHours}시간마다`:`매일 ${String(plan.dailyHourKst).padStart(2,"0")}:${String(plan.minuteOffset).padStart(2,"0")} KST`}</small></header><h3>{plan.taskTitle}</h3><p>{plan.instruction}</p><dl><div><dt>다음 실행</dt><dd>{plan.nextRunAt?new Date(plan.nextRunAt).toLocaleString("ko-KR"):"미정"}</dd></div><div><dt>자동 산출물</dt><dd>{plan.safeOutput}</dd></div></dl>{plan.requiresApproval&&<p className="activity-approval">승인 필요 · 공개 및 외부 실행은 자동 처리하지 않음</p>}<footer><button type="button" disabled={saving||plan.status!=="active"} onClick={()=>controlActivity(plan.id,"run")}>지금 실행</button><button type="button" disabled={saving} onClick={()=>controlActivity(plan.id,"status",plan.status==="active"?"paused":"active")}>{plan.status==="active"?"일시정지":"다시 가동"}</button></footer></article>)}</div></details>)}</div>
          <div className="activity-run-log"><h3>최근 자동 실행 기록</h3>{activityRuns.length===0?<p className="management-empty">첫 실행 시각이 되면 결과와 실패 이력이 여기에 기록됩니다.</p>:activityRuns.slice(0,20).map(run=><article className={run.status} key={run.id}><span>{run.status==="completed"?"완료":run.status==="review"?"검토 필요":run.status==="noop"?"중복 생략":"실패"}</span><strong>{run.memberName} · {run.teamName}</strong><p>{run.summary}</p><time>{new Date(run.startedAt).toLocaleString("ko-KR")}</time></article>)}</div>
        </section>

        <section className="panel release-governance-panel">
          <div className="panel-title"><div><p className="eyebrow">SAFE RELEASE & ACCESS</p><h2>팀별 권한·무중단 배포</h2></div><span className="queue-count">운영 배포 {safeReleasePolicy.productionAuthority} 전용</span></div>
          <p className="panel-help">콘텐츠 업데이트는 운영 중인 사이트를 멈추지 않고 데이터에 반영합니다. 디자인·기능 변경은 새 버전에서 빌드와 자동 테스트를 마친 뒤 경영관리팀 승인과 대표의 최종 배포를 거쳐 한 번에 교체합니다.</p>
          <div className="release-safety-summary"><article><span>배포 방식</span><strong>버전 분리·일괄 교체</strong><p>검증 중에는 현재 정상 사이트를 그대로 제공합니다.</p></article><article><span>승인</span><strong>{safeReleasePolicy.approvalAuthority}</strong><p>정책·품질·보안 게이트를 확인합니다.</p></article><article><span>복구</span><strong>직전 정상 버전 유지</strong><p>{safeReleasePolicy.rollback}</p></article></div>
          <div className="team-permission-grid">{teamPermissions.map(team=><article key={team.id}><header><span>{team.name}</span><strong>{team.capabilities.length}개 권한</strong></header><p>{team.responsibility}</p><div>{team.capabilities.map(capability=><code key={capability}>{capability}</code>)}</div><ul>{team.restrictions.map(rule=><li key={rule}>{rule}</li>)}</ul></article>)}</div>
          <div className="release-gate-list"><h3>운영 교체 필수 게이트</h3><ol>{safeReleasePolicy.gates.map((gate,index)=><li key={gate}><span>{String(index+1).padStart(2,"0")}</span>{gate}</li>)}</ol></div>
        </section>

        <section className="panel management-department-panel">
          <div className="panel-title"><div><p className="eyebrow">SITE MANAGEMENT</p><h2>사이트 경영관리팀 상황실</h2></div><button className="admin-button" type="button" disabled={saving} onClick={()=>manageSite("audit")}>지금 전체 점검</button></div>
          <p className="panel-help">3명의 관리 담당자가 발행정책, 자동화 흐름, 사이트 품질을 점검합니다. 심각한 예약 발행 위반은 즉시 중지하고, 공식 출처가 없는 에이전트는 자동으로 일시정지합니다. 모든 발견과 조치는 기록으로 남습니다.</p>
          {companyRules&&<section className="company-rules-card"><header><div><span>전사 사규 · 시행 중</span><h3>{companyRules.title} v{companyRules.version}</h3><p>{companyRules.purpose}</p></div><strong>{companyRules.effectiveAt}<small>시행</small></strong></header><section className="company-direction"><span>VISION</span><h4>{companyRules.vision}</h4><p>{companyRules.mission}</p></section><div className="company-rules-metrics"><span>적용 직원 <b>{policyCoverage.applied}명</b></span><span>관리 리소스 <b>{companyResources.length}종</b></span><span>경영목표 <b>{companyRules.strategicObjectives.length}개</b></span></div><details><summary>MVP 6대 경영목표 보기</summary><div className="company-objectives">{companyRules.strategicObjectives.map(objective=><article key={objective.id}><h4>{objective.title}</h4><p>{objective.description}</p><ul>{objective.kpis.map(kpi=><li key={kpi}>{kpi}</li>)}</ul></article>)}</div></details><details><summary>사규 전체 조항 보기</summary><div className="company-rule-chapters">{companyRules.chapters.map(chapter=><article key={chapter.number}><h4>제{chapter.number}장 {chapter.title}</h4><ol>{chapter.articles.map(article=><li key={article}>{article}</li>)}</ol></article>)}</div></details><details><summary>리소스 책임자 보기</summary><div className="company-resource-list">{companyResources.map(resource=><article key={resource.id}><div><span>{resource.category}</span><strong>{resource.name}</strong></div><dl><div><dt>소유팀</dt><dd>{resource.owner}</dd></div><div><dt>실무관리</dt><dd>{resource.custodian}</dd></div></dl><p>{resource.control}</p></article>)}</div></details><footer>{companyRules.authority} · 사규 버전은 운영설정에 기록되어 전 팀이 동일 기준을 사용합니다.</footer></section>}
          {organizationNotice&&<section className="organization-notice" aria-labelledby="organization-notice-title"><header><div><span>전사 공지 · {organizationNotice.effectiveDate}</span><h3 id="organization-notice-title">{organizationNotice.title}</h3><p>{organizationNotice.message}</p></div><strong>전사 적용 {policyCoverage.applied}/{policyCoverage.total}명</strong></header><ol>{organizationNotice.rules.map(rule=><li key={rule}>{rule}</li>)}</ol><div className="policy-departments">{policyCoverage.departments.map(item=><span key={item.department}>{item.department} {item.count}명</span>)}</div><details><summary>적용 구성원 전체 보기</summary><div className="policy-recipient-list">{policyRecipients.map(member=><span key={member.id}><b>{member.name}</b>{member.title}</span>)}</div></details><footer>{organizationNotice.issuedBy} 공지 · 중앙 발행검사와 경영관리팀 점검으로 의무 적용</footer></section>}
          <section className="originality-monitor"><header><div><p className="eyebrow">ORIGINALITY MONITOR</p><h3>원문 복사 자동감시</h3></div><strong>최근 차단 {originalityChecks.filter(check=>check.status==="blocked").length}건</strong></header><p>편집자가 글을 발행하거나 예약할 때 연결된 원문과 기존 게시물을 자동 대조합니다. 동일 문장이 과도하면 발행을 중지하고 자신의 설명·사례·표로 재작성하도록 즉시 요청합니다.</p><div>{originalityChecks.length===0?<span className="originality-empty">아직 검사 기록이 없습니다. 다음 발행·예약 시 자동으로 검사합니다.</span>:originalityChecks.slice(0,8).map(check=><article className={check.status} key={check.id}><span>{check.status==="passed"?"통과":check.status==="blocked"?"발행 차단":"직접 확인 필요"}</span><strong>{check.editorName} · {check.title}</strong><small>문장 중복 {Math.round(check.overlapRatio*100)}% · 최장 일치 {check.longestMatchChars}자</small><p>{check.message}</p></article>)}</div></section>
          <div className="management-summary"><div><span>열린 문제</span><strong>{managementIssues.filter(issue=>issue.status==="open").length}</strong></div><div><span>긴급</span><strong>{managementIssues.filter(issue=>issue.status==="open"&&issue.severity==="critical").length}</strong></div><div><span>최근 점검</span><strong>{managementRuns[0]?new Date(managementRuns[0].createdAt).toLocaleString("ko-KR"):"대기 중"}</strong></div></div>
          <div className="management-team-grid">{managementMembers.map(member=><article key={member.id}><span>{member.role}</span><h3>{member.name}</h3><p>{member.mission}</p></article>)}</div>
          <div className="management-issue-list"><h3>문제 보고 및 조치 내역</h3>{managementIssues.length===0?<p className="management-empty">아직 발견된 문제가 없습니다. ‘지금 전체 점검’을 실행하세요.</p>:managementIssues.map(issue=><article className={`${issue.status} ${issue.severity}`} key={issue.id}><header><div><span>{issue.status==="resolved"?"조치 완료":issue.severity==="critical"?"긴급 보고":"확인 필요"}</span><strong>{issue.title}</strong></div><small>{issue.auditorName} · {issue.scope}</small></header><p>{issue.details}</p>{issue.actionTaken&&<p className="management-action">즉시 조치: {issue.actionTaken}</p>}<footer>{issue.postId?<button type="button" onClick={()=>{const post=posts.find(item=>item.id===issue.postId);if(post)openEditor(post);}}>해당 글 열기</button>:<span/>}{issue.status==="open"&&<button type="button" disabled={saving} onClick={()=>manageSite("resolve",issue.id)}>조치 완료 표시</button>}</footer></article>)}</div>
        </section>

        <section className="panel internal-audit-panel">
          <div className="panel-title"><div><p className="eyebrow">INTERNAL AUDIT</p><h2>전사 감사실</h2></div><button className="admin-button" type="button" disabled={saving} onClick={()=>auditOrganization("run")}>전 프로젝트 감사 실행</button></div>
          <p className="panel-help">{auditScope||"퇴.기.사 전 프로젝트 업무"}를 대상으로 사규·인사·리소스·콘텐츠·품질·홍보·보안·데이터·자동화·배포 증거를 점검합니다. 지적사항에는 담당자와 완료기한을 지정하고 재점검 결과까지 보존합니다.</p>
          <div className="audit-summary"><div><span>최근 감사의견</span><strong>{auditRuns[0]?.overallOpinion??"감사 대기"}</strong></div><div><span>통과 항목</span><strong>{auditRuns[0]?`${auditRuns[0].passedItems}/${auditRuns[0].totalItems}`:"-"}</strong></div><div><span>열린 지적사항</span><strong>{auditFindings.filter(item=>item.status==="open").length}</strong></div></div>
          <div className="audit-officers">{auditOfficers.map(officer=><article key={officer.id}><span>{officer.title}</span><h3>{officer.name}</h3><p>{officer.responsibility}</p></article>)}</div>
          <details className="audit-domains"><summary>감사영역 {auditDomains.length}개와 증거기준 보기</summary><div>{auditDomains.map(domain=><article key={domain.id}><span>{domain.owner} 담당</span><h4>{domain.name}</h4><p>{domain.standard}</p><small>{domain.evidence.join(" · ")}</small></article>)}</div></details>
          <div className="audit-findings"><h3>감사조서 · 시정조치</h3>{auditFindings.length===0?<p className="management-empty">아직 감사 이력이 없습니다. ‘전 프로젝트 감사 실행’을 눌러 최초 감사를 시작하세요.</p>:auditFindings.slice(0,24).map(finding=><article className={`${finding.status} ${finding.severity}`} key={finding.id}><header><div><span>{finding.status==="compliant"?"적정":finding.status==="resolved"?"조치 완료":finding.severity==="critical"?"긴급":"시정 필요"}</span><strong>{finding.title}</strong></div><small>{auditDomains.find(domain=>domain.id===finding.domain)?.name??finding.domain}</small></header><p>{finding.details}</p><footer><span>담당 {finding.actionOwner}{finding.dueAt?` · ${new Date(finding.dueAt).toLocaleDateString("ko-KR")}까지`:""}</span>{finding.status==="open"&&<button type="button" disabled={saving} onClick={()=>auditOrganization("resolve",finding.id)}>시정조치 기록</button>}</footer>{finding.resolution&&<p className="management-action">완료 증거: {finding.resolution}</p>}</article>)}</div>
        </section>

        <section className="panel automation-panel agent-control-panel">
          <div className="panel-title"><div><p className="eyebrow">CONTENT AGENTS</p><h2>분야별 에이전트 운영실</h2></div><span className="queue-count">가동 {agents.filter(agent=>agent.status==="active").length}/{agents.length}</span></div>
          <p className="panel-help">각 에이전트는 정해진 공식 출처와 주제를 사용해 16시간마다 초안을 준비합니다. 모든 초안은 경영관리팀의 정책 검토 대기에 들어가며, 사람이 확인해 예약 또는 발행 상태로 바꾼 글만 공개됩니다. 품질 기준에 미달하면 실패 기록으로 남깁니다.</p>
          <div className="agent-grid">{agents.map(agent=><article className={`agent-card ${agent.status}`} key={agent.id}><div><span>{agent.status==="active"?"가동 중":"일시정지"}</span><small>{agent.category}</small></div><h3>{agent.name}</h3><p>{agent.mission}</p><dl><div><dt>초안 생성 주기</dt><dd>{agent.cadenceHours<24?`${agent.cadenceHours}시간`:`${Math.round(agent.cadenceHours/24)}일`}</dd></div><div><dt>다음 실행</dt><dd>{agent.nextRunAt?new Date(agent.nextRunAt).toLocaleString("ko-KR"):"미정"}</dd></div><div><dt>공식 출처</dt><dd>{agent.sources.length}곳</dd></div></dl><div className="agent-actions"><button type="button" disabled={saving||agent.status!=="active"} onClick={()=>controlAgent(agent.id,"run")}>지금 초안 만들기</button><button type="button" disabled={saving} onClick={()=>controlAgent(agent.id,"status",agent.status==="active"?"paused":"active")}>{agent.status==="active"?"일시정지":"다시 가동"}</button></div></article>)}</div>
          <div className="agent-run-log"><h3>최근 작업 기록</h3>{agentRuns.length===0?<p>아직 실행 기록이 없습니다.</p>:agentRuns.map(run=><div key={run.id}><span>{run.status==="review"?"검토 대기":run.status==="published"?"자동 발행":"실패"}</span><strong>{run.agentName}</strong><p>{run.topic}</p><time>{new Date(run.createdAt).toLocaleString("ko-KR")}</time></div>)}</div>
        </section>

        <section className="panel promotion-department-panel">
          <div className="panel-title"><div><p className="eyebrow">CONTENT PLANNING TEAM</p><h2>콘텐츠기획팀 운영실</h2></div><span className="queue-count">AI 실무자 {contentPlanningTeam.length}명</span></div>
          <p className="panel-help">독자 질문을 주제 포트폴리오와 제작 브리프로 바꿔 콘텐츠편집팀에 인계합니다. 기획팀은 무엇을 왜 만들지 책임지고, 집필·사실검증·발행 권한은 각각 콘텐츠편집팀과 경영관리팀에 둡니다.</p>
          <div className="promotion-team-grid">{contentPlanningTeam.map(member=><article className="promotion-member-card" key={member.id}><div><span>{member.name}</span><small>AI 실무자</small></div><h3>{member.title}</h3><p>{member.mission}</p><strong>전담: {member.owns.join(" · ")}</strong><ul>{member.kpis.map(kpi=><li key={kpi}>{kpi}</li>)}</ul></article>)}</div>
          <div className="search-programs"><h3>기획 → 학습 운영 흐름</h3><article><ol>{contentPlanningWorkflow.map(item=><li key={item}>{item}</li>)}</ol></article><h3>출범 후 첫 30일</h3><article><ol>{contentPlanningFirstMonth.map(item=><li key={item}>{item}</li>)}</ol></article></div>
        </section>

        <section className="panel promotion-department-panel">
          <div className="panel-title"><div><p className="eyebrow">QUALITY DESIGN TEAM</p><h2>품질디자인팀 운영실</h2></div><span className="queue-count">AI 실무자 {qualityDesignTeam.length}명</span></div>
          <p className="panel-help">콘텐츠편집팀이 만든 글을 디자인, 가독성, 시각자료, 모바일·접근성, 발행 정보까지 하나의 완성품으로 검수합니다. 기준 미달 작업은 보완 대기로 돌리고, 최종 공개는 경영관리팀 승인 뒤에만 진행합니다.</p>
          <div className="promotion-team-grid">{qualityDesignTeam.map(member=><article className="promotion-member-card" key={member.id}><div><span>{member.name}</span><small>AI 실무자</small></div><h3>{member.title}</h3><p>{member.mission}</p><strong>전담: {member.owns.join(" · ")}</strong><ul>{member.kpis.map(kpi=><li key={kpi}>{kpi}</li>)}</ul></article>)}</div>
          <div className="search-programs"><h3>발행 전 필수 품질 게이트</h3><article><ol>{qualityDesignGates.map(gate=><li key={gate}>{gate}</li>)}</ol></article></div>
        </section>

        <section className="panel promotion-agent-panel">
          <div className="panel-title"><div><p className="eyebrow">PROMOTION AGENT</p><h2>홍보 에이전트 작업실</h2></div><span className="queue-count">준비 {promotions.filter(item=>item.status==="prepared").length}</span></div>
          <p className="panel-help">발행된 글을 선택하면 SNS용 짧은 문구, 커뮤니티 소개문, 해시태그와 원문 링크를 준비합니다. 외부 채널에는 자동으로 무단 게시하지 않으며, 문구를 확인하고 직접 공유한 뒤 실행 완료를 기록합니다. 콘텐츠 에이전트가 새 글을 발행하면 홍보안도 자동으로 준비됩니다.</p>
          <form className="promotion-agent-form" onSubmit={preparePromotion}>
            <div className="field"><label htmlFor="promotionPostId">홍보할 발행 글</label><select id="promotionPostId" name="promotionPostId" required defaultValue=""><option value="" disabled>글을 선택하세요</option>{posts.filter(post=>post.status==="published").map(post=><option value={post.id} key={post.id}>{post.title}</option>)}</select></div>
            <button className="admin-button" disabled={saving}>홍보안 준비하기</button>
          </form>
          <div className="promotion-campaigns">{promotions.length===0?<p className="promotion-empty">아직 준비된 홍보안이 없습니다. 발행 글을 선택해 첫 홍보안을 만드세요.</p>:promotions.map(campaign=><article className={`promotion-card ${campaign.status}`} key={campaign.id}>
            <header><div><span>{campaign.status==="prepared"?"확인·실행 대기":"실행 기록 완료"}</span><h3>{campaign.title}</h3></div><time>{new Date(campaign.executedAt||campaign.createdAt).toLocaleString("ko-KR")}</time></header>
            <div className="promotion-channel-list" aria-label="추천 홍보 채널">{campaign.channels.map(channel=><span key={channel}>{channel}</span>)}</div>
            <div className="marketing-channel-plans">{campaign.channelPlans.map(plan=><section key={plan.id} className="marketing-channel-plan"><header><div><strong>{plan.name}</strong><span>담당 {plan.owner}</span></div><small>UTM 추적 적용</small></header><p>{plan.copy}</p><code>{plan.trackedUrl}</code><div><button type="button" disabled={saving} onClick={()=>copyPromotion(plan.copy,`${plan.name} 문구`)}>문구 복사</button>{plan.actionUrl&&<a href={plan.actionUrl} target="_blank" rel="noreferrer">공유 화면 열기</a>}</div></section>)}</div>
            <div className="promotion-actions">{campaign.status==="prepared"&&<button type="button" disabled={saving} onClick={()=>finishPromotion(campaign.id)}>외부 게시 완료로 표시</button>}</div>
          </article>)}</div>
        </section>

        <section className="panel promotion-department-panel">
          <div className="panel-title"><div><p className="eyebrow">SEARCH GROWTH TEAM</p><h2>홍보마케팅팀 조직·SEO 운영실</h2></div><span className="queue-count">AI 실무자 {promotionTeam.length}명</span></div>
          <p className="panel-help">역할이 바로 연상되는 짧은 닉네임을 사용하는 AI 조직입니다. 검색 결과 점검과 개선안 작성은 반복 수행하되, 외부 게시·검색도구 설정 변경·배포는 사람의 확인과 승인 뒤에만 실행합니다.</p>
          <div className="promotion-team-grid">{promotionTeam.map(member=><article className="promotion-member-card" key={member.id}><div><span>{member.name}</span><small>AI 실무자</small></div><h3>{member.title}</h3><p>{member.scope}</p><strong>{member.cadence}</strong><ul>{member.kpis.map(kpi=><li key={kpi}>{kpi}</li>)}</ul></article>)}</div>
          <div className="search-programs"><h3>검색엔진별 상시 관리</h3>{searchPrograms.map(program=>{const owner=getPromotionMember(program.ownerId);return <article key={program.id}><header><div><span>{program.engine}</span><strong>{owner?.name} · {owner?.title}</strong></div><small>{program.successMetric}</small></header><ol>{program.routine.map(item=><li key={item}>{item}</li>)}</ol></article>;})}</div>
        </section>
      </div>
    </main>
  );
}
