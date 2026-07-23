"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFishingClaimPresentation =
  exports.toClientClaimSummary =
  exports.EPIC_TOP_RARE_PITY_STEP =
  exports.EPIC_TOP_RARE_DRY_THRESHOLD =
  exports.CHANCE_MISS_PITY_THRESHOLD =
  exports.SHEET_C_BASE_WEIGHTS =
  exports.DUPLICATE_CONSOLATION =
  exports.MISS_CONSOLATION =
  exports.SHEET_D_TIERS_REMOVED =
  exports.SHEET_D_CATCH_BONUS =
  exports.WONDER_GATE_LADDER =
  exports.ENCOUNTER_RATES =
    void 0;
exports.sheetDCatchBonus = sheetDCatchBonus;
exports.sheetDTiersRemoved = sheetDTiersRemoved;
exports.effectiveWonderGate = effectiveWonderGate;
exports.catchChance = catchChance;
exports.poolForRod = poolForRod;
exports.sheetCWeightProfileForRod = sheetCWeightProfileForRod;
exports.isEpicFishingRodId = isEpicFishingRodId;
exports.epicTopRarePityMultiplier = epicTopRarePityMultiplier;
exports.baseWeightForCreature = baseWeightForCreature;
exports.creatureWeights = creatureWeights;
exports.topRareShareGivenCatch = topRareShareGivenCatch;
exports.selectCandidate = selectCandidate;
exports.rarityIndicatorForTier = rarityIndicatorForTier;
exports.normalizeFishingPity = normalizeFishingPity;
exports.nextFishingPityAfterClaim = nextFishingPityAfterClaim;
exports.resolveFishingClaim = resolveFishingClaim;
exports.spiritEchoForDuplicate = spiritEchoForDuplicate;
const types_1 = require("./types");
const random_1 = require("./random");
const rodCatalog_1 = require("./rodCatalog");
const fishingOutcomeMessages_1 = require("./fishingOutcomeMessages");
/** Wonder-scaled catch bases — Sheet D bait bonuses apply on top (not these legacy baitBonus fields). */
exports.ENCOUNTER_RATES = {
  common: { base: 0.55, wonderDivisor: 600, maxNoBait: 0.7 },
  rareElement: { base: 0.14, wonderDivisor: 500, maxNoBait: 0.2 },
  rareAny: { base: 0.06, wonderDivisor: 600, maxNoBait: 0.1 },
  epicElement: { base: 0.03, wonderDivisor: 700, maxNoBait: 0.07 },
};
/** Sheet A discrete wonder-gate ladder (not linear gateStep). */
exports.WONDER_GATE_LADDER = [0, 40, 65, 90];
/** Sheet D — catch% additive bonuses by domain bait tier (basic/mid/premium → basic/rare/epic). */
exports.SHEET_D_CATCH_BONUS = {
  basic: 0.05,
  rare: 0.12,
  epic: 0.2,
};
/** Sheet D — wonder-gate tiers removed by bait. */
exports.SHEET_D_TIERS_REMOVED = {
  basic: 0,
  rare: 1,
  epic: 2,
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
exports.SHEET_C_BASE_WEIGHTS = {
  basic: { uniform: 1, "common-rare": 1, "mid-rare": 1, "top-rare": 1 },
  rare: { uniform: 1, "common-rare": 23, "mid-rare": 6, "top-rare": 4 },
  /** epic1 / epic2 — 13-creature pools */
  epic13: { uniform: 1, "common-rare": 3, "mid-rare": 3, "top-rare": 2 },
  /** epic3 / epic4 — 12-creature pools */
  epic12: { uniform: 1, "common-rare": 18, "mid-rare": 15, "top-rare": 10 },
};
exports.CHANCE_MISS_PITY_THRESHOLD = 10;
exports.EPIC_TOP_RARE_DRY_THRESHOLD = 20;
exports.EPIC_TOP_RARE_PITY_STEP = 0.15;
function sheetDCatchBonus(baitTier) {
  if (baitTier == null) return 0;
  return exports.SHEET_D_CATCH_BONUS[baitTier];
}
function sheetDTiersRemoved(baitTier) {
  if (baitTier == null) return 0;
  return exports.SHEET_D_TIERS_REMOVED[baitTier];
}
/**
 * Sheet D gate unlock: walk WONDER_GATE_LADDER back by removedTiers.
 * 1.1 clamp: rare-element base 40W never drops (removedTiers have no gate effect).
 */
function effectiveWonderGate(peakWonderGate, baitTier) {
  if (peakWonderGate === 40) return 40;
  const baseIndex = exports.WONDER_GATE_LADDER.indexOf(peakWonderGate);
  if (baseIndex < 0) return peakWonderGate;
  const targetIndex = Math.max(0, baseIndex - sheetDTiersRemoved(baitTier));
  return exports.WONDER_GATE_LADDER[targetIndex];
}
function catchChance(poolTier, elementType, currentWonder, baitTier) {
  const r =
    elementType === "any"
      ? exports.ENCOUNTER_RATES.rareAny
      : poolTier === "common"
        ? exports.ENCOUNTER_RATES.common
        : poolTier === "rare"
          ? exports.ENCOUNTER_RATES.rareElement
          : exports.ENCOUNTER_RATES.epicElement;
  const wonderBonus = Math.min(currentWonder / r.wonderDivisor, r.maxNoBait - r.base);
  const base = Math.min(r.base + wonderBonus, r.maxNoBait);
  return Math.min(base + sheetDCatchBonus(baitTier), 1);
}
function poolForRod(rodId, catalog) {
  const rodTypeKey = (0, rodCatalog_1.rodTypeKeyForId)(rodId);
  return catalog.filter((c) => c.rodRequired === rodTypeKey);
}
function sheetCWeightProfileForRod(rodId) {
  const key = (0, rodCatalog_1.rodTypeKeyForId)(rodId);
  if (key === "basic") return "basic";
  if (key === "epic1" || key === "epic2") return "epic13";
  if (key === "epic3" || key === "epic4") return "epic12";
  return "rare";
}
function isEpicFishingRodId(rodId) {
  return (
    rodId === "epic_fire" ||
    rodId === "epic_water" ||
    rodId === "epic_wind" ||
    rodId === "epic_electric"
  );
}
/** Casts past the 20-cast threshold → multiplier on each top-rare creature weight. */
function epicTopRarePityMultiplier(dryStreak) {
  const past = Math.max(0, dryStreak - exports.EPIC_TOP_RARE_DRY_THRESHOLD);
  return 1 + exports.EPIC_TOP_RARE_PITY_STEP * past;
}
function baseWeightForCreature(creature, profile, topRareMultiplier = 1) {
  const table = exports.SHEET_C_BASE_WEIGHTS[profile];
  const sub = creature.sub_tier in table ? creature.sub_tier : "uniform";
  const base = table[sub] ?? 1;
  if (sub === "top-rare" && topRareMultiplier !== 1) {
    return base * topRareMultiplier;
  }
  return base;
}
/** Per-creature weights for an eligible candidate list (Sheet C + optional epic pity). */
function creatureWeights(candidates, rodId, topRareMultiplier = 1) {
  const profile = sheetCWeightProfileForRod(rodId);
  return candidates.map((c) => baseWeightForCreature(c, profile, topRareMultiplier));
}
/** P(top-rare | catch) for regression / Sheet E arithmetic checks. */
function topRareShareGivenCatch(candidates, rodId, dryStreak) {
  const mult = epicTopRarePityMultiplier(dryStreak);
  const weights = creatureWeights(candidates, rodId, mult);
  let total = 0;
  let top = 0;
  for (let i = 0; i < candidates.length; i += 1) {
    total += weights[i];
    if (candidates[i].sub_tier === "top-rare") top += weights[i];
  }
  return total > 0 ? top / total : 0;
}
function selectCandidate(pool, caughtIds, seed, rodId, topRareMultiplier = 1) {
  const unseen = pool.filter((c) => !caughtIds.has(c.creatureTypeId));
  const candidates = unseen.length > 0 ? unseen : pool;
  if (candidates.length === 0) {
    throw new Error("Empty creature pool");
  }
  const weights = creatureWeights(candidates, rodId, topRareMultiplier);
  return candidates[(0, random_1.pickWeightedIndex)(seed, weights)];
}
function rarityIndicatorForTier(tier) {
  if (tier === "common") return "common";
  if (tier === "rare") return "rare";
  return "epic";
}
function normalizeFishingPity(pity) {
  return {
    consecutiveChanceMisses: pity?.consecutiveChanceMisses ?? 0,
    epicTopRareDryStreak: { ...(pity?.epicTopRareDryStreak ?? {}) },
  };
}
function nextFishingPityAfterClaim(input) {
  const next = normalizeFishingPity(input.prev);
  if (input.reason === "wonder_gate") {
    // Excluded entirely — neither increments nor resets consecutiveChanceMisses.
  } else if (input.outcome === "miss") {
    next.consecutiveChanceMisses += 1;
  } else {
    next.consecutiveChanceMisses = 0;
  }
  if (isEpicFishingRodId(input.rodId) && input.reason !== "wonder_gate") {
    const landedTopRare =
      (input.outcome === "catch" || input.outcome === "duplicate") &&
      input.creatureSubTier === "top-rare";
    if (landedTopRare) {
      next.epicTopRareDryStreak[input.rodId] = 0;
    } else {
      next.epicTopRareDryStreak[input.rodId] =
        (input.prev.epicTopRareDryStreak[input.rodId] ?? 0) + 1;
    }
  }
  return next;
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
  const pity = normalizeFishingPity(input.fishingPity ?? types_1.DEFAULT_FISHING_PITY);
  const dryStreak = isEpicFishingRodId(rodId) ? (pity.epicTopRareDryStreak[rodId] ?? 0) : 0;
  const topRareMultiplier = epicTopRarePityMultiplier(dryStreak);
  const pool = poolForRod(rodId, creatureCatalog).filter(
    (c) => currentWonderAtClaim >= effectiveWonderGate(c.peakWonderGate, baitTier),
  );
  if (pool.length === 0) {
    const claim = {
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
      spiritMessage: (0, fishingOutcomeMessages_1.pickMessageVariant)(
        `${userId}:${castId}:msg:gate`,
        fishingOutcomeMessages_1.MISS_WONDER_GATE_MESSAGES,
      ),
      metadata: { castId, reason: "wonder_gate" },
    };
    return {
      claim,
      nextFishingPity: nextFishingPityAfterClaim({
        prev: pity,
        rodId,
        outcome: "miss",
        reason: "wonder_gate",
      }),
    };
  }
  const primaryTier = pool[0]?.poolTier ?? "common";
  const element = pool[0]?.elementType ?? "any";
  const chance = catchChance(primaryTier, element, currentWonderAtClaim, baitTier);
  const rollSeed = `${userId}:${castId}:catch`;
  const guaranteedCatch = pity.consecutiveChanceMisses >= exports.CHANCE_MISS_PITY_THRESHOLD;
  if (!guaranteedCatch && !(0, random_1.rollBelow)(rollSeed, chance)) {
    const miss = exports.MISS_CONSOLATION[primaryTier];
    const claim = {
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
      spiritMessage: (0, fishingOutcomeMessages_1.pickMessageVariant)(
        `${userId}:${castId}:msg:miss`,
        fishingOutcomeMessages_1.MISS_CHANCE_MESSAGES,
      ),
      metadata: { castId, reason: "chance" },
    };
    return {
      claim,
      nextFishingPity: nextFishingPityAfterClaim({
        prev: pity,
        rodId,
        outcome: "miss",
        reason: "chance",
      }),
    };
  }
  const creature = selectCandidate(
    pool,
    caughtIds,
    `${rollSeed}:creature`,
    rodId,
    topRareMultiplier,
  );
  const isDuplicate = caughtIds.has(creature.creatureTypeId);
  const msgSeed = `${userId}:${castId}:msg`;
  if (isDuplicate) {
    const dup = exports.DUPLICATE_CONSOLATION[creature.poolTier];
    const claim = {
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
      spiritMessage: (0, fishingOutcomeMessages_1.fillCreatureName)(
        (0, fishingOutcomeMessages_1.pickMessageVariant)(
          `${msgSeed}:dup`,
          fishingOutcomeMessages_1.DUPLICATE_CATCH_MESSAGES,
        ),
        creature.displayName,
      ),
      metadata: {
        castId,
        spiritEcho: "spiritEcho" in dup ? dup.spiritEcho : false,
        guaranteedCatch,
      },
    };
    return {
      claim,
      nextFishingPity: nextFishingPityAfterClaim({
        prev: pity,
        rodId,
        outcome: "duplicate",
        creatureSubTier: creature.sub_tier,
      }),
    };
  }
  const claim = {
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
    spiritMessage: (0, fishingOutcomeMessages_1.fillCreatureName)(
      (0, fishingOutcomeMessages_1.pickMessageVariant)(
        `${msgSeed}:catch`,
        fishingOutcomeMessages_1.NEW_CATCH_MESSAGES,
      ),
      creature.displayName,
    ),
    metadata: { castId, guaranteedCatch },
  };
  return {
    claim,
    nextFishingPity: nextFishingPityAfterClaim({
      prev: pity,
      rodId,
      outcome: "catch",
      creatureSubTier: creature.sub_tier,
    }),
  };
}
/** @deprecated Prefer DUPLICATE_CATCH_MESSAGES via resolveFishingClaim. */
function spiritEchoForDuplicate(displayName) {
  return (0, fishingOutcomeMessages_1.fillCreatureName)(
    fishingOutcomeMessages_1.DUPLICATE_CATCH_MESSAGES[0],
    displayName,
  );
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
