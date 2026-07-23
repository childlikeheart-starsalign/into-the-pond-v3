#!/usr/bin/env node
/**
 * Debug: why gh pr create failed after successful git push.
 * Writes NDJSON to .cursor/debug-89ac8c.log and POSTs to ingest.
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const LOG = resolve(process.cwd(), ".cursor/debug-89ac8c.log");
const ENDPOINT = "http://127.0.0.1:7331/ingest/f0a22a23-9c52-461e-a2e7-e25d9388c16a";
const RUN = process.env.DEBUG_RUN_ID || "pre-fix";

function log(hypothesisId, location, message, data) {
  const payload = {
    sessionId: "89ac8c",
    runId: RUN,
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  // #region agent log
  appendFileSync(LOG, JSON.stringify(payload) + "\n");
  fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "89ac8c",
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
  console.log(`[${hypothesisId}] ${message}`, JSON.stringify(data));
}

function sh(cmd, args) {
  try {
    const out = execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, out: out.trim(), code: 0 };
  } catch (e) {
    return {
      ok: false,
      out: String(e.stdout || "") + String(e.stderr || e.message),
      code: e.status ?? 1,
    };
  }
}

const root = process.cwd();
log("E", "diag:cwd", "cwd and body files", {
  cwd: root,
  body0: existsSync(".worktrees/PR_PHASE0.md"),
  body1: existsSync(".worktrees/PR_PHASE1.md"),
});

const tokenSet = Boolean(process.env.GH_TOKEN && process.env.GH_TOKEN.length > 0);
log("B", "diag:GH_TOKEN", "GH_TOKEN env presence", { tokenSet });

const auth = sh("gh", ["auth", "status"]);
log("A", "diag:gh-auth", "gh auth status", {
  ok: auth.ok,
  code: auth.code,
  out: auth.out.slice(0, 500),
});

const hosts = sh("gh", ["api", "user", "-q", ".login"]);
log("A", "diag:gh-api-user", "gh api user (needs auth)", {
  ok: hosts.ok,
  code: hosts.code,
  out: hosts.out.slice(0, 200),
});

const remotes = sh("git", ["ls-remote", "--heads", "origin", "phase-0-map-hygiene", "phase-1-archetype-map"]);
log("D", "diag:remote-heads", "remote phase branches exist", {
  ok: remotes.ok,
  code: remotes.code,
  out: remotes.out.slice(0, 400),
});

if (!auth.ok || /not logged into any GitHub hosts/i.test(auth.out)) {
  log("A", "diag:verdict", "CONFIRMED: gh not authenticated — pr create will exit 4", {
    next: "run: gh auth login",
  });
  process.exit(4);
}

const pr0 = sh("gh", [
  "pr",
  "create",
  "--base",
  "main",
  "--head",
  "phase-0-map-hygiene",
  "--title",
  "Phase 0: map hygiene — visual QA CI gates + seed --flag",
  "--body-file",
  ".worktrees/PR_PHASE0.md",
]);
log("C", "diag:pr0", "phase-0 pr create result", {
  ok: pr0.ok,
  code: pr0.code,
  out: pr0.out.slice(0, 500),
});

const pr1 = sh("gh", [
  "pr",
  "create",
  "--base",
  "phase-0-map-hygiene",
  "--head",
  "phase-1-archetype-map",
  "--title",
  "Phase 1: fixture ArchetypeResultMap + caption thresholds",
  "--body-file",
  ".worktrees/PR_PHASE1.md",
]);
log("C", "diag:pr1", "phase-1 pr create result", {
  ok: pr1.ok,
  code: pr1.code,
  out: pr1.out.slice(0, 500),
});

process.exit(pr0.ok && pr1.ok ? 0 : 1);
