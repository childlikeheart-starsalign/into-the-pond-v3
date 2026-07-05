"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledEconomyLedgerCompaction = exports.adminCompactEconomyLedgerCallable = void 0;
exports.compactEconomyLedgerForUser = compactEconomyLedgerForUser;
const firebase_functions_1 = require("firebase-functions");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const init_1 = require("../../init");
const compactionConstants_1 = require("./compactionConstants");
const foldLedger_1 = require("./foldLedger");
const reconcileUser_1 = require("./reconcileUser");
const types_1 = require("./types");
const assertEconomyAdmin_1 = require("./assertEconomyAdmin");
function projectionsMatch(a, b) {
  return (
    a.currentWonder === b.currentWonder &&
    a.storedWonder === b.storedWonder &&
    a.lifetimeWonderEarned === b.lifetimeWonderEarned &&
    a.parts === b.parts &&
    a.baitMaterials.feather === b.baitMaterials.feather &&
    a.baitMaterials.scale === b.baitMaterials.scale &&
    a.baitMaterials.glimmerdust === b.baitMaterials.glimmerdust
  );
}
/** Admin/scheduled compaction — writes checkpoint only; ledger rows stay append-only. */
async function compactEconomyLedgerForUser(uid, options) {
  const keepTail = options?.keepTailEntries ?? compactionConstants_1.COMPACT_KEEP_TAIL_ENTRIES;
  const minTotal = options?.minTotalEntries ?? compactionConstants_1.COMPACT_WHEN_TOTAL_ENTRIES;
  const compactedBy = options?.compactedBy ?? "admin";
  const userRef = init_1.db.collection("users").doc(uid);
  const ledgerSnap = await userRef.collection("economyLedger").orderBy("timestamp", "asc").get();
  const sorted = (0, foldLedger_1.sortLedgerEntriesByTimestamp)(
    ledgerSnap.docs.map((doc) => doc.data()),
  );
  if (sorted.length < minTotal) {
    return {
      uid,
      skipped: true,
      reason: "below_threshold",
      ledgerEntryCount: sorted.length,
    };
  }
  const checkpoint = (0, foldLedger_1.buildCheckpointFromSortedEntries)(
    sorted,
    keepTail,
    compactedBy,
  );
  if (!checkpoint) {
    return {
      uid,
      skipped: true,
      reason: "insufficient_entries",
      ledgerEntryCount: sorted.length,
    };
  }
  const tail = sorted.slice(checkpoint.foldedEntryCount);
  const fromCheckpoint = (0, foldLedger_1.projectionFromCheckpointAndEntries)(checkpoint, tail);
  const fromFull = (0, foldLedger_1.projectionFromLedgerEntries)(sorted);
  if (!projectionsMatch(fromCheckpoint, fromFull)) {
    throw new Error(`Checkpoint fold mismatch for user ${uid}`);
  }
  const reconcileReport = await (0, reconcileUser_1.reconcileUser)(uid);
  if (reconcileReport.hasDrift) {
    throw new Error(`Refusing compaction for user ${uid}: user doc drift detected`);
  }
  if (options?.dryRun) {
    return {
      uid,
      skipped: false,
      dryRun: true,
      ledgerEntryCount: sorted.length,
      foldedEntryCount: checkpoint.foldedEntryCount,
      tailEntryCount: tail.length,
    };
  }
  await userRef
    .collection("economyLedgerCheckpoint")
    .doc(types_1.ECONOMY_LEDGER_CHECKPOINT_DOC_ID)
    .set(checkpoint);
  return {
    uid,
    skipped: false,
    ledgerEntryCount: sorted.length,
    foldedEntryCount: checkpoint.foldedEntryCount,
    tailEntryCount: tail.length,
  };
}
exports.adminCompactEconomyLedgerCallable = (0, https_1.onCall)(async (request) => {
  (0, assertEconomyAdmin_1.assertEconomyAdminOrThrow)(request.auth?.uid, request.auth?.token);
  const data = request.data;
  const { targetUid, keepTailEntries, dryRun } = data;
  if (!targetUid || typeof targetUid !== "string") {
    throw new https_1.HttpsError("invalid-argument", "targetUid is required");
  }
  try {
    return await compactEconomyLedgerForUser(targetUid, {
      keepTailEntries,
      dryRun: dryRun === true,
      compactedBy: "admin",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new https_1.HttpsError("failed-precondition", message);
  }
});
const USER_BATCH_SIZE = 50;
/** Proactively compact users whose ledger exceeds COMPACT_WHEN_TOTAL_ENTRIES. */
exports.scheduledEconomyLedgerCompaction = (0, scheduler_1.onSchedule)(
  "every 24 hours",
  async () => {
    const usersSnap = await init_1.db.collection("users").select().get();
    let compacted = 0;
    let skipped = 0;
    let errors = 0;
    for (let i = 0; i < usersSnap.docs.length; i += USER_BATCH_SIZE) {
      const batch = usersSnap.docs.slice(i, i + USER_BATCH_SIZE);
      await Promise.all(
        batch.map(async (userDoc) => {
          try {
            const countSnap = await userDoc.ref.collection("economyLedger").count().get();
            const ledgerCount = countSnap.data().count;
            if (ledgerCount < compactionConstants_1.COMPACT_WHEN_TOTAL_ENTRIES) {
              skipped += 1;
              return;
            }
            const result = await compactEconomyLedgerForUser(userDoc.id, {
              compactedBy: "scheduled",
            });
            if (result.skipped) {
              skipped += 1;
            } else {
              compacted += 1;
              firebase_functions_1.logger.info(
                "scheduledEconomyLedgerCompaction wrote checkpoint",
                result,
              );
            }
          } catch (error) {
            errors += 1;
            firebase_functions_1.logger.warn("scheduledEconomyLedgerCompaction skipped user", {
              uid: userDoc.id,
              error,
            });
          }
        }),
      );
    }
    firebase_functions_1.logger.info("scheduledEconomyLedgerCompaction complete", {
      totalUsers: usersSnap.size,
      compacted,
      skipped,
      errors,
    });
  },
);
