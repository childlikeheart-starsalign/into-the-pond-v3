/**
 * Invariant 10 — client must not persist fishing claims or grant duplicate compensation.
 * Run: node scripts/test-fishing-claim-invariant10.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const resolveDevFishingClaim = fs.readFileSync(
  path.join(root, "src/features/fishing/resolveDevFishingClaim.ts"),
  "utf8",
);

assert.match(resolveDevFishingClaim, /previewOnly:\s*true/);
assert.match(resolveDevFishingClaim, /resolveFishingClaimFromContext/);

for (const symbol of [
  "applyFishingClaim",
  "applyFishingClaimInTransaction",
  "commitEconomyAction",
]) {
  assert.doesNotMatch(resolveDevFishingClaim, new RegExp(symbol));
}

const fishingServerCast = fs.readFileSync(
  path.join(root, "src/features/fishing/fishingServerCast.ts"),
  "utf8",
);

assert.doesNotMatch(fishingServerCast, /grantDuplicateCompensation/);
assert.match(fishingServerCast, /claimCast/);
assert.doesNotMatch(fishingServerCast, /httpsCallable\([^)]*["']castClaim["']/);
assert.doesNotMatch(fishingServerCast, /requestCastClaim/);
assert.doesNotMatch(fishingServerCast, /@\/src\/services\/firebase\/castClaim/);

const srcRoot = path.join(root, "src");
function walkSrc(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSrc(full, files);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

for (const file of walkSrc(srcRoot)) {
  const rel = path.relative(root, file);
  assert.ok(!rel.endsWith("castClaim.ts"), `castClaim.ts must not exist: ${rel}`);
  const content = fs.readFileSync(file, "utf8");
  assert.doesNotMatch(content, /httpsCallable\([^)]*["']castClaim["']/);
  assert.doesNotMatch(content, /services\/firebase\/castClaim/);
  assert.doesNotMatch(content, /\brequestCastClaim\b/);
}

console.log("fishing claim invariant 10 client check OK");
