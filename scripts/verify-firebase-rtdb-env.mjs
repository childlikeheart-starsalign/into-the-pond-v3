#!/usr/bin/env node
/**
 * Verifies Realtime Database env wiring after Console + `.env` setup.
 * Run from repo root: npm run verify:firebase-rtdb-env
 * Optional live check (no auth): npm run verify:firebase-rtdb-env -- --smoke
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(repoRoot, ".env");

function fail(message) {
  console.error(`verify:firebase-rtdb-env: ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`verify:firebase-rtdb-env: ${message}`);
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const envFile = loadDotEnv(envPath);
const databaseUrl =
  process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? envFile.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? "";

if (!databaseUrl) {
  fail(
    "EXPO_PUBLIC_FIREBASE_DATABASE_URL is missing. Add it to `.env` (see .env.example), then restart Metro.",
  );
}

if (!/^https:\/\/.+\.firebasedatabase\.app\/?$/i.test(databaseUrl)) {
  fail(
    `EXPO_PUBLIC_FIREBASE_DATABASE_URL does not look like an RTDB URL: ${databaseUrl}`,
  );
}

const appConfigPath = path.join(repoRoot, "app.config.js");
if (!fs.existsSync(appConfigPath)) {
  fail("app.config.js not found.");
}

process.chdir(repoRoot);
const configResult = spawnSync(
  process.execPath,
  [
    "-e",
    `require('dotenv').config({ path: ${JSON.stringify(envPath)} });
const cfg = require(${JSON.stringify(appConfigPath)})();
const url = cfg?.expo?.extra?.firebaseDatabaseUrl ?? '';
if (!url) { console.error('MISSING'); process.exit(2); }
console.log(url);`,
  ],
  { encoding: "utf8", env: { ...process.env, EXPO_PUBLIC_FIREBASE_DATABASE_URL: databaseUrl } },
);

if (configResult.status !== 0 || !configResult.stdout.trim()) {
  fail(
    "app.config.js did not expose expo.extra.firebaseDatabaseUrl — check EXPO_PUBLIC_FIREBASE_DATABASE_URL mapping.",
  );
}

const mappedUrl = configResult.stdout.trim().replace(/\/$/, "");
const normalizedInput = databaseUrl.replace(/\/$/, "");
if (mappedUrl !== normalizedInput) {
  fail(`app.config.js mapped URL (${mappedUrl}) does not match .env (${normalizedInput}).`);
}

console.log("verify:firebase-rtdb-env: OK");
console.log(`  EXPO_PUBLIC_FIREBASE_DATABASE_URL is set`);
console.log(`  app.config.js → expo.extra.firebaseDatabaseUrl`);
console.log(`  Restart Metro after changing .env: npx expo start --dev-client`);

const smoke = process.argv.includes("--smoke");
if (!smoke) {
  console.log("  Tip: run with --smoke to probe RTDB reachability (expects permission denied when rules are locked down)");
  process.exit(0);
}

const apiKey =
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? envFile.EXPO_PUBLIC_FIREBASE_API_KEY ?? "";
const projectId =
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? envFile.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "";

if (!apiKey || !projectId) {
  fail("--smoke requires EXPO_PUBLIC_FIREBASE_API_KEY and EXPO_PUBLIC_FIREBASE_PROJECT_ID in .env");
}

const { initializeApp } = await import("firebase/app");
const { getDatabase, ref, set, get, remove } = await import("firebase/database");

const app = initializeApp({
  apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? envFile.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId,
  databaseURL: normalizedInput,
});
const db = getDatabase(app);
const testRef = ref(db, "_dev/ping");

try {
  await set(testRef, { ok: true, at: Date.now() });
  const snap = await get(testRef);
  await remove(testRef);
  if (!snap.exists()) {
    fail("--smoke write succeeded but read-back was empty.");
  }
  warn(
    "--smoke: unauthenticated write to _dev/ping succeeded. RTDB may still be in test mode — deploy database.rules.json and run: npm run deploy:database-rules",
  );
  process.exit(0);
} catch (error) {
  const code = error?.code ?? "";
  if (code === "PERMISSION_DENIED" || /permission/i.test(String(error?.message ?? ""))) {
    console.log("  --smoke: unauthenticated write denied (expected with locked-down rules)");
    console.log("  RTDB endpoint is reachable; sign in and use pingRealtimeDb() for an auth smoke test.");
    process.exit(0);
  }
  fail(`--smoke failed: ${error?.message ?? error}`);
}
