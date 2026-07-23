/**
 * Backfill economyLedger rows from legacy wonderTransactions and fishingClaims.
 *
 * Default: dry-run. Writes ledger docs only — does not mutate user balance snapshots.
 * Fishing wonderTx rows are skipped when fishingClaims or live fishing_claim ledger rows exist.
 *
 * Usage:
 *   node functions/scripts/backfill-economy-ledger-from-wonder-tx.js [--uid=UID] [--limit=N] [--offset=N] [--commit]
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_PATH or default Admin credentials.
 */
const path = require("path");

const FISHING_WONDER_SOURCES = new Set([
  "fishing_catch",
  "fishing_miss_consolation",
  "fishing_duplicate_consolation",
  "fishing_pool_complete_bonus",
]);

function ledgerEntryIdForKey(idempotencyKey) {
  const trimmed = idempotencyKey.trim();
  const sanitized = trimmed.replace(/[^a-zA-Z0-9._:-]/g, "_");
  let hash = 5381;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash * 33) ^ trimmed.charCodeAt(i);
  }
  const hashSuffix = (hash >>> 0).toString(36);
  const docId = sanitized.length <= 200 ? sanitized : `${sanitized.slice(0, 160)}_${hashSuffix}`;
  return `ledger_${docId}`;
}

function legacyWonderKey(transactionId) {
  return `legacy_wonder_tx:${transactionId}`;
}

function fishingClaimKey(castId) {
  return `fishing_claim:${castId}`;
}

function wonderDeltasFromLegacyTx(txDoc) {
  const amount = Number(txDoc.amount ?? 0);
  const pool = txDoc.metadata?.pool;
  if (amount >= 0) {
    return { deltaCurrentWonder: amount, deltaStoredWonder: amount };
  }
  if (pool === "stored") {
    return { deltaCurrentWonder: 0, deltaStoredWonder: amount };
  }
  return { deltaCurrentWonder: amount, deltaStoredWonder: 0 };
}

function deriveCastIdFromWonderTransaction(txDoc) {
  const metadata = txDoc.metadata ?? {};
  if (typeof metadata.castId === "string" && metadata.castId.trim() !== "") {
    return metadata.castId.trim();
  }
  if (typeof txDoc.correlationId === "string" && txDoc.correlationId.trim() !== "") {
    return txDoc.correlationId.trim();
  }
  return null;
}

function shouldSkipWonderTransactionForBackfill(txDoc, existingLedgerIds, fishingCastIds) {
  const source = txDoc.source ?? "";
  if (FISHING_WONDER_SOURCES.has(source)) {
    return true;
  }
  if (txDoc.actionType === "fishing_claim") {
    return true;
  }

  const castId = deriveCastIdFromWonderTransaction(txDoc);
  if (castId) {
    if (fishingCastIds.has(castId)) {
      return true;
    }
    const claimLedgerId = ledgerEntryIdForKey(fishingClaimKey(castId));
    if (existingLedgerIds.has(claimLedgerId)) {
      return true;
    }
  }

  return false;
}

function synthesizeWonderTransactionEntry(uid, txDoc) {
  const transactionId = txDoc.id;
  const idempotencyKey = txDoc.idempotencyKey ?? legacyWonderKey(transactionId);
  const { deltaCurrentWonder, deltaStoredWonder } = wonderDeltasFromLegacyTx(txDoc);
  const timestamp =
    typeof txDoc.timestamp?.toMillis === "function"
      ? txDoc.timestamp.toMillis()
      : Number(txDoc.timestamp ?? Date.now());

  return {
    id: ledgerEntryIdForKey(idempotencyKey),
    uid,
    timestamp,
    actionType: txDoc.actionType ?? "compensation",
    source: txDoc.source ?? "economy_compensation",
    deltaCurrentWonder,
    deltaStoredWonder,
    deltaParts: 0,
    deltaMaterials: {},
    idempotencyKey,
    metadata: {
      ...(txDoc.metadata ?? {}),
      migratedFromWonderTransactionId: transactionId,
      wonderTransactionId: transactionId,
      backfilled: true,
      sourceCollection: "wonderTransactions",
    },
    schemaVersion: 1,
  };
}

function fishingWonderSource(outcome) {
  if (outcome === "duplicate") return "fishing_duplicate_consolation";
  if (outcome === "miss") return "fishing_miss_consolation";
  return "fishing_catch";
}

