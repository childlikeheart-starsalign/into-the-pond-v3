/**
 * Seed / update Firestore allowlist feature flags (Admin SDK).
 *
 * Usage (from repo root, uses functions/.env.local):
 *   node --import tsx functions/scripts/seed-feature-flags.mjs --state=allowlist --uids=UID1,UID2
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

const dotenv = require("dotenv");
dotenv.config({ path: path.join(root, "functions", ".env.local") });
dotenv.config({ path: path.join(root, ".env.local") });

const FEATURE_FLAG_NAMES = {
  childMigrationDualRead: "childMigrationDualRead",
  createChildProfileUi: "createChildProfileUi",
};

function parseArgs(argv) {
  let state = "off";
  let uids = [];
  for (const arg of argv) {
    if (arg.startsWith("--state=")) {
      const value = arg.slice("--state=".length);
      if (value !== "off" && value !== "allowlist" && value !== "all") {
        throw new Error(`Invalid --state=${value}`);
      }
      state = value;
    }
    if (arg.startsWith("--uids=")) {
      uids = arg
        .slice("--uids=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return { state, uids };
}

const { state, uids } = parseArgs(process.argv.slice(2));
if (state === "allowlist" && uids.length === 0) {
  console.error("allowlist requires --uids=...");
  process.exit(1);
}

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
if (!keyPath) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT_PATH in functions/.env.local");
  process.exit(1);
}
const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(root, keyPath);
const sa = JSON.parse(fs.readFileSync(resolved, "utf8"));
const admin = require("firebase-admin");
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    projectId: "into-the-pond",
  });
}

const db = admin.firestore();
const payload = {
  rolloutState: state,
  allowlistUids: state === "allowlist" ? uids : [],
  updatedAt: new Date().toISOString(),
};

for (const flagName of Object.values(FEATURE_FLAG_NAMES)) {
  await db.collection("featureFlags").doc(flagName).set(payload, { merge: true });
  const snap = await db.collection("featureFlags").doc(flagName).get();
  console.log(`Wrote featureFlags/${flagName}`);
  console.log(JSON.stringify(snap.data(), null, 2));
}
