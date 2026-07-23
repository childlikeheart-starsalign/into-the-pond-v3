"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCancelCastInTransaction = runCancelCastInTransaction;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const castTiming_1 = require("./castTiming");
const dailyCounters_1 = require("./dailyCounters");
const economy_1 = require("./economy");
const commitEconomyAction_1 = require("./economy/commitEconomyAction");
const resolveCallableIdempotency_1 = require("./economy/resolveCallableIdempotency");
const foldBaitInventory_1 = require("./economy/foldBaitInventory");
function pruneCancelTimestamps(recent, nowMs) {
  const raw = Array.isArray(recent) ? recent : [];
  return raw
    .map((v) => (typeof v === "number" ? v : Number(v)))
    .filter((ms) => Number.isFinite(ms) && nowMs - ms < castTiming_1.CANCEL_CAST_RATE_WINDOW_MS);
}
function resolveBaitRefundPatch(baitUsed, baitDeducted, inventory) {
  if (baitDeducted !== true) {
    return { patch: undefined, baitRefunded: false, baitKey: null };
  }
  const key = (0, foldBaitInventory_1.inventoryKeyFromCastBaitUsed)(baitUsed ?? "");
  if (!key) {
    return { patch: undefined, baitRefunded: false, baitKey: null };
  }
  const baits = inventory?.baits ?? {};
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
/**
 * Cancel an active cast within the grace window. Pity is never touched.
 * Idempotent per castId via cast_cancel:{castId}.
 */
async function runCancelCastInTransaction(input) {
  const { tx, userRef, uid, nowMs = Date.now() } = input;
  const userSnap = await tx.get(userRef);
  const data = userSnap.data() ?? {};
  const counterResetPatch = (0, dailyCounters_1.buildOperationalCounterResetPatch)(data);
  const pityBefore = data.fishingPity;
  const activeCast = data.activeCast;
  const castId = activeCast?.castId ?? null;
  if (!castId || !activeCast) {
    // Claim (or prior cancel) already cleared — terminal no-op, no crash.
    const lastClaimed = typeof data.lastClaimedCastId === "string" ? data.lastClaimedCastId : null;
    firebase_functions_1.logger.info("cancelCast: no activeCast — treating as already cleared", {
      uid,
      lastClaimedCastId: lastClaimed,
    });
    throw new https_1.HttpsError("failed-precondition", "No active cast to cancel");
  }
  const cast = activeCast;
  const idempotencyKey = (0, economy_1.castCancelKey)(castId);
  const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
    tx,
    userRef,
    idempotencyKey,
  );
  if (idemRead.hit) {
    return idemRead.response;
  }
  const createdAtMs = cast.createdAt?.toMillis?.();
  if (createdAtMs == null || !Number.isFinite(createdAtMs)) {
    throw new https_1.HttpsError(
      "failed-precondition",
      "This cast cannot be recalled (missing create time)",
    );
  }
  if (nowMs - createdAtMs > castTiming_1.CANCEL_CAST_GRACE_MS) {
    throw new https_1.HttpsError("failed-precondition", "The recall window has closed");
  }
  const recent = pruneCancelTimestamps(data.castCancelRecentMs, nowMs);
  if (recent.length >= castTiming_1.CANCEL_CAST_MAX_PER_WINDOW) {
    throw new https_1.HttpsError(
      "resource-exhausted",
      "Too many recalls recently. Let this cast finish.",
    );
  }
  // Detect bait deduction: prefer explicit flag; else infer from bait id.
  const baitUsed = cast.baitUsed ?? "random_bait";
  const inferredKey = (0, foldBaitInventory_1.inventoryKeyFromCastBaitUsed)(baitUsed);
  const baitDeducted =
    cast.baitDeducted === true || (cast.baitDeducted !== false && inferredKey != null);
  const {
    patch: inventoryPatch,
    baitRefunded,
    baitKey,
  } = resolveBaitRefundPatch(baitUsed, baitDeducted, data.inventory);
  const response = {
    success: true,
    castId,
    baitRefunded,
  };
  await (0, commitEconomyAction_1.commitEconomyAction)({
    tx,
    userRef,
    uid,
    idempotencyKey,
    actionType: "cast_cancel",
    idempotencyMiss: { hit: false },
    build: () => {
      const additionalUserPatch = {
        ...counterResetPatch,
        activeCast: null,
        castCancelRecentMs: [...recent, nowMs],
        // Explicit pity no-op: never include fishingPity in the patch.
      };
      if (inventoryPatch) {
        additionalUserPatch.inventory = inventoryPatch;
      }
      return {
        entry: (0, economy_1.buildAuditOnlyLedgerEntry)({
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
