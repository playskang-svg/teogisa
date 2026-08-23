import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

// 저장소 계층 전체를 불러오면 드라이버까지 딸려오므로, 순수 함수만 떼어 확인합니다.
const source = await readFile(new URL("../lib/repository.ts", import.meta.url), "utf8");
const start = source.indexOf("export function describeDatabaseTarget");
const end = source.indexOf("\nlet pgAdapter");
const body = source.slice(start, end).replace("export function", "function");
const describeDatabaseTarget = new Function(
  "process",
  `${body.replace(/: string\[\]/g, "").replace(/let parsed: URL;/, "let parsed;")}; return describeDatabaseTarget;`,
)({ env: {} });

function describeWith(value) {
  const fn = new Function(
    "process",
    `${body.replace(/: string\[\]/g, "").replace(/let parsed: URL;/, "let parsed;")}; return describeDatabaseTarget;`,
  )({ env: { DATABASE_URL: value } });
  return fn();
}

test("reports an empty connection string plainly", () => {
  assert.match(describeDatabaseTarget(), /비어 있습니다/);
});

test("reports a malformed connection string", () => {
  assert.match(describeWith("not-a-url"), /형식이 올바르지 않습니다/);
});

test("summarises the target without leaking the password", () => {
  const summary = describeWith("postgresql://postgres.abc:SuperSecret123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres");
  assert.match(summary, /host=aws-0-ap-northeast-2\.pooler\.supabase\.com/);
  assert.match(summary, /port=6543/);
  assert.match(summary, /user=postgres\.abc/);
  assert.match(summary, /db=postgres/);
  assert.match(summary, /비밀번호=14자/);
  // 비밀번호 자체는 절대 기록에 남으면 안 됩니다.
  assert.doesNotMatch(summary, /SuperSecret123/);
});

test("flags the placeholder people paste straight from Supabase", () => {
  const summary = describeWith("postgresql://postgres.abc:[YOUR-PASSWORD]@db.example.com:6543/postgres");
  assert.match(summary, /자리표시자/);
});

test("flags a pooler host pointed at the direct-connection port", () => {
  const summary = describeWith("postgresql://postgres.abc:pw@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres");
  assert.match(summary, /6543/);
});
