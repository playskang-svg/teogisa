// 실제 Postgres 를 상대로 어댑터를 검증합니다.
//   DATABASE_URL=postgresql://... node --experimental-strip-types tests/postgres-adapter.integration.mjs
// 주의: 대상 데이터베이스의 public 스키마를 지우고 다시 만듭니다. 반드시 빈 검증용 DB 를 쓰세요.
import postgres from "postgres";
import { PostgresD1Adapter, toPostgresQuery } from "../lib/postgres-adapter.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL 이 필요합니다. 비어 있는 검증용 데이터베이스를 지정하세요.");
  process.exit(2);
}

const sql = postgres(connectionString, { max: 4 });
const d1 = new PostgresD1Adapter(sql);
// 매 실행을 깨끗한 스키마에서 시작합니다.
await sql.unsafe("DROP SCHEMA public CASCADE; CREATE SCHEMA public;", []);
let pass = 0, fail = 0;
const check = (label, cond, extra="") => { if (cond) { pass++; console.log("  ok  " + label); } else { fail++; console.log("  FAIL " + label + " " + extra); } };

// --- 번역기 단위 확인 ---
check("? -> $n", toPostgresQuery("SELECT * FROM t WHERE a=? AND b=?").includes("$1") && toPostgresQuery("SELECT * FROM t WHERE a=? AND b=?").includes("$2"));
check("문자열 리터럴 안의 ? 는 그대로", toPostgresQuery("SELECT 'a?b' WHERE x=?") === "SELECT 'a?b' WHERE x=$1", toPostgresQuery("SELECT 'a?b' WHERE x=?"));
check("리터럴 안 CURRENT_TIMESTAMP 보존", toPostgresQuery("SELECT 'CURRENT_TIMESTAMP'").includes("'CURRENT_TIMESTAMP'"));
check("INSERT OR IGNORE -> ON CONFLICT DO NOTHING", /ON CONFLICT DO NOTHING$/.test(toPostgresQuery("INSERT OR IGNORE INTO t (a) VALUES (?)")));
check("AUTOINCREMENT -> SERIAL", toPostgresQuery("CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT)").includes("SERIAL PRIMARY KEY"));
check("datetime() 뒤의 ? 도 올바르게 번호 매김", toPostgresQuery("SELECT ? WHERE a>=datetime('now','-30 days') AND b=?").includes("$2"), toPostgresQuery("SELECT ? WHERE a>=datetime('now','-30 days') AND b=?"));

