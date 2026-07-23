"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fishingClaimDocId = fishingClaimDocId;
exports.resolveClaimCastId = resolveClaimCastId;
exports.executeClaimCastInTransaction = executeClaimCastInTransaction;
exports.executeClaimCast = executeClaimCast;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const init_1 = require("../init");
const applyFishingClaim_1 = require("./applyFishingClaim");
const creatureCatalog_1 = require("./creatureCatalog");
const buildFishingClaimContext_1 = require("./buildFishingClaimContext");
const fishingClaimPresentation_1 = require("./fishingClaimPresentation");
const economy_1 = require("./economy");
const resolveCallableIdempotency_1 = require("./economy/resolveCallableIdempotency");
const dailyCounters_1 = require("./dailyCounters");
/** Deterministic fishingClaims doc id per cast (Invariant 8). */
function fishingClaimDocId(castId) {
  return `claim_${castId}`;
}
/** Server-authoritative castId — never from client payload. */
function resolveClaimCastId(data) {
  if (data.activeCast?.castId) return data.activeCast.castId;
  if (data.lastClaimedCastId) return data.lastClaimedCastId;
  return null;
}
function normalizeStoredClaim(raw) {
  const claimedAt = raw.claimedAt;
  const claimedAtMs =
    claimedAt && typeof claimedAt === "object" && "toMillis" in claimedAt
      ? claimedAt.toMillis()
      : typeof claimedAt === "number"
        ? claimedAt
        : Date.now();
  return {
    id: String(raw.id ?? ""),
    encounterId: String(raw.encounterId ?? raw.castId ?? ""),
    userId: String(raw.userId ?? ""),
    claimedAt: claimedAtMs,
    currentWonderAtClaim: Number(raw.currentWonderAtClaim ?? 0),
    outcome: raw.outcome,
    creatureTypeId: raw.creatureTypeId,
    creatureDisplayName: raw.creatureDisplayName,
    poolTier: raw.poolTier,
    rarityIndicator: raw.rarityIndicator,
    wonderAwarded: Number(raw.wonderAwarded ?? 0),
    materialsAwarded: Number(raw.materialsAwarded ?? 0),
    spiritMessage: raw.spiritMessage,
    metadata: raw.metadata ?? {},
  };
}
async function loadCachedClaimSummaryFromLedger(tx, userRef, castId) {
  const ledgerRef = userRef
    .collection("economyLedger")
    .doc((0, economy_1.ledgerEntryIdForKey)((0, economy_1.fishingClaimKey)(castId)));
  const ledgerSnap = await tx.get(ledgerRef);
  if (!ledgerSnap.exists) return null;
  const claimRef = userRef.collection("fishingClaims").doc(fishingClaimDocId(castId));
  const claimSnap = await tx.get(claimRef);
  if (!claimSnap.exists) return null;
  firebase_functions_1.logger.warn(
    "Fishing claim idempotency miss but ledger + fishingClaims exist — returning stored claim",
    {
      castId,
      ledgerEntryId: ledgerRef.id,
    },
  );
  return (0, fishingClaimPresentation_1.toClientClaimSummary)(
    normalizeStoredClaim(claimSnap.data()),
  );
}
function assertActiveCastReadyForClaim(cast, castId) {
  if (!cast.castId || !cast.readyTimestamp) {
    throw new https_1.HttpsError("failed-precondition", "No active cast to claim");
  }
  if (cast.castId !== castId) {
    throw new https_1.HttpsError("failed-precondition", "Active cast does not match claim target");
  }
  if (cast.readyTimestamp.toMillis() > Date.now()) {
    throw new https_1.HttpsError("failed-precondition", "Cast is not ready yet");
  }
}
async function executeClaimCastInTransaction(tx, uid, userRef) {
  const userSnap = await tx.get(userRef);
  const data = userSnap.data() ?? {};
  // Defer counter reset into applyFishingClaim's final user write — more reads follow.
  const counterResetPatch = (0, dailyCounters_1.buildOperationalCounterResetPatch)(data);
  const castId = resolveClaimCastId(data);
  if (!castId) {
    throw new https_1.HttpsError("failed-precondition", "No active cast to claim");
  }
  const idempotencyKey = (0, economy_1.fishingClaimKey)(castId);
  const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
    tx,
    userRef,
    idempotencyKey,
  );
  if (idemRead.hit) {
    return { claimSummary: idemRead.response };
  }
  const cast = data.activeCast;
  if (!cast?.castId || !cast.readyTimestamp) {
    const ledgerCached = await loadCachedClaimSummaryFromLedger(tx, userRef, castId);
    if (ledgerCached) {
      return { claimSummary: ledgerCached };
    }
    throw new https_1.HttpsError("failed-precondition", "No active cast to claim");
  }
  assertActiveCastReadyForClaim(cast, castId);
  const creaturesSnap = await tx.get(userRef.collection("creatures"));
  const caughtIds = new Set(creaturesSnap.docs.map((doc) => doc.id));
  const currentWonderAtClaim = data.currentWonder ?? data.totalWonder ?? 0;
  const claimResult = (0, buildFishingClaimContext_1.resolveFishingClaimFromContext)({
    claimId: fishingClaimDocId(castId),
    encounterId: castId,
    userId: uid,
    castId,
    rodUiId: cast.rodType ?? "basic",
    baitUiId: cast.baitUsed ?? "random_bait",
    currentWonderAtClaim,
    caughtIds,
    creatureCatalog: creatureCatalog_1.CREATURE_REFS,
    fishingPity: data.fishingPity,
  });
  const claimSummary = await (0, applyFishingClaim_1.applyFishingClaimInTransaction)(tx, {
    uid,
    userRef,
    data,
    claim: claimResult.claim,
    rodUiId: cast.rodType ?? "basic",
    castId,
    nextFishingPity: claimResult.nextFishingPity,
    idempotencyMiss: { hit: false },
    counterResetPatch,
  });
  return { claimSummary };
}
async function executeClaimCast(uid, userRef) {
  return init_1.db.runTransaction((tx) => executeClaimCastInTransaction(tx, uid, userRef));
}
