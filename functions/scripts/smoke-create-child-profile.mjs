/**
 * Live createChildProfile smoke against asia-east2.
 * Uses SMOKE_UID (default: first allowlisted dev uid) + service account custom token.
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const dotenv = require("dotenv");
dotenv.config({ path: path.join(root, "functions", ".env.local") });
dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config({ path: path.join(root, ".env") });

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
if (!keyPath) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_PATH");
  process.exit(1);
}
const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(root, keyPath);
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
const beforeSnap = await userRef.get();
if (!beforeSnap.exists) {
  console.error("user missing for configured SMOKE_UID");
  process.exit(1);
}
const before = beforeSnap.data() || {};
console.log("before childrenSummary length", (before.childrenSummary || []).length);
console.log("before activeChildId", before.activeChildId ?? null);

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

const draftId = `smoke_createChild_${randomUUID()}`;
const payload = {
  draftId,
  name: "Smoke Child",
  dob: "2018-06-15",
  companionId: "blackbird",
  interests: ["curious"],
};

const beforeMs = Date.now();
const callRes = await fetch(
  "https://asia-east2-into-the-pond.cloudfunctions.net/createChildProfile",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenJson.idToken}`,
    },
    body: JSON.stringify({ data: payload }),
  },
);
const elapsedMs = Date.now() - beforeMs;
const callJson = await callRes.json();
console.log("http", callRes.status, "elapsedMs", elapsedMs);
console.log(JSON.stringify(callJson, null, 2));

if (!callRes.ok || callJson.error) {
  process.exit(1);
}

const result = callJson.result ?? callJson.data ?? callJson;
const childId = result.childId;
if (!childId) {
  console.error("missing childId in response");
  process.exit(1);
}

const childSnap = await userRef.collection("children").doc(childId).get();
const afterSnap = await userRef.get();
const after = afterSnap.data() || {};
console.log("child exists", childSnap.exists);
console.log("child profileLocked", childSnap.data()?.profileLocked);
console.log("after childrenSummary", JSON.stringify(after.childrenSummary ?? null));
console.log("after activeChildId", after.activeChildId ?? null);

// Idempotent replay with same draftId
const replayRes = await fetch(
  "https://asia-east2-into-the-pond.cloudfunctions.net/createChildProfile",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenJson.idToken}`,
    },
    body: JSON.stringify({ data: payload }),
  },
);
const replayJson = await replayRes.json();
const replay = replayJson.result ?? replayJson.data ?? replayJson;
console.log("replay childId", replay.childId);
if (replay.childId !== childId) {
  console.error("idempotent replay returned different childId");
  process.exit(1);
}
console.log("SMOKE_OK");
