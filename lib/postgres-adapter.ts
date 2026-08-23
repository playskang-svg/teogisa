/**
 * D1(SQLite) 인터페이스를 그대로 흉내내는 Postgres 어댑터.
 *
 * 저장소 계층(`lib/repository.ts`)은 31개 함수가 D1의 `prepare().bind().run()/first()/all()`
 * 형태로 작성되어 있습니다. 호출부를 전부 고쳐 쓰는 대신 이 어댑터가 같은 모양의 객체를
 * 제공하고, SQLite 방언을 Postgres 방언으로 옮깁니다.
 */

type Params = readonly unknown[];

/**
 * 저장소 계층이 기대하는 최소 인터페이스. D1 의 부분집합이라 D1 과 이 어댑터 모두
 * 같은 타입으로 다룰 수 있습니다.
 */
export type SqlStatement = {
  bind(...values: unknown[]): SqlStatement;
  run(): Promise<{ meta: { changes: number } }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
};

export type SqlDatabase = {
  prepare(sql: string): SqlStatement;
  batch(statements: SqlStatement[]): Promise<unknown>;
};

/**
 * postgres 드라이버에서 이 어댑터가 실제로 쓰는 부분만 추립니다.
 * 트랜잭션 핸들은 중첩 begin 을 제공하지 않으므로 실행기와 최상위 커넥션을 구분합니다.
 */
export type PostgresExecutor = {
  unsafe(query: string, params: never[]): Promise<unknown>;
};

export type PostgresRunner = PostgresExecutor & {
  begin<T>(fn: (tx: PostgresExecutor) => Promise<T>): Promise<T>;
};

/** SQLite의 CURRENT_TIMESTAMP 는 'YYYY-MM-DD HH:MM:SS' 문자열입니다. 컬럼도 text 이므로 형식을 맞춥니다. */
const NOW_TEXT = "to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS')";

/**
 * SQLite 의 datetime('now','-30 days') 는 부호가 수식어에 포함된 형태로, 30일 "전"을 뜻합니다.
 * 부호를 그대로 둔 채 다시 빼면 미래 시각이 되므로 반드시 더해야 합니다.
 */
function intervalExpression(amount: string, unit: string) {
  return `to_char((now() AT TIME ZONE 'UTC') + interval '${amount} ${unit}','YYYY-MM-DD HH24:MI:SS')`;
}

/**
 * 작은따옴표 문자열 리터럴 안은 건드리지 않고 SQL 을 훑습니다.
 * `?` 치환과 키워드 치환 모두 리터럴을 건너뛰어야 안전합니다.
 */
function mapOutsideStringLiterals(sql: string, transform: (chunk: string) => string) {
  let out = "";
  let index = 0;
  while (index < sql.length) {
    const quote = sql.indexOf("'", index);
    if (quote === -1) {
      out += transform(sql.slice(index));
      break;
    }
    out += transform(sql.slice(index, quote));
    let end = quote + 1;
    while (end < sql.length) {
      if (sql[end] === "'") {
        if (sql[end + 1] === "'") { end += 2; continue; }
        end += 1;
        break;
      }
      end += 1;
    }
    out += sql.slice(quote, end);
    index = end;
  }
  return out;
}

/** SQLite 문법으로 쓰인 쿼리를 Postgres 문법으로 옮깁니다. */
export function translateSql(sql: string) {
  // datetime('now','-30 days') 는 패턴 자체가 문자열 리터럴을 품고 있어,
  // 리터럴을 건너뛰는 스캐너로는 볼 수 없습니다. 먼저 전체 문장에서 바꿉니다.
  const withIntervals = sql.replace(
    /\bdatetime\(\s*'now'\s*,\s*'([+-]?\d+)\s+(\w+)'\s*\)/gi,
    (_match, amount: string, unit: string) => intervalExpression(amount, unit),
  );
  let placeholder = 0;
  return mapOutsideStringLiterals(withIntervals, (chunk) =>
    chunk
      .replace(/\bINSERT\s+OR\s+IGNORE\s+INTO\b/gi, "INSERT INTO")
      .replace(/\bINTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT\b/gi, "SERIAL PRIMARY KEY")
      .replace(/\bCURRENT_TIMESTAMP\b/gi, NOW_TEXT)
      .replace(/\?/g, () => `$${++placeholder}`),
  );
}

/**
 * SQLite 의 `INSERT OR IGNORE` 는 모든 제약 위반을 무시합니다. Postgres 에는 대응하는 구문이
 * 없어 `ON CONFLICT DO NOTHING` 을 덧붙입니다. 이미 ON CONFLICT 가 있으면 그대로 둡니다.
 */
export function withConflictFallback(original: string, translated: string) {
  if (!/\bINSERT\s+OR\s+IGNORE\b/i.test(original)) return translated;
  if (/\bON\s+CONFLICT\b/i.test(translated)) return translated;
  return `${translated.trimEnd().replace(/;$/, "")} ON CONFLICT DO NOTHING`;
}

export function toPostgresQuery(sql: string) {
  return withConflictFallback(sql, translateSql(sql));
}

type QueryResult = unknown[] & { count?: number };

async function execute(runner: PostgresExecutor, text: string, params: Params) {
  // postgres 드라이버는 undefined 를 거부합니다. D1 은 null 과 같게 다뤘으므로 맞춰 줍니다.
  const safe = params.map((value) => (value === undefined ? null : value)) as never[];
  return (await runner.unsafe(text, safe)) as QueryResult;
}

class PostgresStatement {
  private readonly runner: PostgresExecutor;
  readonly text: string;
  readonly params: Params;

  constructor(runner: PostgresExecutor, text: string, params: Params = []) {
    this.runner = runner;
    this.text = text;
    this.params = params;
  }

  bind(...values: unknown[]) {
    return new PostgresStatement(this.runner, this.text, values);
  }

  withRunner(runner: PostgresExecutor) {
    return new PostgresStatement(runner, this.text, this.params);
  }

  async run() {
    const rows = await execute(this.runner, this.text, this.params);
    return { success: true, results: rows as unknown[], meta: { changes: Number(rows.count ?? 0) } };
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const rows = await execute(this.runner, this.text, this.params);
    return ((rows as unknown[])[0] as T) ?? null;
  }

  async all<T = Record<string, unknown>>() {
    const rows = await execute(this.runner, this.text, this.params);
    return { success: true, results: rows as T[], meta: { changes: Number(rows.count ?? 0) } };
  }
}

export class PostgresD1Adapter {
  private readonly runner: PostgresRunner;

  constructor(runner: PostgresRunner) {
    this.runner = runner;
  }

  prepare(sql: string) {
    return new PostgresStatement(this.runner, toPostgresQuery(sql));
  }

  /** D1 의 batch 는 원자적으로 실행됩니다. 트랜잭션으로 같은 보장을 제공합니다. */
  async batch(statements: SqlStatement[]) {
    const prepared = statements as PostgresStatement[];
    return this.runner.begin(async (tx) => {
      const results = [];
      for (const statement of prepared) results.push(await statement.withRunner(tx).run());
      return results;
    });
  }
}
