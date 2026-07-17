#!/usr/bin/env node
/**
 * Fail if any file outside the Phase 1 map allowlist imports ArchetypeResultMap.
 * Matches import/require path forms — not bare filename mentions in docs.
 *
 * Usage: node scripts/verify-no-map-import-in-switcher.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Import path segment that identifies the Phase 1 map module. */
const MAP_MODULE = "ArchetypeResultMap";

/**
 * Allowlist: map module itself + its co-located / dedicated unit tests.
 * Paths are repo-relative, posix-style.
 */
function isAllowlisted(relativePath) {
  const p = relativePath.replace(/\\/g, "/");
  if (p.startsWith("src/components/archetype/")) return true;
  if (p === "app/archetype-map-fixture.tsx") return true;
  if (p.includes("/archetype/") && /\.(test|spec)\.(ts|tsx|js|mjs)$/.test(p)) return true;
  if (p === `src/constants/archetypeMapCopy.ts`) return false;
  return false;
}

/** Detect import/require of the map module by path (not bare word in prose). */
const IMPORT_RE = new RegExp(
  String.raw`(?:from\s+['"][^'"]*${MAP_MODULE}['"]|require\s*\(\s*['"][^'"]*${MAP_MODULE}['"]\s*\)|import\s*\(\s*['"][^'"]*${MAP_MODULE}['"]\s*\))`,
);

function gitLsFiles() {
  const out = execFileSync("git", ["ls-files"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  return out ? out.split("\n").filter(Boolean) : [];
}

function listSourceFiles() {
  return gitLsFiles().filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f));
}

const hits = [];
for (const file of listSourceFiles()) {
  if (isAllowlisted(file)) continue;
  const abs = path.join(repoRoot, file);
  let text;
  try {
    text = fs.readFileSync(abs, "utf8");
  } catch {
    continue;
  }
  if (IMPORT_RE.test(text)) {
    hits.push(file);
  }
}

if (hits.length > 0) {
  console.error("verify:no-map-in-switcher: FAIL — ArchetypeResultMap import outside allowlist:");
  for (const h of hits) {
    console.error(`  • ${h}`);
  }
  console.error(
    "\nAllowlist: src/components/archetype/**, app/archetype-map-fixture.tsx, and archetype unit tests only.",
  );
  process.exit(1);
}

console.log("verify:no-map-in-switcher: ok (no disallowed ArchetypeResultMap imports)");
