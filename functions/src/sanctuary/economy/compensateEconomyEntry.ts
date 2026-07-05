import { onCall, HttpsError } from "firebase-functions/v2/https";

import { db } from "../../init";
import { commitEconomyAction } from "./commitEconomyAction";
import {
  assertCompensationAllowed,
  buildCompensationLedgerEntry,
  compensationIdempotencyKey,
} from "./compensation";
import type { EconomyCommitResult } from "./types";
import { assertEconomyAdminOrThrow } from "./assertEconomyAdmin";
import { wonderAccountFromDoc } from "../wonderEconomy";
import { EconomyError, type EconomyLedgerEntry } from "./types";

export type CompensateEconomyEntryPayload = {
  targetUid: string;
  correctsEntryId: string;
  deltaCurrentWonder: number;
  deltaStoredWonder: number;
  compensationReason: string;
  idempotencyKey?: string;
};

export type CompensateEconomyEntryResponse = EconomyCommitResult<{
  success: true;
  correctsEntryId: string;
  ledgerEntryId: string;
}>;

export const compensateEconomyEntryCallable = onCall(async (request) => {
  assertEconomyAdminOrThrow(request.auth?.uid, request.auth?.token as Record<string, unknown>);

  const data = request.data as CompensateEconomyEntryPayload;
  const {
    targetUid,
    correctsEntryId,
    deltaCurrentWonder,
    deltaStoredWonder,
    compensationReason,
    idempotencyKey: clientKey,
  } = data;

  if (!targetUid || !correctsEntryId || !compensationReason?.trim()) {
    throw new HttpsError(
      "invalid-argument",
      "targetUid, correctsEntryId, and compensationReason are required",
    );
  }

  if (!Number.isFinite(deltaCurrentWonder) || !Number.isFinite(deltaStoredWonder)) {
    throw new HttpsError(
      "invalid-argument",
      "deltaCurrentWonder and deltaStoredWonder must be finite numbers",
    );
  }

  const idempotencyKey =
    clientKey ?? compensationIdempotencyKey(correctsEntryId, compensationReason);
  const userRef = db.collection("users").doc(targetUid);
  const originalRef = userRef.collection("economyLedger").doc(correctsEntryId);

  return db
    .runTransaction(async (tx) => {
      const originalSnap = await tx.get(originalRef);
      if (!originalSnap.exists) {
        throw new HttpsError("not-found", `Ledger entry ${correctsEntryId} not found`);
      }

      const originalEntry = originalSnap.data() as EconomyLedgerEntry;
      if (originalEntry.uid !== targetUid) {
        throw new HttpsError("invalid-argument", "correctsEntryId does not belong to targetUid");
      }

      try {
        assertCompensationAllowed(originalEntry);
      } catch (error) {
        throw new HttpsError("failed-precondition", (error as Error).message);
      }

      const economyCommit = await commitEconomyAction<CompensateEconomyEntryResponse["result"]>({
        tx,
        userRef,
        uid: targetUid,
        idempotencyKey,
        actionType: "compensation",
        build: () => {
          const entry = buildCompensationLedgerEntry({
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
              success: true as const,
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
      } satisfies CompensateEconomyEntryResponse;
    })
    .catch((error: unknown) => {
      if (error instanceof EconomyError) {
        throw new HttpsError("failed-precondition", error.message, { code: error.code });
      }
      throw error;
    });
});
