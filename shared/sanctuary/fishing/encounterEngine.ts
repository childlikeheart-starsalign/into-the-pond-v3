import type { BaitTier, ElementType, FishingClaim, FishingRodId, PoolTier } from "../types";
import { pickIndex, rollBelow } from "../random";
import { rodTypeKeyForId } from "../rods/catalog";

/** Mirrors creatures150 ENCOUNTER_RATES — server-authoritative. */
export const ENCOUNTER_RATES = {
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
} as const;

export const MISS_CONSOLATION = {
  common: { materials: 1, wonder: 0 },
  rare: { materials: 1, wonder: 0 },
  epic: { materials: 2, wonder: 0 },
} as const;

export const DUPLICATE_CONSOLATION = {
  common: { materials: 1, wonder: 1, spiritEcho: false },
  rare: { materials: 2, wonder: 2, spiritEcho: false },
  epic: { materials: 3, wonder: 4, spiritEcho: true },
  poolComplete: { materials: 0, wonder: 10, spiritEcho: true },
} as const;

export type CreatureRef = {
  creatureTypeId: string;
  displayName: string;
  poolTier: PoolTier;
  elementType: ElementType;
  rodRequired: string;
  peakWonderGate: number;
};

export function catchChance(
  poolTier: PoolTier,
  elementType: ElementType,
  currentWonder: number,
  hasBait: boolean,
): number {
  const r =
    elementType === "any"
      ? ENCOUNTER_RATES.rareAny
      : poolTier === "common"
        ? ENCOUNTER_RATES.common
        : poolTier === "rare"
          ? ENCOUNTER_RATES.rareElement
          : ENCOUNTER_RATES.epicElement;
  const bonus = Math.min(currentWonder / r.wonderDivisor, r.maxNoBait - r.base);
  const base = Math.min(r.base + bonus, r.maxNoBait);
  return hasBait ? Math.min(base + r.baitBonus, r.maxWithBait) : base;
}

export function poolForRod(rodId: FishingRodId, catalog: CreatureRef[]): CreatureRef[] {
  const rodTypeKey = rodTypeKeyForId(rodId);
  return catalog.filter((c) => c.rodRequired === rodTypeKey);
}

export function selectCandidate(
  pool: CreatureRef[],
  caughtIds: Set<string>,
  seed: string,
): CreatureRef {
  const unseen = pool.filter((c) => !caughtIds.has(c.creatureTypeId));
  const candidates = unseen.length > 0 ? unseen : pool;
  if (candidates.length === 0) {
    throw new Error("Empty creature pool");
  }
  return candidates[pickIndex(seed, candidates.length)];
}

export function rarityIndicatorForTier(tier: PoolTier): FishingClaim["rarityIndicator"] {
  if (tier === "common") return "common";
  if (tier === "rare") return "rare";
  return "epic";
}

export type ResolveClaimInput = {
  claimId: string;
  encounterId: string;
  userId: string;
  castId: string;
  rodId: FishingRodId;
  baitTier: BaitTier | null;
  currentWonderAtClaim: number;
  caughtIds: Set<string>;
  creatureCatalog: CreatureRef[];
  now?: number;
};

export function resolveFishingClaim(input: ResolveClaimInput): FishingClaim {
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

  if (!rollBelow(rollSeed, chance)) {
    const miss = MISS_CONSOLATION[primaryTier as keyof typeof MISS_CONSOLATION];
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
    const dup = DUPLICATE_CONSOLATION[creature.poolTier as keyof typeof DUPLICATE_CONSOLATION];
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

export function spiritEchoForDuplicate(_displayName: string): string {
  return "This one knows you already.";
}

export { toClientClaimSummary, toFishingClaimPresentation } from "./fishingClaimPresentation";
export type { FishingClaimPresentation } from "./fishingClaimPresentation";
