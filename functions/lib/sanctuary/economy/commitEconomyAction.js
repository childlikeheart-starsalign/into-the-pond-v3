"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitEconomyAction = commitEconomyAction;
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const index_1 = require("./index");
const idempotency_1 = require("./idempotency");
const resolveCallableIdempotency_1 = require("./resolveCallableIdempotency");
const wonderEconomy_1 = require("../wonderEconomy");
function mergeExemptUserPatch(projectionPatch, additional) {
  if (!additional) return projectionPatch;
  const { inventory: additionalInventory, ...rest } = additional;
  const inv = additionalInventory;
  const merged = { ...projectionPatch, ...rest };
  if (inv?.baits) {
    const baseInventory = projectionPatch.inventory ?? {};
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
async function commitEconomyAction(input) {
  const { tx, userRef, uid, idempotencyKey, actionType, touchReflection, idempotencyMiss, build } =
    input;
  if (!idempotencyMiss) {
    const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return {
        committed: false,
        result: idemRead.response,
        ledgerEntryId: idemRead.ledgerEntryId,
      };
    }
  }
  const userSnap = await tx.get(userRef);
  const userData = userSnap.data() ?? {};
  const account = (0, wonderEconomy_1.wonderAccountFromDoc)(uid, userData);
  const built = build({ account, userData });
  const expectedLedgerId = (0, idempotency_1.ledgerEntryIdForKey)(idempotencyKey);
  if (built.entry.id !== expectedLedgerId) {
    throw new index_1.EconomyError(
      "IDEMPOTENCY_CONFLICT",
      "Ledger entry id must match idempotency key",
      {
        expectedLedgerId,
        actualId: built.entry.id,
      },
    );
  }
  if (built.entry.idempotencyKey !== idempotencyKey) {
    throw new index_1.EconomyError("IDEMPOTENCY_CONFLICT", "Ledger idempotencyKey mismatch", {
      expectedKey: idempotencyKey,
      actualKey: built.entry.idempotencyKey,
    });
  }
  const { projection, meta } = await (0, index_1.computeEconomyProjectionInTransaction)(
    tx,
    userRef,
    built.entry,
  );
  if (meta.tailEntryCount > index_1.COMPACT_TAIL_LOG_THRESHOLD) {
    firebase_functions_1.logger.warn("economy ledger tail exceeds compaction hint threshold", {
      uid,
      tailEntryCount: meta.tailEntryCount,
      totalCommittedEntryCount: meta.totalCommittedEntryCount,
      usedCheckpoint: meta.usedCheckpoint,
    });
  }
  tx.set(userRef.collection("economyLedger").doc(built.entry.id), built.entry);
  const priorInventory = userData.inventory ?? {};
  const projectionPatch = {
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
    userPatch.lastReflectionAt = firestore_1.Timestamp.now();
  }
  tx.set(userRef, userPatch, { merge: true });
  const legacyAmount =
    built.entry.deltaCurrentWonder !== 0
      ? built.entry.deltaCurrentWonder
      : built.entry.deltaStoredWonder;
  const ledgerOnly = process.env.ECONOMY_LEDGER_ONLY === "true";
  if (legacyAmount !== 0 && !ledgerOnly) {
    const wonderTxId = built.entry.metadata.wonderTransactionId;
    tx.set(userRef.collection("wonderTransactions").doc(wonderTxId), {
      id: wonderTxId,
      userId: uid,
      timestamp: firestore_1.Timestamp.fromMillis(built.entry.timestamp),
      source: built.entry.source,
      amount: legacyAmount,
      metadata: built.entry.metadata,
      ledgerEntryId: built.entry.id,
      actionType: built.entry.actionType,
      idempotencyKey: built.entry.idempotencyKey,
    });
  }
  (0, resolveCallableIdempotency_1.writeIdempotencyInTransaction)(
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
