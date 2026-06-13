import {
  POOL,
  selectCandidate,
  type Creature,
  type ElementType,
} from "@/src/features/creatures/creatures150";
import { getRodById, type FishingElement } from "@/src/features/fishing/fishingData";

export type FishingCatchReward = {
  caughtAt: number;
  rodIdAtCast: string;
  creature: Creature;
};

const RARE_POOL = [
  ...POOL.rarefire,
  ...POOL.rarewater,
  ...POOL.rarewind,
  ...POOL.rareelectric,
  ...POOL.rareany,
];

function epicPoolForElement(element: FishingElement | undefined): Creature[] {
  switch (element) {
    case "fire":
      return POOL.epicfire;
    case "water":
      return POOL.epicwater;
    case "wind":
      return POOL.epicwind;
    case "electric":
      return POOL.epicelectric;
    default:
      return POOL.common;
  }
}

export function getFishingRewardPool(rodId: string): Creature[] {
  const rod = getRodById(rodId);

  if (rod.tier === "epic") {
    return epicPoolForElement(rod.element);
  }

  if (rod.tier === "rare") {
    return RARE_POOL;
  }

  return POOL.common;
}

export function resolveFishingCatchReward(
  rodIdAtCast: string,
  caughtIds: Set<string> = new Set(),
): FishingCatchReward {
  const pool = getFishingRewardPool(rodIdAtCast);
  const creature = selectCandidate(pool.length > 0 ? pool : POOL.common, caughtIds);

  return {
    caughtAt: Date.now(),
    rodIdAtCast,
    creature,
  };
}

export function rewardPoolLabel(rodId: string): "common" | "rare" | `epic-${ElementType}` {
  const rod = getRodById(rodId);
  if (rod.tier === "epic" && rod.element && rod.element !== "any") {
    return `epic-${rod.element}`;
  }
  if (rod.tier === "rare") return "rare";
  return "common";
}
