#!/usr/bin/env node
/**
 * 관리자 비밀번호 해시(ADMIN_PASSWORD_HASH)를 만듭니다.
 *
 *   node scripts/make-admin-hash.mjs
 *   node scripts/make-admin-hash.mjs '내비밀번호'
 *
 * 인자를 주지 않으면 화면에 표시하지 않고 입력받습니다. 셸 기록에 비밀번호가
 * 남지 않으므로 이 방식을 권합니다.
 *
 * 만들어진 값은 lib/site-admin.ts 의 pbkdf2_sha256 형식입니다. 세션 비밀키와
 * 무관하게 검증되므로, 나중에 ADMIN_SESSION_SECRET 을 바꿔도 로그인이 깨지지 않습니다.
 */
import { createInterface } from "node:readline";
import { webcrypto } from "node:crypto";

const ITERATIONS = 210_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

function bytesToBase64Url(bytes) {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hashPassword(password) {
  const salt = webcrypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const key = await webcrypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await webcrypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    key,
    KEY_BITS,
  );
  return `pbkdf2_sha256$${ITERATIONS}$${bytesToBase64Url(salt)}$${bytesToBase64Url(new Uint8Array(bits))}`;
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // 입력 중 화면에 글자가 찍히지 않도록 출력을 가로챕니다.
    const write = rl._writeToOutput.bind(rl);
    rl._writeToOutput = (text) => write(text.includes(question) ? text : "");
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const password = process.argv[2] ?? (await askHidden("관리자 비밀번호: "));
if (!password || password.length < 10) {
  console.error("비밀번호가 너무 짧습니다. 최소 10자 이상으로 정하세요.");
  process.exit(1);
}

console.log("\nADMIN_PASSWORD_HASH 에 아래 값을 그대로 등록하세요.\n");
console.log(await hashPassword(password));
console.log("\n비밀번호 원문은 어디에도 저장되지 않습니다. 따로 안전하게 보관하세요.");
