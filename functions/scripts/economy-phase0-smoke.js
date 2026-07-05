/**
 * Phase 0 economy smoke — local gates + optional prod Firestore reconcile probe.
 *
 * Usage:
 *   npm run smoke:economy-phase0
 *   npm run smoke:economy-phase0:probe
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..");
const FUNCTIONS_DIR = path.join(ROOT, "functions");

function run(cmd, args, cwd = ROOT) {
  const result = spawnSync(cmd, args, { cwd, stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function assertLedgerOnlyEnvFile() {
  const envPath = path.join(FUNCTIONS_DIR, ".env.into-the-pond");
  if (!fs.existsSync(envPath)) {
    console.error("Missing functions/.env.into-the-pond with ECONOMY_LEDGER_ONLY=true");
    process.exit(1);
  }
  const envText = fs.readFileSync(envPath, "utf8");
  if (!/ECONOMY_LEDGER_ONLY\s*=\s*true/.test(envText)) {
    console.error("functions/.env.into-the-pond must set ECONOMY_LEDGER_ONLY=true");
    process.exit(1);
  }
  console.log("Phase 0: .env.into-the-pond OK (ECONOMY_LEDGER_ONLY=true)");
}

async function probeProd() {
  require("dotenv").config({ path: path.join(FUNCTIONS_DIR, ".env") });
  const admin = require("firebase-admin");
  if (admin.apps.length === 0) {
    const rawPath = (process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? "").trim();
    if (!rawPath || !fs.existsSync(rawPath)) {
      console.warn("Probe skipped: set FIREBASE_SERVICE_ACCOUNT_PATH in functions/.env");
      return;
    }
    const serviceAccount = JSON.parse(fs.readFileSync(rawPath, "utf8"));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  const { reconcileUser } = require(
    path.join(FUNCTIONS_DIR, "lib/sanctuary/economy/reconcileUser.js"),
  );
  const db = admin.firestore();
  const probeUid = "economy_phase0_probe";

  const userRef = db.collection("users").doc(probeUid);
  const existing = await userRef.get();
  if (!existing.exists) {
    await userRef.set({
      currentWonder: 0,
      storedWonder: 0,
      lifetimeWonderEarned: 0,
      totalWonder: 0,
      inventory: {
        parts: 0,
        baitMaterials: { feather: 0, scale: 0, glimmerdust: 0 },
        baits: { feather_bait: 0, scale_bait: 0, glimmerdust_bait: 0, random_bait: 0 },
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      economyPhase0Probe: true,
    });
    console.log(`Probe: created users/${probeUid}`);
  }

  const report = await reconcileUser(probeUid);
  console.log("Probe reconcile:", {
    uid: probeUid,
    ledgerEntryCount: report.ledgerEntryCount,
    hasDrift: report.hasDrift,
  });

  if (report.hasDrift) {
    console.error("Probe user has unexpected drift:", report.drift);
    process.exit(1);
  }
  console.log("Probe: hasDrift false");
}

assertLedgerOnlyEnvFile();
console.log("Phase 0: functions build (all economy tests)...");
run("npm", ["run", "build"], FUNCTIONS_DIR);

const args = process.argv.slice(2);
if (args.includes("--probe")) {
  probeProd()
    .then(() => console.log("Phase 0 smoke complete (local + prod probe)"))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  console.log("Phase 0 smoke complete (local). Use smoke:economy-phase0:probe after deploy.");
}
