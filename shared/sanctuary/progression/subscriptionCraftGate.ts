import type { FishingRodId } from "../types";
import {
  EPIC_ELEMENT_ROD_IDS,
  moduleIdForRareRod,
  RARE_ELEMENT_ROD_IDS,
  WILDCARD_ROD_ID,
} from "./moduleRodMap";
import type { SubscriptionCraftTier } from "./types";

/** Highest module whose rare rod can be crafted at this subscription tier. */
export function maxCraftableModuleId(tier: SubscriptionCraftTier): number {
  switch (tier) {
    case "free":
      return 0;
    case "wooden":
      return 3;
    case "fiberglass":
    case "lifetime":
      return 5;
    default:
      return 0;
  }
}

export function canCraftRodBySubscription(
  rodId: FishingRodId,
  tier: SubscriptionCraftTier,
): boolean {
  if (rodId === "basic" || rodId === WILDCARD_ROD_ID) {
    return false;
  }

  if ((RARE_ELEMENT_ROD_IDS as readonly string[]).includes(rodId)) {
    const moduleId = moduleIdForRareRod(rodId);
    if (moduleId == null) return false;
    return moduleId <= maxCraftableModuleId(tier);
  }

  if ((EPIC_ELEMENT_ROD_IDS as readonly string[]).includes(rodId)) {
    return tier === "fiberglass" || tier === "lifetime";
  }

  return false;
}
