#!/usr/bin/env node
/**
 * Creates EAS env var EXPO_PUBLIC_FIREBASE_DATABASE_URL from local `.env`.
 * Requires: EAS CLI logged in (`npx eas-cli whoami`).
 * Run: npm run setup:eas-rtdb-env
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(repoRoot, ".env");
const easLocal = path.join(repoRoot, "node_modules", ".bin", "eas");
const easCmd = fs.existsSync(easLocal) ? easLocal : "npx";
const easPrefix = fs.existsSync(easLocal) ? [] : ["eas-cli"];

function runEas(args, options = {}) {
  return spawnSync(easCmd, [...easPrefix, ...args], {
    encoding: "utf8",
    shell: process.platform === "win32",
    cwd: repoRoot,
    ...options,
  });
}

function fail(message) {
  console.error(`setup:eas-rtdb-env: ${message}`);
  process.exit(1);
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

const url = (
  process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ??
  loadDotEnv(envPath).EXPO_PUBLIC_FIREBASE_DATABASE_URL ??
  ""
).replace(/\/$/, "");

if (!url) {
  fail("EXPO_PUBLIC_FIREBASE_DATABASE_URL missing from .env");
}

const whoami = runEas(["whoami"]);
if (whoami.status !== 0) {
  fail("Run `npm run eas:login` first, then retry.");
}

for (const environment of ["development", "preview", "production"]) {
  console.log(`setup:eas-rtdb-env: creating ${environment} env...`);
  const result = runEas(
    [
      "env:create",
      "--name",
      "EXPO_PUBLIC_FIREBASE_DATABASE_URL",
      "--value",
      url,
      "--environment",
      environment,
      "--visibility",
      "plaintext",
      "--non-interactive",
      "--force",
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    fail(`eas env:create failed for ${environment} (exit ${result.status})`);
  }
}

console.log("setup:eas-rtdb-env: OK — EXPO_PUBLIC_FIREBASE_DATABASE_URL on development, preview, production");
