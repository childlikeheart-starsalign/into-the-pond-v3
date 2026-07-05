"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compensateEconomyEntryCallable = void 0;
const https_1 = require("firebase-functions/v2/https");
const init_1 = require("../../init");
const commitEconomyAction_1 = require("./commitEconomyAction");
const compensation_1 = require("./compensation");
const assertEconomyAdmin_1 = require("./assertEconomyAdmin");
const types_1 = require("./types");
exports.compensateEconomyEntryCallable = (0, https_1.onCall)(async (request) => {
  (0, assertEconomyAdmin_1.assertEconomyAdminOrThrow)(request.auth?.uid, request.auth?.token);
  const data = request.data;
  const {
    targetUid,
    correctsEntryId,
    deltaCurrentWonder,
    deltaStoredWonder,
    compensationReason,
    idempotencyKey: clientKey,
  } = data;
  if (!targetUid || !correctsEntryId || !compensationReason?.trim()) {
    throw new https_1.HttpsError(
      "invalid-argument",
      "targetUid, correctsEntryId, and compensationReason are required",
    );
  }
  if (!Number.isFinite(deltaCurrentWonder) || !Number.isFinite(deltaStoredWonder)) {
    throw new https_1.HttpsError(
      "invalid-argument",
      "deltaCurrentWonder and deltaStoredWonder must be finite numbers",
    );
  }
  const idempotencyKey =
    clientKey ??
    (0, compensation_1.compensationIdempotencyKey)(correctsEntryId, compensationReason);
  const userRef = init_1.db.collection("users").doc(targetUid);
  const originalRef = userRef.collection("economyLedger").doc(correctsEntryId);
  return init_1.db
    .runTransaction(async (tx) => {
      const originalSnap = await tx.get(originalRef);
      if (!originalSnap.exists) {
        throw new https_1.HttpsError("not-found", `Ledger entry ${correctsEntryId} not found`);
      }
      const originalEntry = originalSnap.data();
      if (originalEntry.uid !== targetUid) {
        throw new https_1.HttpsError(
          "invalid-argument",
          "correctsEntryId does not belong to targetUid",
        );
      }
      try {
        (0, compensation_1.assertCompensationAllowed)(originalEntry);
      } catch (error) {
        throw new https_1.HttpsError("failed-precondition", error.message);
      }
      const economyCommit = await (0, commitEconomyAction_1.commitEconomyAction)({
        tx,
        userRef,
        uid: targetUid,
        idempotencyKey,
        actionType: "compensation",
        build: () => {
          const entry = (0, compensation_1.buildCompensationLedgerEntry)({
            uid: targetUid,
            correctsEntryId,
            idempotencyKey,
            deltaCurrentWonder,
            deltaStoredWonder,
            compensationReason: compensationReason.trim(),
          });
          return {
            entry,
            response: {
              success: true,
              correctsEntryId,
              ledgerEntryId: entry.id,
            },
          };
        },
      });
      return {
        committed: economyCommit.committed,
        result: economyCommit.result,
        ledgerEntryId: economyCommit.ledgerEntryId,
      };
    })
    .catch((error) => {
      if (error instanceof types_1.EconomyError) {
        throw new https_1.HttpsError("failed-precondition", error.message, { code: error.code });
      }
      throw error;
    });
});
