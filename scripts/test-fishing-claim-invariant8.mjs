/**
 * Invariant 8 — client must not send castId on claimCast (server-authoritative).
 * Run: node scripts/test-fishing-claim-invariant8.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const fishingServerCast = fs.readFileSync(
  path.join(root, "src/features/fishing/fishingServerCast.ts"),
  "utf8",
);

assert.match(fishingServerCast, /claimCast\(uid,\s*\{\s*\}\)/);
assert.doesNotMatch(fishingServerCast, /claimCast\([^)]*castId/);

console.log("fishing claim invariant 8 client check OK");
