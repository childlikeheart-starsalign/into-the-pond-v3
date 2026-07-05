#!/usr/bin/env node
/**
 * Uploads Firebase native config files to EAS env as base64 secrets.
 * Requires: EAS CLI logged in (`npm run eas:login`).
 * Run: npm run setup:eas-firebase-files
 *
 * Reads from assets/GoogleService-Info.plist and assets/google-services.json (local copies).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const easLocal = path.join(repoRoot, "node_modules", ".bin", "eas");
const easCmd = fs.existsSync(easLocal) ? easLocal : "npx";
const easPrefix = fs.existsSync(easLocal) ? [] : ["eas-cli"];

const ENVIRONMENTS = ["development", "preview", "production"];

const FILES = [
  {
    path: path.join(repoRoot, "assets", "GoogleService-Info.plist"),
    envName: "GOOGLE_SERVICE_INFO_PLIST_BASE64",
    label: "GoogleService-Info.plist",
  },
  {
    path: path.join(repoRoot, "assets", "google-services.json"),
    envName: "GOOGLE_SERVICES_JSON_BASE64",
    label: "google-services.json",
  },
];

function runEas(args, options = {}) {
  return spawnSync(easCmd, [...easPrefix, ...args], {
    encoding: "utf8",
    shell: process.platform === "win32",
    cwd: repoRoot,
    ...options,
  });
}

function fail(message) {
  console.error(`setup:eas-firebase-files: ${message}`);
  process.exit(1);
}

const whoami = runEas(["whoami"]);
if (whoami.status !== 0) {
  fail("Run `npm run eas:login` first, then retry.");
}

for (const file of FILES) {
  if (!fs.existsSync(file.path)) {
    fail(`Missing ${file.label} at ${file.path} — download from Firebase Console first.`);
  }
}

for (const file of FILES) {
  const value = fs.readFileSync(file.path).toString("base64");

  for (const environment of ENVIRONMENTS) {
    console.log(`setup:eas-firebase-files: creating ${file.envName} for ${environment}...`);
    const result = runEas(
      [
        "env:create",
        "--name",
        file.envName,
        "--value",
        value,
        "--environment",
        environment,
        "--visibility",
        "secret",
        "--non-interactive",
        "--force",
      ],
      { stdio: "inherit" },
    );
    if (result.status !== 0) {
      fail(`eas env:create failed for ${file.envName} (${environment})`);
    }
  }
}

console.log(
  "setup:eas-firebase-files: OK — Firebase native file secrets on development, preview, production",
);
