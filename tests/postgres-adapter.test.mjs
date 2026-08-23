import assert from "node:assert/strict";
import test from "node:test";
import { toPostgresQuery, translateSql } from "../lib/postgres-adapter.ts";

test("converts SQLite placeholders to Postgres positional parameters", () => {
  assert.equal(translateSql("SELECT * FROM t WHERE a=? AND b=?"), "SELECT * FROM t WHERE a=$1 AND b=$2");
  // 문자열 리터럴 안의 물음표는 바인딩이 아닙니다.
  assert.equal(translateSql("SELECT 'a?b' WHERE x=?"), "SELECT 'a?b' WHERE x=$1");
});

test("keeps SQLite keywords inside string literals untouched", () => {
  assert.equal(translateSql("SELECT 'CURRENT_TIMESTAMP'"), "SELECT 'CURRENT_TIMESTAMP'");
  assert.match(translateSql("SELECT CURRENT_TIMESTAMP"), /to_char\(now\(\)/);
});

test("renders CURRENT_TIMESTAMP as text matching SQLite's format", () => {
  // 날짜 컬럼이 text 이므로 timestamptz 를 그대로 넣으면 타입이 어긋납니다.
  assert.match(translateSql("SELECT CURRENT_TIMESTAMP"), /'YYYY-MM-DD HH24:MI:SS'/);
});

test("treats a datetime modifier's sign as part of the offset", () => {
  // datetime('now','-30 days') 는 30일 전입니다. 부호를 두고 다시 빼면 미래가 됩니다.
  const past = translateSql("SELECT datetime('now','-30 days')");
  assert.match(past, /\+ interval '-30 days'/);
  assert.doesNotMatch(past, /- interval '-30 days'/);
  assert.match(translateSql("SELECT datetime('now','-6 hours')"), /\+ interval '-6 hours'/);
});

test("numbers placeholders correctly around a translated datetime call", () => {
  const query = translateSql("SELECT ? WHERE a>=datetime('now','-30 days') AND b=?");
  assert.match(query, /\$1/);
  assert.match(query, /\$2/);
});

test("maps INSERT OR IGNORE onto ON CONFLICT DO NOTHING", () => {
  assert.match(toPostgresQuery("INSERT OR IGNORE INTO t (a) VALUES (?)"), /ON CONFLICT DO NOTHING$/);
  // 이미 충돌 처리가 있는 구문에는 덧붙이지 않습니다.
  const upsert = toPostgresQuery("INSERT INTO t (a) VALUES (?) ON CONFLICT(a) DO UPDATE SET a=excluded.a");
  assert.equal(upsert.match(/ON CONFLICT/g).length, 1);
});

test("maps SQLite autoincrement primary keys to Postgres serial", () => {
  assert.match(translateSql("CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT)"), /SERIAL PRIMARY KEY/);
});
