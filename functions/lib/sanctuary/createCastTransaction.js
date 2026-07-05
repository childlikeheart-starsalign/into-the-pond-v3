"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAST_DURATION_MS = void 0;
exports.deriveCastIdFromRequestId = deriveCastIdFromRequestId;
exports.runCreateCastInTransaction = runCreateCastInTransaction;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const dailyCounters_1 = require("./dailyCounters");
const economy_1 = require("./economy");
const commitEconomyAction_1 = require("./economy/commitEconomyAction");
const resolveCallableIdempotency_1 = require("./economy/resolveCallableIdempotency");
const playerRodHelpers_1 = require("./progression/playerRodHelpers");
const fishingPermissionService_1 = require("./progression/fishingPermissionService");
const rodCatalog_1 = require("./rodCatalog");
exports.CAST_DURATION_MS = 2 * 60 * 1000;
const CONSUMABLE_BAIT_IDS = new Set(["feather_bait", "scale_bait", "glimmerdust_bait"]);
function resolveBaitInventoryPatch(baitUsed, inventory) {
  const normalized = (baitUsed ?? "").trim();
  if (!normalized || normalized === "random_bait") {
    return { patch: undefined, baitDeducted: false };
  }
  if (!CONSUMABLE_BAIT_IDS.has(normalized)) {
    throw new https_1.HttpsError("failed-precondition", "Unknown bait type");
  }
  const baits = inventory?.baits ?? {};
  const balance = baits[normalized] ?? 0;
  if (balance < 1) {
    throw new https_1.HttpsError("failed-precondition", "Insufficient bait");
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
  (0, dailyCounters_1.applyOperationalCounterResetsInTransaction)(tx, userRef, data);
  const activeCast = data.activeCast;
  if (activeCast?.castId) {
    if (activeCast.castId === castId) {
      const readyAt =
        activeCast.readyTimestamp?.toMillis() ?? Date.now() + exports.CAST_DURATION_MS;
      const response = { success: true, castId, readyAt };
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
  const readyAt = Date.now() + exports.CAST_DURATION_MS;
  const { patch: inventoryPatch, baitDeducted } = resolveBaitInventoryPatch(
    baitUsed,
    data.inventory,
  );
  const response = { success: true, castId, readyAt };
  await (0, commitEconomyAction_1.commitEconomyAction)({
    tx,
    userRef,
    uid,
    idempotencyKey,
    actionType: "cast_create",
    idempotencyMiss: { hit: false },
    build: () => {
      const additionalUserPatch = {
        activeCast: {
          castId,
          readyTimestamp: firestore_1.Timestamp.fromMillis(readyAt),
          rodType,
          baitUsed,
          baitTier: (0, rodCatalog_1.uiBaitIdToTier)(baitUsed),
          domainRodId,
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
