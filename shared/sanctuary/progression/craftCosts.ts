import type { FishingRodId } from "../types";
import type { CraftCost } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Rod progression v2 craft costs — single source of truth.
 * Wildcard is a journey gift (0 / 0). Epic rows are incremental craft costs only.
 */
export const ROD_PROGRESSION_CRAFT_COSTS: Record<FishingRodId, CraftCost> = {
  basic: { parts: 0, storedWonder: 0 },
  rare_fire: { parts: 4, storedWonder: 25 },
  rare_water: { parts: 5, storedWonder: 35 },
  rare_wind: { parts: 5, storedWonder: 35 },
  rare_electric: { parts: 6, storedWonder: 45 },
  rare_wildcard: { parts: 0, storedWonder: 0 },
  epic_fire: { parts: 8, storedWonder: 25 },
  epic_water: { parts: 8, storedWonder: 25 },
  epic_wind: { parts: 8, storedWonder: 25 },
  epic_electric: { parts: 8, storedWonder: 25 },
};

/** Craft timer duration per rod (ms). Wildcard has no timer. */
export const ROD_CRAFT_DURATION_MS_BY_ID: Partial<Record<FishingRodId, number>> = {
  rare_fire: 1 * DAY_MS,
  rare_water: 2 * DAY_MS,
  rare_wind: 2 * DAY_MS,
  rare_electric: 3 * DAY_MS,
  epic_fire: 5 * DAY_MS,
  epic_water: 5 * DAY_MS,
  epic_wind: 5 * DAY_MS,
  epic_electric: 5 * DAY_MS,
};

export const PHASE1_CRAFTABLE_RARE_ROD_IDS: readonly FishingRodId[] = [
  "rare_fire",
  "rare_water",
  "rare_wind",
  "rare_electric",
];

export const CRAFTABLE_ROD_IDS: readonly FishingRodId[] = [
  ...PHASE1_CRAFTABLE_RARE_ROD_IDS,
  "epic_fire",
  "epic_water",
  "epic_wind",
  "epic_electric",
];

export function getCraftCost(rodId: FishingRodId): CraftCost {
  return ROD_PROGRESSION_CRAFT_COSTS[rodId];
}

export function getCraftDurationMs(rodId: FishingRodId): number {
  return ROD_CRAFT_DURATION_MS_BY_ID[rodId] ?? 0;
}

export function hasCraftTimer(rodId: FishingRodId): boolean {
  return getCraftDurationMs(rodId) > 0;
}

export function craftCompletesAt(rodId: FishingRodId, craftStartedAt: number): number {
  return craftStartedAt + getCraftDurationMs(rodId);
}

export function isCraftTimerComplete(
  rodId: FishingRodId,
  craftStartedAt: number | null,
  now = Date.now(),
): boolean {
  if (craftStartedAt == null) return false;
  const duration = getCraftDurationMs(rodId);
  if (duration <= 0) return false;
  return now >= craftStartedAt + duration;
}
