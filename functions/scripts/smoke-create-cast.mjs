/**
 * One-shot live createCast smoke (asia-east2).
 * Uses functions/.env.local service account + EXPO_PUBLIC_FIREBASE_API_KEY.
 * Clears any leftover smoke activeCast afterward.
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
const snap = await userRef.get();
if (!snap.exists) {
  console.error("user missing", uid);
  process.exit(1);
}
const data = snap.data() || {};
if (data.activeCast?.castId) {
  console.log("clearing existing activeCast for clean smoke", data.activeCast.castId);
  await userRef.update({ activeCast: admin.firestore.FieldValue.delete() });
}

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

const requestId = `smoke_createCast_${Date.now()}`;
const before = Date.now();
const callRes = await fetch("https://asia-east2-into-the-pond.cloudfunctions.net/createCast", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${tokenJson.idToken}`,
  },
  body: JSON.stringify({
    data: {
      rodType: "basic",
      baitUsed: "random_bait",
      requestId,
    },
  }),
});
const text = await callRes.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = { raw: text };
}
console.log("status", callRes.status);
console.log("body", JSON.stringify(body, null, 2));

const result = body.result ?? body;
const readyAt = result?.readyAt;
if (typeof readyAt !== "number") {
  console.error("SMOKE FAIL: no readyAt");
  process.exit(1);
}
const delta = readyAt - before;
const hours = delta / 3_600_000;
console.log("deltaMs", delta, "hours", hours.toFixed(4));
const ok = Math.abs(delta - 2 * 60 * 60 * 1000) < 60_000;
if (!ok) {
  console.error("SMOKE FAIL: readyAt not ~2h");
  process.exit(1);
}
console.log("SMOKE PASS: readyAt ≈ now + 2h");

await userRef.update({ activeCast: admin.firestore.FieldValue.delete() });
console.log("cleared smoke activeCast");
