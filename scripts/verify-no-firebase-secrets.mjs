#!/usr/bin/env node
/**
 * Fail if tracked or staged files contain Firebase native configs or Google API keys.
 * Usage: node scripts/verify-no-firebase-secrets.mjs [--staged]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stagedOnly = process.argv.includes("--staged");

const FORBIDDEN_BASENAMES = new Set([
  "GoogleService-Info.plist",
  "google-services.json",
]);

const GOOGLE_API_KEY_RE = /AIzaSy[A-Za-z0-9_-]{33}/;

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function listFiles() {
  if (stagedOnly) {
    const out = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]);
    return out ? out.split("\n").filter(Boolean) : [];
  }
  const out = git(["ls-files"]);
  return out ? out.split("\n").filter(Boolean) : [];
}

function isForbiddenNativeConfig(relativePath) {
  if (relativePath.endsWith(".example")) return false;
  const base = path.basename(relativePath);
  return FORBIDDEN_BASENAMES.has(base);
}

function readText(relativePath) {
  const abs = path.join(repoRoot, relativePath);
  if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) return null;
  try {
    return fs.readFileSync(abs, "utf8");
  } catch {
    return null;
  }
}

const files = listFiles();
const errors = [];

for (const file of files) {
  if (isForbiddenNativeConfig(file)) {
    errors.push(`Forbidden Firebase native config: ${file}`);
    continue;
  }
  const text = readText(file);
  if (text && GOOGLE_API_KEY_RE.test(text)) {
    errors.push(`Google API key pattern (AIzaSy…) in: ${file}`);
  }
}

if (errors.length > 0) {
  console.error(
    stagedOnly
      ? "verify-no-firebase-secrets: commit blocked —"
      : "verify-no-firebase-secrets: failed —",
  );
  for (const err of errors) {
    console.error(`  • ${err}`);
  }
  console.error(
    "\nNative configs belong in gitignored assets/ only. See docs/security-firebase-key-leak.md",
  );
  process.exit(1);
}

console.log(
  `verify-no-firebase-secrets: ok (${stagedOnly ? "staged" : "tracked"} files)`,
);
