#!/usr/bin/env node
/**
 * Bootstrap a git worktree for local Expo dev: install deps + link gitignored files from main checkout.
 * Safe to re-run; skips existing node_modules unless --force-install.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const forceInstall = process.argv.includes("--force-install");

function mainRoot() {
  try {
    const lines = execSync("git worktree list --porcelain", {
      cwd: repoRoot,
      encoding: "utf8",
    }).split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]?.startsWith("worktree ") && !lines[i].includes("/.worktrees/")) {
        return lines[i].slice("worktree ".length).trim();
      }
    }
  } catch {
    /* fall through */
  }
  return path.resolve(repoRoot, "../..");
}

const main = mainRoot();
const links = [
  { rel: "assets/google-services.json", src: path.join(main, "assets/google-services.json") },
  { rel: "assets/GoogleService-Info.plist", src: path.join(main, "assets/GoogleService-Info.plist") },
  { rel: ".env", src: path.join(main, ".env") },
];

console.log(`bootstrap-worktree-dev: worktree=${repoRoot}`);
console.log(`bootstrap-worktree-dev: main checkout=${main}`);

for (const { rel, src } of links) {
  const dest = path.join(repoRoot, rel);
  if (fs.existsSync(dest)) {
    console.log(`  ok  ${rel} (already present)`);
    continue;
  }
  if (!fs.existsSync(src)) {
    console.warn(`  skip ${rel} — missing in main checkout (${src})`);
    continue;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const relativeSrc = path.relative(path.dirname(dest), src);
  fs.symlinkSync(relativeSrc, dest);
  console.log(`  link ${rel} → ${relativeSrc}`);
}

const nodeModules = path.join(repoRoot, "node_modules");
if (forceInstall || !fs.existsSync(nodeModules)) {
  console.log("bootstrap-worktree-dev: running npm install…");
  execSync("npm install", { cwd: repoRoot, stdio: "inherit" });
} else {
  console.log("bootstrap-worktree-dev: node_modules present (use --force-install to reinstall)");
}

console.log("bootstrap-worktree-dev: done — run npm start from this worktree");
