import type { FishingRodId } from "./types";

const ROD_TYPE_KEYS: Record<FishingRodId, string> = {
  basic: "basic",
  rare_fire: "rare1",
  rare_water: "rare2",
  rare_wind: "rare3",
  rare_electric: "rare4",
  rare_wildcard: "rare5",
  epic_fire: "epic1",
  epic_water: "epic2",
  epic_wind: "epic3",
  epic_electric: "epic4",
};

export function rodTypeKeyForId(rodId: FishingRodId): string {
  return ROD_TYPE_KEYS[rodId] ?? "basic";
}

export { uiBaitIdToTier, uiRodIdToDomain } from "./castMapping";
