/**
 * Live createCast → backdate readyAt → claimCast smoke (asia-east2).
 * Uses functions/.env.local service account + EXPO_PUBLIC_FIREBASE_API_KEY.
 *
 * Requires deployed claimCast with correlationId on fishing_claim ledger rows
 * (see applyFishingClaim.ts). Redeploy functions after that fix if smoke returns 500.
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const functionsDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(functionsDir, "..");

const dotenv = require("dotenv");
dotenv.config({ path: path.join(functionsDir, ".env.local") });
dotenv.config({ path: path.join(repoRoot, ".env.local") });
dotenv.config({ path: path.join(repoRoot, ".env") });

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
if (!keyPath) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_PATH");
  process.exit(1);
}
const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(repoRoot, keyPath);
const sa = JSON.parse(fs.readFileSync(resolved, "utf8"));
const admin = require("firebase-admin");
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
if (!apiKey) {
  console.error("Missing EXPO_PUBLIC_FIREBASE_API_KEY");
  process.exit(1);
}

const uid = process.env.SMOKE_UID || "8rvdWY8Z4OZUwdQTrUIytgfwJyk2";
const db = admin.firestore();
const userRef = db.collection("users").doc(uid);

function fishingClaimKey(castId) {
  return `fishing_claim:${castId}`;
}

function fishingClaimDocId(castId) {
  return `claim_${castId}`;
}

function idempotencyDocId(key) {
  const trimmed = key.trim();
  if (!trimmed) return "idem_empty";
  const sanitized = trimmed.replace(/[^a-zA-Z0-9._:-]/g, "_");
  if (sanitized.length <= 200) return sanitized;
  let hash = 5381;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash * 33) ^ trimmed.charCodeAt(i);
  }
  return `${sanitized.slice(0, 160)}_${(hash >>> 0).toString(36)}`;
}

function ledgerEntryIdForKey(idempotencyKey) {
  return `ledger_${idempotencyDocId(idempotencyKey)}`;
}

async function getIdToken() {
  const customToken = await admin.auth().createCustomToken(uid);
  const tokenRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  const tokenJson = await tokenRes.json();
  if (!tokenJson.idToken) {
    console.error("token exchange failed", tokenJson);
    process.exit(1);
  }
  return tokenJson.idToken;
}

async function callCallable(name, idToken, data = {}) {
  const callRes = await fetch(
    `https://asia-east2-into-the-pond.cloudfunctions.net/${name}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ data }),
    },
  );
  const text = await callRes.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { status: callRes.status, body };
}

const snap = await userRef.get();
if (!snap.exists) {
  console.error("user missing", uid);
  process.exit(1);
}

const existing = snap.data() || {};
if (existing.activeCast?.castId) {
  console.log("clearing existing activeCast for clean smoke", existing.activeCast.castId);
  await userRef.update({ activeCast: admin.firestore.FieldValue.delete() });
}

const idToken = await getIdToken();
const requestId = `smoke_claimCast_${Date.now()}`;
const createResult = await callCallable("createCast", idToken, {
  rodType: "basic",
  baitUsed: "random_bait",
  requestId,
});

console.log("createCast status", createResult.status);
console.log("createCast body", JSON.stringify(createResult.body, null, 2));

const createPayload = createResult.body.result ?? createResult.body;
const castId = createPayload?.castId;
if (!castId || typeof castId !== "string") {
  console.error("SMOKE FAIL: createCast missing castId");
  process.exit(1);
}

const pastReady = admin.firestore.Timestamp.fromMillis(Date.now() - 60_000);
await userRef.update({
  "activeCast.readyTimestamp": pastReady,
});
console.log("backdated activeCast.readyTimestamp for", castId);

const claimResult = await callCallable("claimCast", idToken, {});
console.log("claimCast status", claimResult.status);
console.log("claimCast body", JSON.stringify(claimResult.body, null, 2));

const claimPayload = claimResult.body.result ?? claimResult.body;
const claim = claimPayload?.claim;
if (claimResult.status !== 200 || !claimPayload?.success) {
  console.error("SMOKE FAIL: claimCast not successful");
  process.exit(1);
}

const validOutcomes = new Set(["catch", "duplicate", "miss"]);
if (!validOutcomes.has(claim?.outcome)) {
  console.error("SMOKE FAIL: unexpected outcome", claim?.outcome);
  process.exit(1);
}
if (typeof claim?.claimedAt !== "number" || claim.claimedAt <= 0) {
  console.error("SMOKE FAIL: missing claimedAt");
  process.exit(1);
}

const afterUser = await userRef.get();
const afterData = afterUser.data() || {};
if (afterData.activeCast?.castId) {
  console.error("SMOKE FAIL: activeCast still present after claim");
  process.exit(1);
}
if (afterData.lastClaimedCastId !== castId) {
  console.error(
    "SMOKE FAIL: lastClaimedCastId mismatch",
    afterData.lastClaimedCastId,
    "expected",
    castId,
  );
  process.exit(1);
}

const claimDoc = await userRef.collection("fishingClaims").doc(fishingClaimDocId(castId)).get();
if (!claimDoc.exists) {
  console.error("SMOKE FAIL: fishingClaims doc missing");
  process.exit(1);
}

console.log("SMOKE PASS: claimCast outcome =", claim.outcome, "castId =", castId);

// Optional cleanup so repeated smokes do not accumulate test claims in analytics.
const idempotencyKey = fishingClaimKey(castId);
await Promise.all([
  userRef.collection("fishingClaims").doc(fishingClaimDocId(castId)).delete(),
  userRef.collection("economyLedger").doc(ledgerEntryIdForKey(idempotencyKey)).delete(),
  userRef.collection("economyIdempotency").doc(idempotencyDocId(idempotencyKey)).delete(),
]);
console.log("cleaned up smoke claim artifacts (fishingClaims + ledger)");
