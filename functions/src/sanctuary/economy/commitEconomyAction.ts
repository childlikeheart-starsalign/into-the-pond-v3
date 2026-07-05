import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

import {
  COMPACT_TAIL_LOG_THRESHOLD,
  computeEconomyProjectionInTransaction,
  type EconomyActionType,
  type EconomyLedgerEntry,
  EconomyError,
} from "./index";
import { ledgerEntryIdForKey } from "./idempotency";
import {
  readIdempotencyInTransaction,
  writeIdempotencyInTransaction,
} from "./resolveCallableIdempotency";
import type { WonderAccount } from "../types";
import { wonderAccountFromDoc } from "../wonderEconomy";

export type CommitEconomyActionInput<T> = {
  tx: FirebaseFirestore.Transaction;
  userRef: FirebaseFirestore.DocumentReference;
  uid: string;
  idempotencyKey: string;
  actionType: EconomyActionType;
  touchReflection?: boolean;
  /** When caller already read idempotency in the same tx, pass the miss result to skip a second read. */
  idempotencyMiss?: { hit: false };
  build: (fresh: { account: WonderAccount; userData: Record<string, unknown> }) => {
    entry: EconomyLedgerEntry;
    additionalUserPatch?: Record<string, unknown>;
    response: T;
  };
};

export type CommitEconomyActionResult<T> = {
  committed: boolean;
  result: T;
  ledgerEntryId: string;
};

function mergeExemptUserPatch(
  projectionPatch: Record<string, unknown>,
  additional?: Record<string, unknown>,
): Record<string, unknown> {
  if (!additional) return projectionPatch;

  const { inventory: additionalInventory, ...rest } = additional;
  const inv = additionalInventory as { baits?: Record<string, number> } | undefined;
  const merged: Record<string, unknown> = { ...projectionPatch, ...rest };

  if (inv?.baits) {
    const baseInventory = (projectionPatch.inventory as Record<string, unknown> | undefined) ?? {};
    merged.inventory = { ...baseInventory, baits: inv.baits };
  }

  return merged;
}

/**
 * Authoritative in-transaction economy commit (Phase C — ledger projection).
 *
 * Write order inside a single Firestore transaction:
 * 1. Idempotency read (skip if idempotencyMiss)
 * 2. Fresh user read
 * 3. build() → EconomyLedgerEntry (+ optional exempt user patches)
 * 4. Solvency check on ledger fold including pending entry
 * 5. tx.set economyLedger/{id} (append-only)
 * 6. Fold ledger + pending entry → user aggregate projection
 * 7. tx.set user projection (wonder + inventory parts/materials + exempt patches)
 * 8. tx.set wonderTransactions (legacy dual-write when wonder moved and not ledger-only)
 * 9. tx.set economyIdempotency
 */
export async function commitEconomyAction<T>(
  input: CommitEconomyActionInput<T>,
): Promise<CommitEconomyActionResult<T>> {
  const { tx, userRef, uid, idempotencyKey, actionType, touchReflection, idempotencyMiss, build } =
    input;

  if (!idempotencyMiss) {
    const idemRead = await readIdempotencyInTransaction<T>(tx, userRef, idempotencyKey);
    if (idemRead.hit) {
      return {
        committed: false,
        result: idemRead.response,
        ledgerEntryId: idemRead.ledgerEntryId,
      };
    }
  }

  const userSnap = await tx.get(userRef);
  const userData = (userSnap.data() ?? {}) as Record<string, unknown>;
  const account = wonderAccountFromDoc(uid, userData as Parameters<typeof wonderAccountFromDoc>[1]);

  const built = build({ account, userData });
  const expectedLedgerId = ledgerEntryIdForKey(idempotencyKey);
  if (built.entry.id !== expectedLedgerId) {
    throw new EconomyError("IDEMPOTENCY_CONFLICT", "Ledger entry id must match idempotency key", {
      expectedLedgerId,
      actualId: built.entry.id,
    });
  }
  if (built.entry.idempotencyKey !== idempotencyKey) {
    throw new EconomyError("IDEMPOTENCY_CONFLICT", "Ledger idempotencyKey mismatch", {
      expectedKey: idempotencyKey,
      actualKey: built.entry.idempotencyKey,
    });
  }

  const { projection, meta } = await computeEconomyProjectionInTransaction(
    tx,
    userRef,
    built.entry,
  );

  if (meta.tailEntryCount > COMPACT_TAIL_LOG_THRESHOLD) {
    logger.warn("economy ledger tail exceeds compaction hint threshold", {
      uid,
      tailEntryCount: meta.tailEntryCount,
      totalCommittedEntryCount: meta.totalCommittedEntryCount,
      usedCheckpoint: meta.usedCheckpoint,
    });
  }

  tx.set(userRef.collection("economyLedger").doc(built.entry.id), built.entry);

  const priorInventory = (userData.inventory as Record<string, unknown> | undefined) ?? {};
  const projectionPatch: Record<string, unknown> = {
    currentWonder: projection.currentWonder,
    storedWonder: projection.storedWonder,
    lifetimeWonderEarned: projection.lifetimeWonderEarned,
    totalWonder: projection.totalWonder,
    inventory: {
      ...priorInventory,
      parts: projection.parts,
      baitMaterials: projection.baitMaterials,
    },
  };

  const userPatch = mergeExemptUserPatch(projectionPatch, built.additionalUserPatch);
  if (touchReflection) {
    userPatch.lastReflectionAt = Timestamp.now();
  }

  tx.set(userRef, userPatch, { merge: true });

  const legacyAmount =
    built.entry.deltaCurrentWonder !== 0
      ? built.entry.deltaCurrentWonder
      : built.entry.deltaStoredWonder;
  const ledgerOnly = process.env.ECONOMY_LEDGER_ONLY === "true";
  if (legacyAmount !== 0 && !ledgerOnly) {
    const wonderTxId = built.entry.metadata.wonderTransactionId as string;
    tx.set(userRef.collection("wonderTransactions").doc(wonderTxId), {
      id: wonderTxId,
      userId: uid,
      timestamp: Timestamp.fromMillis(built.entry.timestamp),
      source: built.entry.source,
      amount: legacyAmount,
      metadata: built.entry.metadata,
      ledgerEntryId: built.entry.id,
      actionType: built.entry.actionType,
      idempotencyKey: built.entry.idempotencyKey,
    });
  }

  writeIdempotencyInTransaction(
    tx,
    userRef,
    idempotencyKey,
    actionType,
    built.response,
    built.entry.id,
  );

  return {
    committed: true,
    result: built.response,
    ledgerEntryId: built.entry.id,
  };
}
