/**
 * Seed / update Firestore allowlist feature flags (Admin SDK).
 *
 * Usage (requires FIREBASE_SERVICE_ACCOUNT_PATH in functions/.env.local for real writes):
 *   npx tsx scripts/seed-feature-flags.ts --flag=createChildProfileUi --state=off
 *   npx tsx scripts/seed-feature-flags.ts --flag=createChildProfileUi --state=off --dry-run
 *   npx tsx scripts/seed-feature-flags.ts --flag=createChildProfileUi --state=allowlist --uids=UID1
 *   npx tsx scripts/seed-feature-flags.ts --all-flags-confirm --state=off
 *
 * Do NOT add real user UIDs without explicit confirmation.
 * Bulk updates require --all-flags-confirm. Prefer --flag=<name> for single flags.
 *
 * Real writes resolve firebase-admin from functions/node_modules when needed.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { FEATURE_FLAG_NAMES } from "../shared/featureFlags/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const name of ["functions/.env.local", ".env.local"] as const) {
  const envPath = path.join(root, name);
  if (!fs.existsSync(envPath)) continue;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("dotenv").config({ path: envPath });
  } catch {
    /* optional */
  }
}

type RolloutState = "off" | "allowlist" | "all";

const VALID_FLAG_NAMES = Object.values(FEATURE_FLAG_NAMES);

function listValidFlags(): string {
  return VALID_FLAG_NAMES.map((n) => `  • ${n}`).join("\n");
}

function parseArgs(argv: string[]) {
  let state: RolloutState = "off";
  let uids: string[] = [];
  let flag: string | null = null;
  let allFlagsConfirm = false;
  let dryRun = false;

  for (const arg of argv) {
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--all-flags-confirm") {
      allFlagsConfirm = true;
      continue;
    }
    if (arg.startsWith("--flag=")) {
      flag = arg.slice("--flag=".length).trim();
      continue;
    }
    if (arg.startsWith("--state=")) {
      const value = arg.slice("--state=".length);
      if (value !== "off" && value !== "allowlist" && value !== "all") {
        throw new Error(`Invalid --state=${value}`);
      }
      state = value;
      continue;
    }
    if (arg.startsWith("--uids=")) {
      uids = arg
        .slice("--uids=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return { state, uids, flag, allFlagsConfirm, dryRun };
}

function resolveFlagNames(flag: string | null, allFlagsConfirm: boolean): string[] {
  if (flag && allFlagsConfirm) {
    throw new Error("Pass either --flag=<name> or --all-flags-confirm, not both");
  }
  if (allFlagsConfirm) {
    return [...VALID_FLAG_NAMES];
  }
  if (!flag) {
    throw new Error(
      `Missing --flag=<name> (or --all-flags-confirm for bulk).\nValid names:\n${listValidFlags()}`,
    );
  }
  if (!VALID_FLAG_NAMES.includes(flag as (typeof VALID_FLAG_NAMES)[number])) {
    throw new Error(`Unknown flag "${flag}".\nValid names:\n${listValidFlags()}`);
  }
  return [flag];
}

async function main() {
  const { state, uids, flag, allFlagsConfirm, dryRun } = parseArgs(process.argv.slice(2));
  if (state === "allowlist" && uids.length === 0) {
    throw new Error("allowlist requires --uids=...");
  }

  const flagNames = resolveFlagNames(flag, allFlagsConfirm);

  const payload = {
    rolloutState: state,
    allowlistUids: state === "allowlist" ? uids : [],
    updatedAt: new Date().toISOString(),
  };

  if (dryRun) {
    console.log("DRY RUN — no Firestore writes");
    for (const flagName of flagNames) {
      console.log(`Would write featureFlags/${flagName}`);
      console.log(JSON.stringify(payload, null, 2));
    }
    return;
  }

  const functionsRequire = createRequire(path.join(root, "functions/package.json"));
  const { cert, initializeApp } = functionsRequire("firebase-admin/app") as typeof import("firebase-admin/app");
  const { getFirestore } = functionsRequire("firebase-admin/firestore") as typeof import("firebase-admin/firestore");

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!keyPath) {
    throw new Error("Set FIREBASE_SERVICE_ACCOUNT_PATH in functions/.env.local");
  }
  const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(root, keyPath);
  const serviceAccount = JSON.parse(fs.readFileSync(resolved, "utf8")) as object;
  initializeApp({
    credential: cert(serviceAccount),
    projectId: "into-the-pond",
  });
  const db = getFirestore();

  for (const flagName of flagNames) {
    await db.collection("featureFlags").doc(flagName).set(payload, { merge: true });
    const snap = await db.collection("featureFlags").doc(flagName).get();
    console.log(`Wrote featureFlags/${flagName}`);
    console.log(JSON.stringify(snap.data(), null, 2));
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
