"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAST_DURATION_MS = void 0;
exports.deriveCastIdFromRequestId = deriveCastIdFromRequestId;
exports.runCreateCastInTransaction = runCreateCastInTransaction;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const castTiming_1 = require("./castTiming");
const dailyCounters_1 = require("./dailyCounters");
const economy_1 = require("./economy");
const commitEconomyAction_1 = require("./economy/commitEconomyAction");
const resolveCallableIdempotency_1 = require("./economy/resolveCallableIdempotency");
const playerRodHelpers_1 = require("./progression/playerRodHelpers");
const fishingPermissionService_1 = require("./progression/fishingPermissionService");
const rodCatalog_1 = require("./rodCatalog");
/** Re-export for callers / tests — single source is castTiming.ts. */
var castTiming_2 = require("./castTiming");
Object.defineProperty(exports, "CAST_DURATION_MS", {
  enumerable: true,
  get: function () {
    return castTiming_2.CAST_DURATION_MS;
  },
});
const CONSUMABLE_BAIT_IDS = new Set(["feather_bait", "scale_bait", "glimmerdust_bait"]);
/** UI bait ids (FishingModal) → inventory keys. Free default bait_basic does not deduct. */
const UI_BAIT_TO_INVENTORY_KEY = {
  bait_mid: "scale_bait",
  bait_premium: "glimmerdust_bait",
  feather_bait: "feather_bait",
  scale_bait: "scale_bait",
  glimmerdust_bait: "glimmerdust_bait",
};
function resolveBaitInventoryPatch(baitUsed, inventory) {
  const normalized = (baitUsed ?? "").trim();
  // Free default UI bait and legacy random_bait — no inventory deduction.
  if (!normalized || normalized === "random_bait" || normalized === "bait_basic") {
    return { patch: undefined, baitDeducted: false };
  }
  const inventoryKey = UI_BAIT_TO_INVENTORY_KEY[normalized];
  if (!inventoryKey || !CONSUMABLE_BAIT_IDS.has(inventoryKey)) {
    throw new https_1.HttpsError("failed-precondition", "Unknown bait type");
  }
  const baits = inventory?.baits ?? {};
  const balance = baits[inventoryKey] ?? 0;
  if (balance < 1) {
    throw new https_1.HttpsError("failed-precondition", "Insufficient bait");
  }
  return {
    patch: {
      ...inventory,
      baits: {
        ...baits,
        [inventoryKey]: balance - 1,
      },
    },
    baitDeducted: true,
  };
}
function deriveCastIdFromRequestId(requestId) {
  return `cast_${(0, economy_1.idempotencyDocId)(requestId)}`;
}
async function runCreateCastInTransaction(input) {
  const { tx, userRef, uid, requestId, rodType, baitUsed } = input;
  const idempotencyKey = (0, economy_1.castCreateKey)(requestId);
  const castId = deriveCastIdFromRequestId(requestId);
  const domainRodId = (0, rodCatalog_1.uiRodIdToDomain)(rodType);
  const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
    tx,
    userRef,
    idempotencyKey,
  );
  if (idemRead.hit) {
    return idemRead.response;
  }
  const userSnap = await tx.get(userRef);
  const data = userSnap.data() ?? {};
  // Defer counter reset into the final user write — commitEconomyAction still reads.
  const counterResetPatch = (0, dailyCounters_1.buildOperationalCounterResetPatch)(data);
  const activeCast = data.activeCast;
  if (activeCast?.castId) {
    if (activeCast.castId === castId) {
      const readyAt =
        activeCast.readyTimestamp?.toMillis() ?? Date.now() + castTiming_1.CAST_DURATION_MS;
      const existingCreatedAt = activeCast.createdAt?.toMillis?.();
      const response = {
        success: true,
        castId,
        readyAt,
        createdAt: existingCreatedAt ?? Date.now(),
      };
      await (0, commitEconomyAction_1.commitEconomyAction)({
        tx,
        userRef,
        uid,
        idempotencyKey,
        actionType: "cast_create",
        idempotencyMiss: { hit: false },
        build: () => ({
          entry: (0, economy_1.buildAuditOnlyLedgerEntry)({
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
          additionalUserPatch: { ...counterResetPatch },
          response,
        }),
      });
      return response;
    }
    throw new https_1.HttpsError("failed-precondition", "A cast is already active");
  }
  if (domainRodId !== "basic") {
    const rodSnap = await tx.get((0, playerRodHelpers_1.playerRodRef)(uid, domainRodId));
    try {
      (0, fishingPermissionService_1.assertRodOwnedForCast)(domainRodId, rodSnap.data()?.state);
    } catch {
      throw new https_1.HttpsError("failed-precondition", "You do not own this rod yet");
    }
  }
  const readyAt = Date.now() + castTiming_1.CAST_DURATION_MS;
  const createdAtMs = Date.now();
  const { patch: inventoryPatch, baitDeducted } = resolveBaitInventoryPatch(
    baitUsed,
    data.inventory,
  );
  const response = { success: true, castId, readyAt, createdAt: createdAtMs };
  await (0, commitEconomyAction_1.commitEconomyAction)({
    tx,
    userRef,
    uid,
    idempotencyKey,
    actionType: "cast_create",
    idempotencyMiss: { hit: false },
    build: () => {
      const additionalUserPatch = {
        ...counterResetPatch,
        activeCast: {
          castId,
          readyTimestamp: firestore_1.Timestamp.fromMillis(readyAt),
          createdAt: firestore_1.Timestamp.fromMillis(createdAtMs),
          rodType,
          baitUsed,
          baitTier: (0, rodCatalog_1.uiBaitIdToTier)(baitUsed),
          domainRodId,
          baitDeducted,
        },
      };
      if (inventoryPatch) {
        additionalUserPatch.inventory = inventoryPatch;
      }
      return {
        entry: (0, economy_1.buildAuditOnlyLedgerEntry)({
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
