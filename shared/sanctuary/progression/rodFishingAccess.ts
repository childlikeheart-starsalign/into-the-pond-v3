import type { CreatureRef } from "../fishing/encounterEngine";
import type { FishingRodId, PoolTier } from "../types";
import { fishingPermissionForRod } from "./fishingPermissions";

const POOL_TIER_RANK: Record<PoolTier, number> = {
  common: 0,
  rare: 1,
  epic: 2,
};

/** Client/server shared pool filter for rod fishing permissions. */
export function filterCreaturesByRodPermission(
  rodId: FishingRodId,
  catalog: CreatureRef[],
): CreatureRef[] {
  const permission = fishingPermissionForRod(rodId);
  const maxRank = POOL_TIER_RANK[permission.maxTier];

  return catalog.filter((creature) => {
    const tierRank = POOL_TIER_RANK[creature.poolTier];
    if (tierRank > maxRank) return false;
    if (permission.elements.includes("any")) return true;
    return permission.elements.includes(creature.elementType);
  });
}

export function isRodOwnedForFishing(state: string | undefined): boolean {
  return state === "ready" || state === "equipped";
}
