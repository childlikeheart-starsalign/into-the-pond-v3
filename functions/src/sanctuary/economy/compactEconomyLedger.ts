import { logger } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { db } from "../../init";
import { COMPACT_KEEP_TAIL_ENTRIES, COMPACT_WHEN_TOTAL_ENTRIES } from "./compactionConstants";
import {
  buildCheckpointFromSortedEntries,
  projectionFromCheckpointAndEntries,
  projectionFromLedgerEntries,
  sortLedgerEntriesByTimestamp,
} from "./foldLedger";
import { reconcileUser } from "./reconcileUser";
import {
  ECONOMY_LEDGER_CHECKPOINT_DOC_ID,
  type EconomyLedgerCheckpoint,
  type EconomyLedgerEntry,
} from "./types";
import { assertEconomyAdminOrThrow } from "./assertEconomyAdmin";

export type CompactEconomyLedgerResult = {
  uid: string;
  skipped: boolean;
  reason?: string;
  ledgerEntryCount?: number;
  foldedEntryCount?: number;
  tailEntryCount?: number;
  dryRun?: boolean;
};

function projectionsMatch(
  a: ReturnType<typeof projectionFromLedgerEntries>,
  b: ReturnType<typeof projectionFromLedgerEntries>,
): boolean {
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
export async function compactEconomyLedgerForUser(
  uid: string,
  options?: {
    keepTailEntries?: number;
    compactedBy?: EconomyLedgerCheckpoint["compactedBy"];
    dryRun?: boolean;
    minTotalEntries?: number;
  },
): Promise<CompactEconomyLedgerResult> {
  const keepTail = options?.keepTailEntries ?? COMPACT_KEEP_TAIL_ENTRIES;
  const minTotal = options?.minTotalEntries ?? COMPACT_WHEN_TOTAL_ENTRIES;
  const compactedBy = options?.compactedBy ?? "admin";

  const userRef = db.collection("users").doc(uid);
  const ledgerSnap = await userRef.collection("economyLedger").orderBy("timestamp", "asc").get();
  const sorted = sortLedgerEntriesByTimestamp(
    ledgerSnap.docs.map((doc) => doc.data() as EconomyLedgerEntry),
  );

  if (sorted.length < minTotal) {
    return {
      uid,
      skipped: true,
      reason: "below_threshold",
      ledgerEntryCount: sorted.length,
    };
  }

  const checkpoint = buildCheckpointFromSortedEntries(sorted, keepTail, compactedBy);
  if (!checkpoint) {
    return {
      uid,
      skipped: true,
      reason: "insufficient_entries",
      ledgerEntryCount: sorted.length,
    };
  }

  const tail = sorted.slice(checkpoint.foldedEntryCount);
  const fromCheckpoint = projectionFromCheckpointAndEntries(checkpoint, tail);
  const fromFull = projectionFromLedgerEntries(sorted);
  if (!projectionsMatch(fromCheckpoint, fromFull)) {
    throw new Error(`Checkpoint fold mismatch for user ${uid}`);
  }

  const reconcileReport = await reconcileUser(uid);
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
    .doc(ECONOMY_LEDGER_CHECKPOINT_DOC_ID)
    .set(checkpoint);

  return {
    uid,
    skipped: false,
    ledgerEntryCount: sorted.length,
    foldedEntryCount: checkpoint.foldedEntryCount,
    tailEntryCount: tail.length,
  };
}

export type AdminCompactEconomyLedgerPayload = {
  targetUid: string;
  keepTailEntries?: number;
  dryRun?: boolean;
};

export const adminCompactEconomyLedgerCallable = onCall(async (request) => {
  assertEconomyAdminOrThrow(request.auth?.uid, request.auth?.token as Record<string, unknown>);

  const data = request.data as AdminCompactEconomyLedgerPayload;
  const { targetUid, keepTailEntries, dryRun } = data;
  if (!targetUid || typeof targetUid !== "string") {
    throw new HttpsError("invalid-argument", "targetUid is required");
  }

  try {
    return await compactEconomyLedgerForUser(targetUid, {
      keepTailEntries,
      dryRun: dryRun === true,
      compactedBy: "admin",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new HttpsError("failed-precondition", message);
  }
});

const USER_BATCH_SIZE = 50;

/** Proactively compact users whose ledger exceeds COMPACT_WHEN_TOTAL_ENTRIES. */
export const scheduledEconomyLedgerCompaction = onSchedule("every 24 hours", async () => {
  const usersSnap = await db.collection("users").select().get();
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
          if (ledgerCount < COMPACT_WHEN_TOTAL_ENTRIES) {
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
            logger.info("scheduledEconomyLedgerCompaction wrote checkpoint", result);
          }
        } catch (error) {
          errors += 1;
          logger.warn("scheduledEconomyLedgerCompaction skipped user", {
            uid: userDoc.id,
            error,
          });
        }
      }),
    );
  }

  logger.info("scheduledEconomyLedgerCompaction complete", {
    totalUsers: usersSnap.size,
    compacted,
    skipped,
    errors,
  });
});
