import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import { applyOperationalCounterResetsInTransaction } from "./dailyCounters";
import { buildAuditOnlyLedgerEntry, castCreateKey, idempotencyDocId } from "./economy";
import { commitEconomyAction } from "./economy/commitEconomyAction";
import { readIdempotencyInTransaction } from "./economy/resolveCallableIdempotency";
import { playerRodRef } from "./progression/playerRodHelpers";
import { assertRodOwnedForCast } from "./progression/fishingPermissionService";
import { uiBaitIdToTier, uiRodIdToDomain } from "./rodCatalog";
import type { FishingRodId } from "./types";

export const CAST_DURATION_MS = 2 * 60 * 1000;

const CONSUMABLE_BAIT_IDS = new Set(["feather_bait", "scale_bait", "glimmerdust_bait"]);

function resolveBaitInventoryPatch(
  baitUsed: string,
  inventory: Record<string, unknown> | undefined,
): { patch: Record<string, unknown> | undefined; baitDeducted: boolean } {
  const normalized = (baitUsed ?? "").trim();
  if (!normalized || normalized === "random_bait") {
    return { patch: undefined, baitDeducted: false };
  }

  if (!CONSUMABLE_BAIT_IDS.has(normalized)) {
    throw new HttpsError("failed-precondition", "Unknown bait type");
  }

  const baits = (inventory?.baits as Record<string, number> | undefined) ?? {};
  const balance = baits[normalized] ?? 0;
  if (balance < 1) {
    throw new HttpsError("failed-precondition", "Insufficient bait");
  }

  return {
    patch: {
      ...inventory,
      baits: {
        ...baits,
        [normalized]: balance - 1,
      },
    },
    baitDeducted: true,
  };
}

export type CreateCastResponse = { success: true; castId: string; readyAt: number };

export type RunCreateCastInput = {
  tx: FirebaseFirestore.Transaction;
  userRef: FirebaseFirestore.DocumentReference;
  uid: string;
  requestId: string;
  rodType: string;
  baitUsed: string;
};

export function deriveCastIdFromRequestId(requestId: string): string {
  return `cast_${idempotencyDocId(requestId)}`;
}

export async function runCreateCastInTransaction(
  input: RunCreateCastInput,
): Promise<CreateCastResponse> {
  const { tx, userRef, uid, requestId, rodType, baitUsed } = input;
  const idempotencyKey = castCreateKey(requestId);
  const castId = deriveCastIdFromRequestId(requestId);
  const domainRodId = uiRodIdToDomain(rodType) as FishingRodId;

  const idemRead = await readIdempotencyInTransaction<CreateCastResponse>(
    tx,
    userRef,
    idempotencyKey,
  );
  if (idemRead.hit) {
    return idemRead.response;
  }

  const userSnap = await tx.get(userRef);
  const data = (userSnap.data() ?? {}) as Record<string, unknown>;
  applyOperationalCounterResetsInTransaction(tx, userRef, data);
  const activeCast = data.activeCast as
    | { castId?: string; readyTimestamp?: Timestamp }
    | null
    | undefined;

  if (activeCast?.castId) {
    if (activeCast.castId === castId) {
      const readyAt = activeCast.readyTimestamp?.toMillis() ?? Date.now() + CAST_DURATION_MS;
      const response: CreateCastResponse = { success: true, castId, readyAt };
      await commitEconomyAction({
        tx,
        userRef,
        uid,
        idempotencyKey,
        actionType: "cast_create",
        idempotencyMiss: { hit: false },
        build: () => ({
          entry: buildAuditOnlyLedgerEntry({
            uid,
            actionType: "cast_create",
            idempotencyKey,
            source: "fishing_catch",
            correlationId: castId,
            metadata: {
              castId,
              rodType,
              baitUsed,
              baitDeducted: false,
              reconciledActiveCast: true,
            },
          }),
          response,
        }),
      });
      return response;
    }
    throw new HttpsError("failed-precondition", "A cast is already active");
  }

  if (domainRodId !== "basic") {
    const rodSnap = await tx.get(playerRodRef(uid, domainRodId));
    try {
      assertRodOwnedForCast(domainRodId, (rodSnap.data() as { state?: string } | undefined)?.state);
    } catch {
      throw new HttpsError("failed-precondition", "You do not own this rod yet");
    }
  }

  const readyAt = Date.now() + CAST_DURATION_MS;
  const { patch: inventoryPatch, baitDeducted } = resolveBaitInventoryPatch(
    baitUsed,
    data.inventory as Record<string, unknown> | undefined,
  );
  const response: CreateCastResponse = { success: true, castId, readyAt };

  await commitEconomyAction({
    tx,
    userRef,
    uid,
    idempotencyKey,
    actionType: "cast_create",
    idempotencyMiss: { hit: false },
    build: () => {
      const additionalUserPatch: Record<string, unknown> = {
        activeCast: {
          castId,
          readyTimestamp: Timestamp.fromMillis(readyAt),
          rodType,
          baitUsed,
          baitTier: uiBaitIdToTier(baitUsed),
          domainRodId,
        },
      };
      if (inventoryPatch) {
        additionalUserPatch.inventory = inventoryPatch;
      }

      return {
        entry: buildAuditOnlyLedgerEntry({
          uid,
          actionType: "cast_create",
          idempotencyKey,
          source: "fishing_catch",
          correlationId: castId,
          metadata: { castId, rodType, baitUsed, baitDeducted },
        }),
        additionalUserPatch,
        response,
      };
    },
  });

  return response;
}
