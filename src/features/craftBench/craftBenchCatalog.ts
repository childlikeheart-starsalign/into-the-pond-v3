import type { FishingRodId } from "@/shared/sanctuary/types";
import type { PlayerRodRecord } from "@/shared/sanctuary/progression";
import {
  EPIC_ELEMENT_ROD_IDS,
  isCraftTimerComplete,
  PHASE1_CRAFTABLE_RARE_ROD_IDS,
  WILDCARD_ROD_ID,
} from "@/shared/sanctuary/progression";

export type CraftBenchCatalogTier = "rare" | "epic";

export function isWildcardRodVisible(record: PlayerRodRecord | undefined): boolean {
  if (!record) return false;
  return record.state !== "locked";
}

export function hasEpicCatalog(
  playerRods: Partial<Record<FishingRodId, PlayerRodRecord>>,
): boolean {
  return EPIC_ELEMENT_ROD_IDS.some((rodId) => {
    const state = playerRods[rodId]?.state;
    return state != null && state !== "locked";
  });
}

export function craftBenchCarouselRodIds(
  tier: CraftBenchCatalogTier,
  playerRods: Partial<Record<FishingRodId, PlayerRodRecord>>,
): FishingRodId[] {
  if (tier === "epic") {
    return [...EPIC_ELEMENT_ROD_IDS];
  }

  const rareIds: FishingRodId[] = [...PHASE1_CRAFTABLE_RARE_ROD_IDS];
  if (isWildcardRodVisible(playerRods[WILDCARD_ROD_ID])) {
    rareIds.push(WILDCARD_ROD_ID);
  }
  return rareIds;
}

export function rodsReadyToCollect(
  playerRods: Partial<Record<FishingRodId, PlayerRodRecord>>,
): FishingRodId[] {
  const ids: FishingRodId[] = [];
  for (const [rodId, record] of Object.entries(playerRods)) {
    if (record?.state === "ready") {
      ids.push(rodId as FishingRodId);
    }
  }
  return ids;
}

/** Timer finished or rod waiting to equip — sanctuary craft landmark hint. */
export function craftBenchNeedsAttention(
  playerRods: Partial<Record<FishingRodId, PlayerRodRecord>>,
): boolean {
  for (const record of Object.values(playerRods)) {
    if (!record) continue;
    if (record.state === "ready") return true;
    if (record.state === "crafting" && isCraftTimerComplete(record.rodId, record.craftStartedAt)) {
      return true;
    }
  }
  return false;
}
