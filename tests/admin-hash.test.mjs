import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";

/**
 * 생성기가 만든 해시를 lib/site-admin.ts 의 검증 로직 그대로 확인합니다.
 * 형식이 어긋나면 배포 후에야 로그인 실패로 드러나므로 여기서 막습니다.
 */
function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(Buffer.from(padded, "base64"));
}

function safeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}

// lib/site-admin.ts 의 pbkdf2_sha256 분기를 그대로 옮긴 것입니다.
async function verifyPassword(password, stored) {
  const [scheme, ...parts] = stored.split("$");
  if (scheme !== "pbkdf2_sha256") return false;
  const [iterationsText, saltText, expectedText] = parts;
  const iterations = Number(iterationsText);
  if (!Number.isSafeInteger(iterations) || iterations < 100000) return false;
  const key = await webcrypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await webcrypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: base64UrlToBytes(saltText), iterations },
    key,
    256,
  );
  return safeEqual(new Uint8Array(bits), base64UrlToBytes(expectedText));
}

function generate(password) {
  const output = execFileSync("node", ["scripts/make-admin-hash.mjs", password], { encoding: "utf8" });
  return output.split("\n").find((line) => line.startsWith("pbkdf2_sha256$"));
}

test("the generated admin hash validates with the app's own verifier", async () => {
  const password = "correct-horse-battery-staple";
  const hash = generate(password);
  assert.ok(hash, "생성기가 해시를 출력하지 않았습니다.");
  assert.equal(await verifyPassword(password, hash), true, "올바른 비밀번호가 거부됩니다.");
  assert.equal(await verifyPassword("wrong-password-entirely", hash), false, "틀린 비밀번호가 통과합니다.");
});

test("each run uses a fresh salt", () => {
  const password = "correct-horse-battery-staple";
  assert.notEqual(generate(password), generate(password), "같은 소금을 재사용하면 해시가 서로 노출됩니다.");
});

test("the iteration count clears the verifier's own minimum", async () => {
  const siteAdmin = await readFile(new URL("../lib/site-admin.ts", import.meta.url), "utf8");
  assert.match(siteAdmin, /iterations<100000/);
  const iterations = Number(generate("correct-horse-battery-staple").split("$")[1]);
  assert.ok(iterations >= 100000, `반복 횟수 ${iterations} 는 검증기 최소값 미만입니다.`);
});

test("a password shorter than the minimum is rejected", () => {
  assert.throws(() => execFileSync("node", ["scripts/make-admin-hash.mjs", "short"], { encoding: "utf8", stdio: "pipe" }));
});
