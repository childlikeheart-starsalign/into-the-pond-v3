"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFishingClaimPresentation =
  exports.toClientClaimSummary =
  exports.DUPLICATE_CONSOLATION =
  exports.MISS_CONSOLATION =
  exports.ENCOUNTER_RATES =
    void 0;
exports.catchChance = catchChance;
exports.poolForRod = poolForRod;
exports.selectCandidate = selectCandidate;
exports.rarityIndicatorForTier = rarityIndicatorForTier;
exports.resolveFishingClaim = resolveFishingClaim;
exports.spiritEchoForDuplicate = spiritEchoForDuplicate;
const random_1 = require("./random");
const rodCatalog_1 = require("./rodCatalog");
/** Mirrors creatures150 ENCOUNTER_RATES — server-authoritative. */
exports.ENCOUNTER_RATES = {
  common: { base: 0.55, wonderDivisor: 600, maxNoBait: 0.7, baitBonus: 0.0, maxWithBait: 0.7 },
  rareElement: {
    base: 0.14,
    wonderDivisor: 500,
    maxNoBait: 0.2,
    baitBonus: 0.06,
    maxWithBait: 0.26,
  },
  rareAny: { base: 0.06, wonderDivisor: 600, maxNoBait: 0.1, baitBonus: 0.05, maxWithBait: 0.15 },
  epicElement: {
    base: 0.03,
    wonderDivisor: 700,
    maxNoBait: 0.07,
    baitBonus: 0.05,
    maxWithBait: 0.12,
  },
};
exports.MISS_CONSOLATION = {
  common: { materials: 1, wonder: 0 },
  rare: { materials: 1, wonder: 0 },
  epic: { materials: 2, wonder: 0 },
};
exports.DUPLICATE_CONSOLATION = {
  common: { materials: 1, wonder: 1, spiritEcho: false },
  rare: { materials: 2, wonder: 2, spiritEcho: false },
  epic: { materials: 3, wonder: 4, spiritEcho: true },
  poolComplete: { materials: 0, wonder: 10, spiritEcho: true },
};
function catchChance(poolTier, elementType, currentWonder, hasBait) {
  const r =
    elementType === "any"
      ? exports.ENCOUNTER_RATES.rareAny
      : poolTier === "common"
        ? exports.ENCOUNTER_RATES.common
        : poolTier === "rare"
          ? exports.ENCOUNTER_RATES.rareElement
          : exports.ENCOUNTER_RATES.epicElement;
  const bonus = Math.min(currentWonder / r.wonderDivisor, r.maxNoBait - r.base);
  const base = Math.min(r.base + bonus, r.maxNoBait);
  return hasBait ? Math.min(base + r.baitBonus, r.maxWithBait) : base;
}
function poolForRod(rodId, catalog) {
  const rodTypeKey = (0, rodCatalog_1.rodTypeKeyForId)(rodId);
  return catalog.filter((c) => c.rodRequired === rodTypeKey);
}
function selectCandidate(pool, caughtIds, seed) {
  const unseen = pool.filter((c) => !caughtIds.has(c.creatureTypeId));
  const candidates = unseen.length > 0 ? unseen : pool;
  if (candidates.length === 0) {
    throw new Error("Empty creature pool");
  }
  return candidates[(0, random_1.pickIndex)(seed, candidates.length)];
}
function rarityIndicatorForTier(tier) {
  if (tier === "common") return "common";
  if (tier === "rare") return "rare";
  return "epic";
}
function resolveFishingClaim(input) {
  const {
    claimId,
    encounterId,
    userId,
    castId,
    rodId,
    baitTier,
    currentWonderAtClaim,
    caughtIds,
    creatureCatalog,
    now = Date.now(),
  } = input;
  const pool = poolForRod(rodId, creatureCatalog).filter(
    (c) => currentWonderAtClaim >= c.peakWonderGate,
  );
  if (pool.length === 0) {
    return {
      id: claimId,
      encounterId,
      userId,
      claimedAt: now,
      currentWonderAtClaim,
      outcome: "miss",
      poolTier: "common",
      rarityIndicator: "common",
      wonderAwarded: 0,
      materialsAwarded: 1,
      spiritMessage: "The pond is still. Reflect, and return when you are ready.",
      metadata: { castId, reason: "wonder_gate" },
    };
  }
  const primaryTier = pool[0]?.poolTier ?? "common";
  const element = pool[0]?.elementType ?? "any";
  const hasBait = baitTier != null;
  const chance = catchChance(primaryTier, element, currentWonderAtClaim, hasBait);
  const rollSeed = `${userId}:${castId}:catch`;
  if (!(0, random_1.rollBelow)(rollSeed, chance)) {
    const miss = exports.MISS_CONSOLATION[primaryTier];
    return {
      id: claimId,
      encounterId,
      userId,
      claimedAt: now,
      currentWonderAtClaim,
      outcome: "miss",
      poolTier: primaryTier,
      rarityIndicator: rarityIndicatorForTier(primaryTier),
      wonderAwarded: miss.wonder,
      materialsAwarded: miss.materials,
      spiritMessage: "Not this time. The water remembers your patience.",
      metadata: { castId },
    };
  }
  const creature = selectCandidate(pool, caughtIds, `${rollSeed}:creature`);
  const isDuplicate = caughtIds.has(creature.creatureTypeId);
  if (isDuplicate) {
    const dup = exports.DUPLICATE_CONSOLATION[creature.poolTier];
    return {
      id: claimId,
      encounterId,
      userId,
      claimedAt: now,
      currentWonderAtClaim,
      outcome: "duplicate",
      creatureTypeId: creature.creatureTypeId,
      creatureDisplayName: creature.displayName,
      poolTier: creature.poolTier,
      rarityIndicator: rarityIndicatorForTier(creature.poolTier),
      wonderAwarded: dup.wonder,
      materialsAwarded: dup.materials,
      spiritMessage: spiritEchoForDuplicate(creature.displayName),
      metadata: { castId, spiritEcho: "duplicate" in dup ? dup.spiritEcho : false },
    };
  }
  return {
    id: claimId,
    encounterId,
    userId,
    claimedAt: now,
    currentWonderAtClaim,
    outcome: "catch",
    creatureTypeId: creature.creatureTypeId,
    creatureDisplayName: creature.displayName,
    poolTier: creature.poolTier,
    rarityIndicator: rarityIndicatorForTier(creature.poolTier),
    wonderAwarded: 0,
    materialsAwarded: 0,
    metadata: { castId },
  };
}
function spiritEchoForDuplicate(_displayName) {
  return "This one knows you already.";
}
var fishingClaimPresentation_1 = require("./fishingClaimPresentation");
Object.defineProperty(exports, "toClientClaimSummary", {
  enumerable: true,
  get: function () {
    return fishingClaimPresentation_1.toClientClaimSummary;
  },
});
Object.defineProperty(exports, "toFishingClaimPresentation", {
  enumerable: true,
  get: function () {
    return fishingClaimPresentation_1.toFishingClaimPresentation;
  },
});
