/**
 * Invariant 10 — fishing claim single-commit path; no split duplicate compensation.
 * Run: node functions/scripts/validate-invariant10-fishing-claim.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(SCRIPT_DIR, "..", "..");

const SCAN_ROOTS = [
  path.join(REPO_ROOT, "functions", "src"),
  path.join(REPO_ROOT, "src"),
  path.join(REPO_ROOT, "shared"),
];

const APPLY_FISHING_CLAIM = path.join(
  REPO_ROOT,
  "functions",
  "src",
  "sanctuary",
  "applyFishingClaim.ts",
);
const CLAIM_ENCOUNTER = path.join(
  REPO_ROOT,
  "functions",
  "src",
  "sanctuary",
  "claimEncounter.ts",
);
const DEV_PREVIEW = path.join(
  REPO_ROOT,
  "src",
  "features",
  "fishing",
  "resolveDevFishingClaim.ts",
);

const BANNED_SYMBOL = "grantDuplicateCompensation";

function shouldSkipDir(fullPath) {
  const rel = path.relative(REPO_ROOT, fullPath).replace(/\\/g, "/");
  if (rel.startsWith("docs/handoff")) return true;
  return false;
}

function walkSourceFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "lib" || entry.name === "node_modules") continue;
      if (shouldSkipDir(full)) continue;
      walkSourceFiles(full, files);
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name) && !entry.name.endsWith(".test.ts")) {
      files.push(full);
    }
  }

  return files;
}

function relativeRepo(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}

function validateNoGrantDuplicateCompensation(files) {
  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    if (content.includes(BANNED_SYMBOL)) {
      violations.push(`${relativeRepo(file)}: contains "${BANNED_SYMBOL}"`);
    }
  }

  return violations;
}

function validateSingleCommitPath() {
  const content = fs.readFileSync(APPLY_FISHING_CLAIM, "utf8");
  const matches = content.match(/commitEconomyAction\s*\(/g);
  const count = matches ? matches.length : 0;

  if (count !== 1) {
    return [
      `applyFishingClaim.ts: expected exactly 1 commitEconomyAction( call, found ${count}`,
    ];
  }

  return [];
}

function validateDevPreviewIsolation() {
  const content = fs.readFileSync(DEV_PREVIEW, "utf8");
  const banned = ["applyFishingClaim", "commitEconomyAction", "applyFishingClaimInTransaction"];
  const violations = [];

  for (const symbol of banned) {
    if (content.includes(symbol)) {
      violations.push(`resolveDevFishingClaim.ts: must not reference "${symbol}"`);
    }
  }

  return violations;
}

function validateNoSplitDuplicateCompensation() {
  const violations = [];

  for (const file of [APPLY_FISHING_CLAIM, CLAIM_ENCOUNTER]) {
    const rel = relativeRepo(file);
    const content = fs.readFileSync(file, "utf8");

    if (content.includes("grantDuplicate")) {
      violations.push(`${rel}: contains "grantDuplicate"`);
    }

    const hasCompensation = /actionType:\s*["']compensation["']/.test(content);
    const hasDuplicateFishing =
      content.includes("fishing_duplicate") ||
      /outcome\s*===\s*["']duplicate["']/.test(content);

    if (hasCompensation && hasDuplicateFishing) {
      violations.push(
        `${rel}: actionType "compensation" combined with fishing duplicate logic`,
      );
    }
  }

  return violations;
}

function validateStage1Helpers() {
  const content = fs.readFileSync(APPLY_FISHING_CLAIM, "utf8");
  const hasWonderSource = content.includes("fishingClaimWonderSource");
  const hasCatchSource = content.includes("fishing_catch");

  if (!hasWonderSource && !hasCatchSource) {
    return [
      "applyFishingClaim.ts: missing fishingClaimWonderSource or fishing_catch source mapping",
    ];
  }

  return [];
}

function validateAnalyticsDuplicateTag() {
  const content = fs.readFileSync(APPLY_FISHING_CLAIM, "utf8");
  if (!content.includes('duplicate: claim.outcome === "duplicate"')) {
    return [
      'applyFishingClaim.ts: sanctuaryAnalytics must include duplicate: claim.outcome === "duplicate"',
    ];
  }

  return [];
}

function validateNoHelpersImportInFunctions() {
  const functionsRoot = path.join(REPO_ROOT, "functions", "src");
  const violations = [];

  for (const file of walkSourceFiles(functionsRoot)) {
    const content = fs.readFileSync(file, "utf8");
    if (
      /data\/creatures\/helpers/.test(content) ||
      /creatures\/helpers/.test(content)
    ) {
      violations.push(
        `${relativeRepo(file)}: must not import data/creatures/helpers (use encounterEngine.ts)`,
      );
    }
  }

  return violations;
}

function validateNoCastClaimCallable() {
  const indexPath = path.join(REPO_ROOT, "functions", "src", "index.ts");
  const content = fs.readFileSync(indexPath, "utf8");
  const violations = [];

  if (/export\s+const\s+castClaim\b/.test(content)) {
    violations.push("functions/src/index.ts: castClaim callable must not be exported");
  }
  if (/["']castClaim["']/.test(content)) {
    violations.push('functions/src/index.ts: must not reference "castClaim" callable name');
  }

  return violations;
}

const scannedFiles = SCAN_ROOTS.flatMap((root) => walkSourceFiles(root));
const violations = [
  ...validateNoGrantDuplicateCompensation(scannedFiles),
  ...validateSingleCommitPath(),
  ...validateDevPreviewIsolation(),
  ...validateNoSplitDuplicateCompensation(),
  ...validateStage1Helpers(),
  ...validateAnalyticsDuplicateTag(),
  ...validateNoHelpersImportInFunctions(),
  ...validateNoCastClaimCallable(),
];

if (violations.length > 0) {
  console.error("Invariant 10 fishing claim validation failed:\n");
  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  process.exit(1);
}

console.log("Invariant 10 fishing claim validation passed");
