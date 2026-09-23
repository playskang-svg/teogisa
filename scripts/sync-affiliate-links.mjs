#!/usr/bin/env node
/**
 * 제휴링크 중앙 저장소(playskang-svg/affiliatelink)를 이 사이트로 동기화한다.
 *
 * 소스: ../affiliatelink/data/affiliate-links.json  (AFFILIATE_SOURCE 로 덮어쓸 수 있음)
 * 대상: data/affiliate-links.json                   (커밋됨 — CI 빌드는 이 사본을 쓴다)
 *
 * coupang 블록(API 키)은 제거하고 복사한다. 이 파일은 클라이언트 번들에
 * 섞일 수 있으므로 키가 들어가면 브라우저로 노출된다.
 * (중앙 저장소 자체에는 애초에 API 키를 두지 않는다 — affiliatelink/README.md 참고.
 * 여기서 지우는 건 과거 A-factory 시절 습관과의 하위호환일 뿐이다.)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source =
  process.env.AFFILIATE_SOURCE ?? resolve(root, "../affiliatelink/data/affiliate-links.json");
const target = resolve(root, "data/affiliate-links.json");

if (!existsSync(source)) {
  if (existsSync(target)) {
    console.warn(`[affiliate] 소스 없음 (${source}) — 기존 data/affiliate-links.json 사용`);
    process.exit(0);
  }
  console.error(`[affiliate] 소스도 사본도 없음: ${source}`);
  process.exit(1);
}

const data = JSON.parse(readFileSync(source, "utf8"));
delete data.coupang; // API 키 제거

if (!Array.isArray(data.links) || data.links.length === 0) {
  console.error("[affiliate] links 배열이 비어 있다. 동기화 중단.");
  process.exit(1);
}

const dupes = data.links.map((l) => l.key).filter((k, i, a) => a.indexOf(k) !== i);
if (dupes.length) {
  console.error(`[affiliate] link_key 중복: ${dupes.join(", ")}`);
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(data, null, 2) + "\n");

const review = data.links.filter((l) => l.status === "review");
console.log(`[affiliate] ${data.links.length}개 링크 동기화 (updated: ${data.updated})`);
if (review.length) {
  console.warn(`[affiliate] 확인 필요 ${review.length}건: ${review.map((l) => l.key).join(", ")}`);
}
