#!/usr/bin/env node
/**
 * If the PR/push diff touches src/components/archetype/**, require:
 *   - docs/VISUAL_QA_SIGNOFF.md in the same diff
 *   - at least one new/changed file under docs/visual-qa/ (not only .gitkeep)
 *
 * Usage:
 *   node scripts/verify-visual-qa-signoff.mjs
 *   BASE_REF=origin/main node scripts/verify-visual-qa-signoff.mjs
 *
 * On pull_request CI, set BASE_REF to the merge base (e.g. origin/main).
 * When no base is available (local without fetch), compares against HEAD~1 if possible;
 * if the working tree has no archetype changes vs base, exits 0.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function changedFiles(baseRef) {
  try {
    const out = git(["diff", "--name-only", "--diff-filter=ACMR", `${baseRef}...HEAD`]);
    return out ? out.split("\n").filter(Boolean) : [];
  } catch {
    return null;
  }
}

const baseRef =
  process.env.BASE_REF?.trim() ||
  process.env.GITHUB_BASE_REF?.trim()?.replace(/^(?!origin\/)/, "origin/") ||
  "origin/main";

let files = changedFiles(baseRef);
if (files === null) {
  // Fallback: staged + unstaged vs HEAD (local)
  try {
    const staged = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]);
    const unstaged = git(["diff", "--name-only", "--diff-filter=ACMR"]);
    files = [...new Set([...staged.split("\n"), ...unstaged.split("\n")].filter(Boolean))];
  } catch {
    console.log("verify-visual-qa-signoff: skip (could not resolve diff)");
    process.exit(0);
  }
}

const touchesArchetype = files.some((f) => f.replace(/\\/g, "/").startsWith("src/components/archetype/"));
if (!touchesArchetype) {
  console.log(
    `verify-visual-qa-signoff: ok (no src/components/archetype/** changes vs ${baseRef})`,
  );
  process.exit(0);
}

const hasSignoff = files.some((f) => f.replace(/\\/g, "/") === "docs/VISUAL_QA_SIGNOFF.md");
const visualQaFiles = files.filter((f) => {
  const p = f.replace(/\\/g, "/");
  return p.startsWith("docs/visual-qa/") && !p.endsWith(".gitkeep");
});

const errors = [];
if (!hasSignoff) {
  errors.push(
    "src/components/archetype/** changed but docs/VISUAL_QA_SIGNOFF.md is not in the same diff (human commit required)",
  );
}
if (visualQaFiles.length === 0) {
  errors.push(
    "src/components/archetype/** changed but no screenshot artifact under docs/visual-qa/ in the same diff",
  );
}

if (errors.length > 0) {
  console.error("verify-visual-qa-signoff: FAIL —");
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}

console.log("verify-visual-qa-signoff: ok (sign-off + visual-qa artifacts in diff)");
