#!/usr/bin/env node
/**
 * Preflight for firebase deploy — fails fast with a clear message when not logged in.
 */
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["firebase-tools", "login:list"], {
  encoding: "utf8",
  shell: process.platform === "win32",
});

const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

if (output.includes('No authorized accounts') || /not logged in/i.test(output)) {
  console.error("deploy:database-rules: Firebase CLI is not authenticated.");
  console.error("");
  console.error("  npx firebase-tools login");
  console.error("  npm run deploy:database-rules");
  console.error("");
  console.error("Project default: into-the-pond (see .firebaserc)");
  process.exit(1);
}

if (result.status !== 0) {
  console.error("deploy:database-rules: could not verify Firebase CLI login.");
  console.error(output.trim());
  process.exit(result.status ?? 1);
}

console.log("deploy:database-rules: Firebase CLI authenticated");
