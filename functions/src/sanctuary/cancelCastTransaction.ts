import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

import {
  CANCEL_CAST_GRACE_MS,
  CANCEL_CAST_MAX_PER_WINDOW,
  CANCEL_CAST_RATE_WINDOW_MS,
} from "./castTiming";
import { buildOperationalCounterResetPatch } from "./dailyCounters";
import { buildAuditOnlyLedgerEntry, castCancelKey } from "./economy";
import { commitEconomyAction } from "./economy/commitEconomyAction";
import { readIdempotencyInTransaction } from "./economy/resolveCallableIdempotency";
import { inventoryKeyFromCastBaitUsed } from "./economy/foldBaitInventory";
import type { FishingPityState } from "./types";

export type CancelCastResponse = {
  success: true;
  castId: string;
  baitRefunded: boolean;
  alreadyCleared?: boolean;
};

type ActiveCastDoc = {
  castId?: string;
  readyTimestamp?: Timestamp;
  createdAt?: Timestamp;
  rodType?: string;
  baitUsed?: string;
  baitDeducted?: boolean;
};

function pruneCancelTimestamps(recent: unknown, nowMs: number): number[] {
  const raw = Array.isArray(recent) ? recent : [];
  return raw
    .map((v) => (typeof v === "number" ? v : Number(v)))
    .filter((ms) => Number.isFinite(ms) && nowMs - ms < CANCEL_CAST_RATE_WINDOW_MS);
}

function resolveBaitRefundPatch(
  baitUsed: string | undefined,
  baitDeducted: boolean | undefined,
  inventory: Record<string, unknown> | undefined,
): { patch: Record<string, unknown> | undefined; baitRefunded: boolean; baitKey: string | null } {
  if (baitDeducted !== true) {
    return { patch: undefined, baitRefunded: false, baitKey: null };
  }
  const key = inventoryKeyFromCastBaitUsed(baitUsed ?? "");
  if (!key) {
    return { patch: undefined, baitRefunded: false, baitKey: null };
  }
  const baits = (inventory?.baits as Record<string, number> | undefined) ?? {};
  return {
    patch: {
      ...inventory,
      baits: {
        ...baits,
        [key]: (baits[key] ?? 0) + 1,
      },
    },
    baitRefunded: true,
    baitKey: key,
  };
}

export type RunCancelCastInput = {
  tx: FirebaseFirestore.Transaction;
  userRef: FirebaseFirestore.DocumentReference;
  uid: string;
  nowMs?: number;
};

/**
 * Cancel an active cast within the grace window. Pity is never touched.
 * Idempotent per castId via cast_cancel:{castId}.
 */
export async function runCancelCastInTransaction(
  input: RunCancelCastInput,
): Promise<CancelCastResponse> {
  const { tx, userRef, uid, nowMs = Date.now() } = input;

  const userSnap = await tx.get(userRef);
  const data = (userSnap.data() ?? {}) as Record<string, unknown>;
  const counterResetPatch = buildOperationalCounterResetPatch(data);
  const pityBefore = data.fishingPity as FishingPityState | undefined;

  const activeCast = data.activeCast as ActiveCastDoc | null | undefined;
  const castId = activeCast?.castId ?? null;

  if (!castId || !activeCast) {
    // Claim (or prior cancel) already cleared — terminal no-op, no crash.
    const lastClaimed = typeof data.lastClaimedCastId === "string" ? data.lastClaimedCastId : null;
    logger.info("cancelCast: no activeCast — treating as already cleared", {
      uid,
      lastClaimedCastId: lastClaimed,
    });
    throw new HttpsError("failed-precondition", "No active cast to cancel");
  }

  const cast = activeCast;

  const idempotencyKey = castCancelKey(castId);
  const idemRead = await readIdempotencyInTransaction<CancelCastResponse>(
    tx,
    userRef,
    idempotencyKey,
  );
  if (idemRead.hit) {
    return idemRead.response;
  }

  const createdAtMs = cast.createdAt?.toMillis?.();
  if (createdAtMs == null || !Number.isFinite(createdAtMs)) {
    throw new HttpsError(
      "failed-precondition",
      "This cast cannot be recalled (missing create time)",
    );
  }

  if (nowMs - createdAtMs > CANCEL_CAST_GRACE_MS) {
    throw new HttpsError("failed-precondition", "The recall window has closed");
  }

  const recent = pruneCancelTimestamps(data.castCancelRecentMs, nowMs);
  if (recent.length >= CANCEL_CAST_MAX_PER_WINDOW) {
    throw new HttpsError("resource-exhausted", "Too many recalls recently. Let this cast finish.");
  }

  // Detect bait deduction: prefer explicit flag; else infer from bait id.
  const baitUsed = cast.baitUsed ?? "random_bait";
  const inferredKey = inventoryKeyFromCastBaitUsed(baitUsed);
  const baitDeducted =
    cast.baitDeducted === true || (cast.baitDeducted !== false && inferredKey != null);

  const {
    patch: inventoryPatch,
    baitRefunded,
    baitKey,
  } = resolveBaitRefundPatch(
    baitUsed,
    baitDeducted,
    data.inventory as Record<string, unknown> | undefined,
  );

  const response: CancelCastResponse = {
    success: true,
    castId,
    baitRefunded,
  };

  await commitEconomyAction({
    tx,
    userRef,
    uid,
    idempotencyKey,
    actionType: "cast_cancel",
    idempotencyMiss: { hit: false },
    build: () => {
      const additionalUserPatch: Record<string, unknown> = {
        ...counterResetPatch,
        activeCast: null,
        castCancelRecentMs: [...recent, nowMs],
        // Explicit pity no-op: never include fishingPity in the patch.
      };
      if (inventoryPatch) {
        additionalUserPatch.inventory = inventoryPatch;
      }

      return {
        entry: buildAuditOnlyLedgerEntry({
          uid,
          actionType: "cast_cancel",
          idempotencyKey,
          source: "fishing_catch",
          correlationId: castId,
          metadata: {
            castId,
            rodType: cast.rodType ?? "basic",
            baitUsed,
            baitRefunded,
            baitKey,
            pityUnchanged: true,
            pitySnapshotPresent: pityBefore != null,
          },
        }),
        additionalUserPatch,
        response,
      };
    },
  });

  return response;
}
