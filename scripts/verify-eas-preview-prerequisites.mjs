#!/usr/bin/env node
/**
 * Pre-flight checks before `npm run eas:build:preview`.
 * Does not print secret values.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const easLocal = path.join(repoRoot, "node_modules", ".bin", "eas");
const easCmd = fs.existsSync(easLocal) ? easLocal : "npx";
const easPrefix = fs.existsSync(easLocal) ? [] : ["eas-cli"];

function runEas(args) {
  return spawnSync(easCmd, [...easPrefix, ...args], {
    encoding: "utf8",
    cwd: repoRoot,
    shell: process.platform === "win32",
  });
}

function fail(msg) {
  console.error(`verify-eas-preview-prerequisites: ${msg}`);
  process.exit(1);
}

console.log("=== EAS preview build prerequisites ===\n");

const whoami = runEas(["whoami"]);
if (whoami.status !== 0) {
  fail("Not logged in — run: npm run eas:login");
}
console.log(`✓ EAS account: ${whoami.stdout.trim()}`);

const assetsScript = path.join(repoRoot, "scripts", "verify-firebase-assets-ready.mjs");
const assetsCheck = spawnSync(process.execPath, [assetsScript], { encoding: "utf8", cwd: repoRoot });
if (assetsCheck.status !== 0) {
  process.stderr.write(assetsCheck.stderr || assetsCheck.stdout);
  fail("Firebase native assets not ready");
}
console.log("✓ Firebase native assets ready");

const envList = runEas(["env:list", "--environment", "preview", "--non-interactive"]);
if (envList.status !== 0) {
  console.warn("⚠ Could not list EAS preview env (run eas env:list manually)");
} else {
  const required = [
    "GOOGLE_SERVICE_INFO_PLIST_BASE64",
    "GOOGLE_SERVICES_JSON_BASE64",
    "EXPO_PUBLIC_FIREBASE_API_KEY",
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
    "EXPO_PUBLIC_FIREBASE_APP_ID",
  ];
  const out = envList.stdout || "";
  for (const name of required) {
    if (out.includes(name)) {
      console.log(`✓ EAS preview env has ${name}`);
    } else {
      console.warn(`⚠ EAS preview env missing ${name} — set on expo.dev or via setup scripts`);
    }
  }
}

console.log("\nGitHub Actions (optional):");
console.log("  EXPO_TOKEN secret required for .github/workflows/eas-build.yml");
console.log("  https://github.com/childlikeheart-starsalign/into-the-pond-v3/settings/secrets/actions");

console.log("\nReady to build:");
console.log("  npm run eas:build:preview -- --platform ios");