function synthesizeFishingClaimEntry(uid, claimDoc) {
  const claim = claimDoc.data ?? claimDoc;
  const claimId = claimDoc.id ?? claim.id;
  const castId = claim.castId ?? claim.metadata?.castId ?? null;
  const idempotencyKey = castId ? fishingClaimKey(castId) : `backfill:claim:${claimId}`;
  const wonderAwarded = Number(claim.wonderAwarded ?? 0);
  const materials = Number(claim.materialsAwarded ?? 0);
  const timestamp =
    typeof claim.claimedAt?.toMillis === "function"
      ? claim.claimedAt.toMillis()
      : Number(claim.claimedAt ?? Date.now());
  const outcome = claim.outcome ?? "catch";
  const source = fishingWonderSource(outcome);

  return {
    id: ledgerEntryIdForKey(idempotencyKey),
    uid,
    timestamp,
    actionType: "fishing_claim",
    source,
    deltaCurrentWonder: wonderAwarded,
    deltaStoredWonder: wonderAwarded,
    deltaParts: 0,
    deltaMaterials: materials > 0 ? { feather: materials } : {},
    idempotencyKey,
    metadata: {
      claimId,
      outcome,
      creatureTypeId: claim.creatureTypeId ?? null,
      duplicate: outcome === "duplicate",
      wonderTransactionId: `tx_${claimId}`,
      backfilled: true,
      sourceCollection: "fishingClaims",
      ...(castId ? { castId } : {}),
    },
    schemaVersion: 1,
  };
}

function collectFishingCastIdFromClaim(claimData) {
  const castId = claimData.castId ?? claimData.metadata?.castId ?? null;
  return typeof castId === "string" && castId.trim() !== "" ? castId.trim() : null;
}

async function backfillUser(userDoc, commit) {
  const uid = userDoc.id;
  const stats = { scanned: 0, created: 0, skipped: 0, errors: 0 };

  const fishingCastIds = new Set();
  const existingLedgerIds = new Set();

  const claimsSnap = await userDoc.ref.collection("fishingClaims").get();
  for (const claimDoc of claimsSnap.docs) {
    stats.scanned += 1;
    const castId = collectFishingCastIdFromClaim(claimDoc.data() ?? {});
    if (castId) fishingCastIds.add(castId);

    try {
      const entry = synthesizeFishingClaimEntry(uid, { id: claimDoc.id, data: claimDoc.data() });
      existingLedgerIds.add(entry.id);
      const ledgerRef = userDoc.ref.collection("economyLedger").doc(entry.id);
      const existing = await ledgerRef.get();
      if (existing.exists) {
        stats.skipped += 1;
        continue;
      }
      stats.created += 1;
      console.log(
        `[${commit ? "COMMIT" : "DRY-RUN"}] ${uid} fishingClaim=${claimDoc.id} -> ledger=${entry.id}`,
      );
      if (commit) await ledgerRef.set(entry);
    } catch (error) {
      stats.errors += 1;
      console.error(`[ERROR] ${uid} fishingClaim=${claimDoc.id}:`, error);
    }
  }

  const ledgerSnap = await userDoc.ref.collection("economyLedger").get();
  for (const ledgerDoc of ledgerSnap.docs) {
    existingLedgerIds.add(ledgerDoc.id);
  }

  const txSnap = await userDoc.ref.collection("wonderTransactions").get();
  for (const txDoc of txSnap.docs) {
    stats.scanned += 1;
    const txData = { id: txDoc.id, ...txDoc.data() };

    if (shouldSkipWonderTransactionForBackfill(txData, existingLedgerIds, fishingCastIds)) {
      stats.skipped += 1;
      continue;
    }

    try {
      const entry = synthesizeWonderTransactionEntry(uid, txData);
      if (existingLedgerIds.has(entry.id)) {
        stats.skipped += 1;
        continue;
      }
      existingLedgerIds.add(entry.id);
      const ledgerRef = userDoc.ref.collection("economyLedger").doc(entry.id);
      const existing = await ledgerRef.get();
      if (existing.exists) {
        stats.skipped += 1;
        continue;
      }
      stats.created += 1;
      console.log(
        `[${commit ? "COMMIT" : "DRY-RUN"}] ${uid} wonderTx=${txDoc.id} -> ledger=${entry.id}`,
      );
      if (commit) await ledgerRef.set(entry);
    } catch (error) {
      stats.errors += 1;
      console.error(`[ERROR] ${uid} wonderTx=${txDoc.id}:`, error);
    }
  }

  return stats;
}

