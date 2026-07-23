"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyFishingClaimInTransaction = applyFishingClaimInTransaction;
const firestore_1 = require("firebase-admin/firestore");
const commitEconomyAction_1 = require("./economy/commitEconomyAction");
const economy_1 = require("./economy");
const rodCatalog_1 = require("./rodCatalog");
const fishingClaimPresentation_1 = require("./fishingClaimPresentation");
const wonderRules_1 = require("./wonderRules");
function fishingClaimWonderSource(claim) {
  if (claim.outcome === "duplicate") return "fishing_duplicate_consolation";
  if (claim.outcome === "miss") return "fishing_miss_consolation";
  return "fishing_catch";
}
function omitUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));
}
function fishingClaimLedgerMetadata(claim) {
  return omitUndefined({
    claimId: claim.id,
    outcome: claim.outcome,
    creatureTypeId: claim.creatureTypeId,
    duplicate: claim.outcome === "duplicate",
  });
}
function buildFishingClaimLedgerResult(input) {
  const {
    uid,
    account,
    claim,
    castId,
    transactionId,
    materials,
    additionalUserPatch,
    claimSummary,
  } = input;
  const wonderSource = fishingClaimWonderSource(claim);
  const idempotencyKey = (0, economy_1.fishingClaimKey)(castId);
  const metadata = fishingClaimLedgerMetadata(claim);
  if (claim.wonderAwarded > 0) {
    const { transaction } = (0, economy_1.applyWonderEarnInMemory)(account, {
      source: wonderSource,
      amount: claim.wonderAwarded,
      transactionId,
      metadata,
    });
    const entry = (0, economy_1.buildEconomyLedgerEntry)({
      uid,
      actionType: "fishing_claim",
      source: wonderSource,
      transaction,
      idempotencyKey,
      correlationId: castId,
      metadata,
      deltaMaterials: { feather: materials },
    });
    return {
      entry,
      additionalUserPatch,
      response: claimSummary,
    };
  }
  const transaction = {
    id: transactionId,
    userId: uid,
    timestamp: Date.now(),
    source: wonderSource,
    amount: 0,
    metadata: {},
  };
  const entry = (0, economy_1.buildEconomyLedgerEntry)({
    uid,
    actionType: "fishing_claim",
    source: wonderSource,
    transaction,
    idempotencyKey,
    correlationId: castId,
    metadata,
    deltaMaterials: { feather: materials },
  });
  return {
    entry,
    additionalUserPatch,
    response: claimSummary,
  };
}
/** Persistence only — no probability logic. Ledger commit is the causal anchor (Invariant 4). */
async function applyFishingClaimInTransaction(tx, input) {
  const {
    uid,
    userRef,
    data,
    claim,
    rodUiId,
    castId,
    nextFishingPity,
    idempotencyMiss,
    counterResetPatch,
  } = input;
  const rodId = (0, rodCatalog_1.uiRodIdToDomain)(rodUiId);
  const idempotencyKey = (0, economy_1.fishingClaimKey)(castId);
  const transactionId = `tx_${claim.id}`;
  const materials = claim.materialsAwarded;
  const fishingWonderToday = data.fishingWonderToday ?? 0;
  const remainingCap = Math.max(0, wonderRules_1.DAILY_FISHING_WONDER_CAP - fishingWonderToday);
  const effectiveWonderAwarded = Math.min(claim.wonderAwarded, remainingCap);
  const cappedClaim = { ...claim, wonderAwarded: effectiveWonderAwarded };
  const additionalUserPatch = {
    ...(counterResetPatch ?? {}),
    activeCast: null,
    lastClaimedCastId: castId,
    fishingWonderToday: fishingWonderToday + effectiveWonderAwarded,
    ...(nextFishingPity ? { fishingPity: nextFishingPity } : {}),
  };
  const claimSummary = {
    ...(0, fishingClaimPresentation_1.toClientClaimSummary)(claim),
    wonderAwarded: effectiveWonderAwarded,
  };
  const economyCommit = await (0, commitEconomyAction_1.commitEconomyAction)({
    tx,
    userRef,
    uid,
    idempotencyKey,
    actionType: "fishing_claim",
    touchReflection: false,
    idempotencyMiss,
    build: ({ account }) =>
      buildFishingClaimLedgerResult({
        uid,
        account,
        claim: cappedClaim,
        castId,
        transactionId,
        materials,
        additionalUserPatch,
        claimSummary,
      }),
  });
  if (economyCommit.committed) {
    if (claim.outcome === "catch" && claim.creatureTypeId) {
      tx.set(userRef.collection("creatures").doc(claim.creatureTypeId), {
        creatureId: claim.creatureTypeId,
        name: claim.creatureDisplayName ?? claim.creatureTypeId,
        rarity:
          claim.poolTier === "common" ? "basic" : claim.poolTier === "rare" ? "rare" : "legendary",
        caughtAt: firestore_1.Timestamp.now(),
        rodRequired: (0, rodCatalog_1.rodTypeKeyForId)(rodId),
      });
    }
    tx.set(userRef.collection("fishingClaims").doc(claim.id), {
      ...omitUndefined(claim),
      claimedAt: firestore_1.Timestamp.fromMillis(claim.claimedAt),
    });
    const analyticsRef = userRef.collection("sanctuaryAnalytics").doc();
    tx.set(analyticsRef, {
      type: "fishing_claim",
      userId: uid,
      outcome: claim.outcome,
      duplicate: claim.outcome === "duplicate",
      rarityIndicator: claim.rarityIndicator,
      timestamp: Date.now(),
    });
  }
  return economyCommit.result;
}