// --- 실제 프로젝트 DDL 로 스키마 생성 ---
await d1.prepare(`CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, excerpt TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', category TEXT NOT NULL, tags_json TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'draft', published_at TEXT, scheduled_at TEXT, reading_minutes INTEGER NOT NULL DEFAULT 5, visual TEXT NOT NULL DEFAULT 'NEW', author_name TEXT NOT NULL DEFAULT '데스크', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
await d1.prepare(`CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
await d1.prepare(`CREATE TABLE IF NOT EXISTS content_agents (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', cadence_hours INTEGER NOT NULL DEFAULT 168, next_run_at TEXT, last_run_at TEXT, topic_cursor INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
await d1.prepare(`CREATE TABLE IF NOT EXISTS audit_runs (id INTEGER PRIMARY KEY AUTOINCREMENT, status TEXT NOT NULL, completed_at TEXT)`).run();
await d1.prepare(`CREATE INDEX IF NOT EXISTS idx_content_agents_status_next ON content_agents(status, next_run_at)`).run();
check("DDL 실행", true);

// created_at 기본값이 SQLite 형식인지
await d1.prepare("INSERT OR IGNORE INTO posts (title,slug,category) VALUES (?,?,?)").bind("제목","s1","cat").run();
const post = await d1.prepare("SELECT * FROM posts WHERE slug=?").bind("s1").first();
check("CURRENT_TIMESTAMP 기본값 형식", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(post.created_at), post.created_at);
check("한글 기본값", post.author_name === "데스크", post.author_name);

// INSERT OR IGNORE 재실행이 조용히 넘어가는지
const dup = await d1.prepare("INSERT OR IGNORE INTO posts (title,slug,category) VALUES (?,?,?)").bind("제목","s1","cat").run();
check("INSERT OR IGNORE 중복 무시", dup.meta.changes === 0, String(dup.meta.changes));

// substr(?,1,10) — 실제 publishDuePosts 에서 쓰는 형태
await d1.prepare("UPDATE posts SET status='published', published_at=substr(?,1,10), updated_at=CURRENT_TIMESTAMP WHERE slug=?").bind(new Date().toISOString(),"s1").run();
const published = await d1.prepare("SELECT published_at,updated_at FROM posts WHERE slug=?").bind("s1").first();
check("substr(?,1,10)", /^\d{4}-\d{2}-\d{2}$/.test(published.published_at), published.published_at);
check("UPDATE 의 CURRENT_TIMESTAMP", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(published.updated_at), published.updated_at);

// RETURNING *
const returned = await d1.prepare("UPDATE posts SET status=? WHERE slug=? RETURNING *").bind("draft","s1").first();
check("RETURNING *", returned && returned.status === "draft");

// meta.changes
const noMatch = await d1.prepare("UPDATE posts SET status=? WHERE slug=?").bind("draft","없는슬러그").run();
check("meta.changes 0", noMatch.meta.changes === 0, String(noMatch.meta.changes));
const oneMatch = await d1.prepare("UPDATE posts SET status=? WHERE slug=?").bind("draft","s1").run();
check("meta.changes 1", oneMatch.meta.changes === 1, String(oneMatch.meta.changes));

// 스케줄러 실행권 잠금(ON CONFLICT ... DO UPDATE ... WHERE)
const claimSql = `INSERT INTO site_settings (key,value_json,updated_at) VALUES (?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=CURRENT_TIMESTAMP
    WHERE site_settings.value_json<=?`;
const t0 = Date.parse("2026-08-23T00:00:00.000Z");
const claim = async (ms) => (await d1.prepare(claimSql).bind("automation_scheduler_claim", JSON.stringify(new Date(ms).toISOString()), JSON.stringify(new Date(ms-15*60000).toISOString())).run()).meta.changes;
check("최초 실행권 획득", await claim(t0) === 1);
check("1분 뒤 재시도 차단", await claim(t0+60000) === 0);
check("15분 뒤 재획득", await claim(t0+15*60000) === 1);

// content_agents 대형 upsert (CASE + excluded)
const upsert = `INSERT INTO content_agents (id,name,status,cadence_hours,next_run_at) VALUES (?,?,?,?,?)
  ON CONFLICT(id) DO UPDATE SET name=excluded.name, cadence_hours=excluded.cadence_hours,
    next_run_at=CASE WHEN content_agents.next_run_at IS NULL OR content_agents.next_run_at>excluded.next_run_at THEN excluded.next_run_at ELSE content_agents.next_run_at END,
    updated_at=CURRENT_TIMESTAMP`;
await d1.prepare(upsert).bind("a1","원","active",16,"2030-01-01T00:00:00.000Z").run();
await d1.prepare(upsert).bind("a1","원변경","active",16,"2027-01-01T00:00:00.000Z").run();
const agent = await d1.prepare("SELECT * FROM content_agents WHERE id=?").bind("a1").first();
check("upsert 갱신", agent.name === "원변경", agent.name);
check("upsert CASE 로 이른 시각 채택", agent.next_run_at === "2027-01-01T00:00:00.000Z", agent.next_run_at);

// 정지 항목 복구 + 집계
await d1.prepare("INSERT INTO content_agents (id,name,status,next_run_at) VALUES (?,?,?,NULL)").bind("a2","툴","active").run();
const revived = await d1.prepare("UPDATE content_agents SET next_run_at=?,updated_at=CURRENT_TIMESTAMP WHERE status='active' AND next_run_at IS NULL").bind("2026-08-23T00:00:00.000Z").run();
check("정지 항목 복구", revived.meta.changes === 1, String(revived.meta.changes));
const status = await d1.prepare(`SELECT
    SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active,
    SUM(CASE WHEN status='active' AND next_run_at IS NOT NULL AND next_run_at<=? THEN 1 ELSE 0 END) AS due,
    SUM(CASE WHEN status='active' AND next_run_at IS NULL THEN 1 ELSE 0 END) AS stalled
    FROM content_agents`).bind("2026-08-24T00:00:00.000Z").first();
check("집계 쿼리", Number(status.active) === 2 && Number(status.due) === 1 && Number(status.stalled) === 0, JSON.stringify(status));

// topic_cursor 증가 + batch 원자성
await d1.batch([
  d1.prepare("UPDATE content_agents SET topic_cursor=topic_cursor+1 WHERE id=?").bind("a1"),
  d1.prepare("INSERT INTO audit_runs (status) VALUES (?)").bind("completed"),
]);
const cursor = await d1.prepare("SELECT topic_cursor FROM content_agents WHERE id=?").bind("a1").first();
check("batch 실행", Number(cursor.topic_cursor) === 1, String(cursor.topic_cursor));
let rolledBack = false;
try { await d1.batch([ d1.prepare("UPDATE content_agents SET topic_cursor=99 WHERE id=?").bind("a1"), d1.prepare("INSERT INTO 없는테이블 (x) VALUES (1)") ]); }
catch { rolledBack = true; }
const after = await d1.prepare("SELECT topic_cursor FROM content_agents WHERE id=?").bind("a1").first();
check("batch 실패 시 롤백", rolledBack && Number(after.topic_cursor) === 1, String(after.topic_cursor));

// datetime('now', ...) 번역
await d1.prepare("INSERT INTO audit_runs (status,completed_at) VALUES ('completed', ?)").bind("2020-01-01 00:00:00").run();
const recent = await d1.prepare("SELECT id FROM audit_runs WHERE status='completed' AND completed_at>=datetime('now','-30 days') LIMIT 1").first();
check("datetime('now','-30 days') 로 오래된 행 제외", recent === null, JSON.stringify(recent));
// 경계값이 실제로 과거인지 직접 확인합니다. 부호를 잘못 다루면 미래 시각이 되어 위 검사가 우연히 통과합니다.
const bound30 = await sql.unsafe(toPostgresQuery("SELECT datetime('now','-30 days') AS cutoff"), []);
const bound6 = await sql.unsafe(toPostgresQuery("SELECT datetime('now','-6 hours') AS cutoff"), []);
const nowText = new Date().toISOString().slice(0,19).replace("T"," ");
check("-30 days 경계가 과거", bound30[0].cutoff < nowText, bound30[0].cutoff);
check("-6 hours 경계가 과거", bound6[0].cutoff < nowText, bound6[0].cutoff);
check("-30 days 가 -6 hours 보다 더 과거", bound30[0].cutoff < bound6[0].cutoff, `${bound30[0].cutoff} vs ${bound6[0].cutoff}`);
await d1.prepare("INSERT INTO audit_runs (status,completed_at) VALUES ('completed', CURRENT_TIMESTAMP)").run();
const fresh = await d1.prepare("SELECT id FROM audit_runs WHERE status='completed' AND completed_at>=datetime('now','-6 hours') LIMIT 1").first();
check("datetime('now','-6 hours') 로 최근 행 포함", fresh !== null);

console.log(`\n통과 ${pass} / 실패 ${fail}`);
await sql.end();
process.exit(fail ? 1 : 0);