function initializeFirebaseAdmin(admin) {
  if (admin.apps.length > 0) return;

  const rawPath = (process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? "").trim();
  const isPlaceholder =
    rawPath === "" ||
    rawPath === "..." ||
    rawPath.startsWith("<") ||
    rawPath.includes("/absolute/path/to/");

  if (!isPlaceholder) {
    const fs = require("fs");
    if (!fs.existsSync(rawPath)) {
      console.error(`FIREBASE_SERVICE_ACCOUNT_PATH file not found: ${rawPath}`);
      console.error(
        "Set the real JSON path in functions/.env.local (see .env.example) or export FIREBASE_SERVICE_ACCOUNT_PATH before running.",
      );
      process.exit(1);
    }
    const serviceAccount = JSON.parse(fs.readFileSync(rawPath, "utf8"));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log(
      `Firebase Admin: service account (${path.basename(rawPath)}) project=${serviceAccount.project_id}`,
    );
    return;
  }

  if (rawPath === "..." || rawPath.startsWith("<")) {
    console.error(
      "FIREBASE_SERVICE_ACCOUNT_PATH is a documentation placeholder, not a real file path.",
    );
    console.error(
      "Copy functions/.env.example to functions/.env.local and set FIREBASE_SERVICE_ACCOUNT_PATH to your service account JSON.",
    );
    process.exit(1);
  }

  console.log(
    "Firebase Admin: Application Default Credentials (no FIREBASE_SERVICE_ACCOUNT_PATH in .env)",
  );
  admin.initializeApp();
}

async function assertFirestoreAccessible(db, projectId) {
  try {
    await db.collection("users").limit(1).get();
  } catch (error) {
    const code = error?.code;
    if (code === 5 || code === "NOT_FOUND") {
      console.error(`\nFirestore is not available for project "${projectId}" (gRPC NOT_FOUND).`);
      console.error(
        "This usually means the Firestore database was never created, or the project id is wrong.",
      );
      console.error(
        "Note: Realtime Database (RTDB) is a separate product — creating RTDB does not create Firestore.",
      );
      console.error("");
      console.error("Fix:");
      console.error(
        "  1. Open Firebase Console → Build → Firestore Database → Create database (Native mode).",
      );
      console.error(`     https://console.firebase.google.com/project/${projectId}/firestore`);
      console.error(
        `  2. Confirm project id matches EXPO_PUBLIC_FIREBASE_PROJECT_ID (${projectId}).`,
      );
      console.error(
        "  3. Confirm FIREBASE_SERVICE_ACCOUNT_PATH points at a key from the same Firebase project.",
      );
      console.error("");
      process.exit(1);
    }
    throw error;
  }
}

function resolveAdminProjectId(admin) {
  const app = admin.app();
  if (app.options.projectId) return app.options.projectId;
  const rawPath = (process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? "").trim();
  if (rawPath && require("fs").existsSync(rawPath)) {
    return JSON.parse(require("fs").readFileSync(rawPath, "utf8")).project_id;
  }
  return "(unknown)";
}

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes("--commit");
  const uidArg = args.find((a) => a.startsWith("--uid="));
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const offsetArg = args.find((a) => a.startsWith("--offset="));
  const filterUid = uidArg ? uidArg.split("=")[1] : null;
  const limit = limitArg ? Number(limitArg.split("=")[1]) : null;
  const offset = offsetArg ? Number(offsetArg.split("=")[1]) : 0;

  require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
  const admin = require("firebase-admin");

  initializeFirebaseAdmin(admin);

  const db = admin.firestore();
  const projectId = resolveAdminProjectId(admin);
  await assertFirestoreAccessible(db, projectId);

  let usersQuery = db.collection("users");
  if (filterUid) {
    usersQuery = usersQuery.where(admin.firestore.FieldPath.documentId(), "==", filterUid);
  }

  const usersSnap = await usersQuery.get();
  let userDocs = usersSnap.docs;
  if (offset > 0) userDocs = userDocs.slice(offset);
  if (limit != null && Number.isFinite(limit)) userDocs = userDocs.slice(0, limit);

  const totals = { scanned: 0, created: 0, skipped: 0, errors: 0, users: userDocs.length };

  for (const userDoc of userDocs) {
    const stats = await backfillUser(userDoc, commit);
    totals.scanned += stats.scanned;
    totals.created += stats.created;
    totals.skipped += stats.skipped;
    totals.errors += stats.errors;
    console.log(
      `User ${userDoc.id}: scanned=${stats.scanned} created=${stats.created} skipped=${stats.skipped} errors=${stats.errors}`,
    );
  }

  console.log(
    `Backfill complete: users=${totals.users} scanned=${totals.scanned} created=${totals.created} skipped=${totals.skipped} errors=${totals.errors} mode=${commit ? "commit" : "dry-run"}`,
  );
}

module.exports = {
  FISHING_WONDER_SOURCES,
  ledgerEntryIdForKey,
  fishingClaimKey,
  deriveCastIdFromWonderTransaction,
  shouldSkipWonderTransactionForBackfill,
  synthesizeWonderTransactionEntry,
  synthesizeFishingClaimEntry,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
