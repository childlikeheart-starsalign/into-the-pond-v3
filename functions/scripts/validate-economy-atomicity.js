/**
 * Invariant 4 — reject direct economy mutations outside commitEconomyAction.
 * Run: node functions/scripts/validate-economy-atomicity.js
 *
 * Intentionally out of scope: fishingWonderToday / dailyQuestionCount counter patches,
 * inventory.baits (consumables off-ledger; baitMaterials on ledger). See docs/economy-known-behaviors.md.
 */
const fs = require("fs");
const path = require("path");

const SRC_ROOT = path.join(__dirname, "..", "src");

const LEGACY_FN_ALLOWLIST = new Set([path.join(SRC_ROOT, "sanctuary", "wonderEconomy.ts")]);

const ECONOMY_FIELD_PATTERN =
  /\b(currentWonder|storedWonder|lifetimeWonderEarned|totalWonder|inventory)\s*:/;

const USER_REF_SET_ALLOWLIST = [
  "sanctuary/economy/commitEconomyAction.ts",
  "sanctuary/claimEncounter.ts",
  "sanctuary/createCastTransaction.ts",
  "sanctuary/progression/craftCallables.ts",
  "sanctuary/well/submitWellReflection.ts",
  "sanctuary/well/getOrAssignTodaysQuestion.ts",
  "index.ts",
];

function walkTsFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "economy" && dir.endsWith("sanctuary")) {
        walkTsFiles(full, files);
        continue;
      }
      if (entry.name === "lib") continue;
      walkTsFiles(full, files);
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      files.push(full);
    }
  }
  return files;
}

function relativeSrc(filePath) {
  return path.relative(SRC_ROOT, filePath).split(path.sep).join("/");
}

function isAllowedUserRefSet(relativePath, line) {
  if (!USER_REF_SET_ALLOWLIST.some((allowed) => relativePath.endsWith(allowed))) {
    return false;
  }
  if (relativePath.endsWith("claimEncounter.ts")) {
    return (
      line.includes("fishingWonderToday") ||
      line.includes("lastFishingResetDate") ||
      line.includes("dailyQuestionCount") ||
      line.includes("lastQuestionResetDate") ||
      line.includes("fishingResetPatch") ||
      line.includes("applyOperationalCounterResetsInTransaction") ||
      line.includes("buildOperationalCounterResetPatch")
    );
  }
  if (relativePath.endsWith("createCastTransaction.ts")) {
    return (
      line.includes("applyOperationalCounterResetsInTransaction") ||
      line.includes("buildOperationalCounterResetPatch") ||
      line.includes("fishingWonderToday") ||
      line.includes("dailyQuestionCount")
    );
  }
  if (
    relativePath.endsWith("well/submitWellReflection.ts") ||
    relativePath.endsWith("well/getOrAssignTodaysQuestion.ts")
  ) {
    return line.includes("applyOperationalCounterResetsInTransaction");
  }
  if (relativePath.endsWith("craftCallables.ts")) {
    return line.includes("equippedRodId");
  }
  if (relativePath.endsWith("index.ts")) {
    return (
      line.includes("activeCast") || line.includes("subscription") || line.includes("activeRod")
    );
  }
  return relativePath.endsWith("commitEconomyAction.ts");
}

function validateLegacyCalls(files) {
  const violations = [];
  const patterns = ["earnWonder(", "spendCurrentWonder(", "persistWonderTransaction("];

  for (const file of files) {
    if (LEGACY_FN_ALLOWLIST.has(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    const rel = relativeSrc(file);
    for (const pattern of patterns) {
      if (content.includes(pattern)) {
        violations.push(`${rel}: calls deprecated ${pattern.slice(0, -1)}`);
      }
    }
  }
  return violations;
}

function validateDirectUserEconomyPatches(files) {
  const violations = [];

  for (const file of files) {
    const rel = relativeSrc(file);
    if (rel.endsWith("sanctuary/economy/commitEconomyAction.ts")) continue;
    if (rel.includes("/economy/") && !rel.endsWith(".test.ts")) {
      if (rel.endsWith("applyLedgerEntry.ts") || rel.endsWith("projectEconomyCommit.ts")) continue;
    }

    const lines = fs.readFileSync(file, "utf8").split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const isUserSet =
        line.includes("tx.set(userRef") ||
        line.includes("tx.set( userRef") ||
        /\.collection\("users"\)\.doc\([^)]+\)\.set\(/.test(line);

      if (!isUserSet) continue;
      if (!ECONOMY_FIELD_PATTERN.test(line)) {
        const block = lines.slice(i, Math.min(i + 12, lines.length)).join("\n");
        if (!ECONOMY_FIELD_PATTERN.test(block)) continue;
      }

      if (!isAllowedUserRefSet(rel, line + lines.slice(i + 1, i + 8).join(" "))) {
        violations.push(`${rel}:${i + 1}: direct user economy patch outside commitEconomyAction`);
      }
    }
  }
  return violations;
}

const files = walkTsFiles(SRC_ROOT);
const violations = [...validateLegacyCalls(files), ...validateDirectUserEconomyPatches(files)];

if (violations.length > 0) {
  console.error("Economy atomicity validation failed:\n");
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}

console.log(`Economy atomicity OK (${files.length} source files scanned)`);
