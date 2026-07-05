import { getCraftDurationMs } from "../sanctuary/progression/craftCosts";
import type { FishingRodId } from "../sanctuary/progression/_sanctuaryTypes";

export type CollectionTiming = "on_time" | "late" | "very_late";

const ROD_TIER: Record<FishingRodId, "basic" | "rare" | "epic"> = {
  basic: "basic",
  rare_fire: "rare",
  rare_water: "rare",
  rare_wind: "rare",
  rare_electric: "rare",
  rare_wildcard: "rare",
  epic_fire: "epic",
  epic_water: "epic",
  epic_wind: "epic",
  epic_electric: "epic",
};

const ROD_ELEMENT: Record<FishingRodId, string> = {
  basic: "any",
  rare_fire: "fire",
  rare_water: "water",
  rare_wind: "wind",
  rare_electric: "electric",
  rare_wildcard: "any",
  epic_fire: "fire",
  epic_water: "water",
  epic_wind: "wind",
  epic_electric: "electric",
};

export function collectionTiming(hoursSinceReady: number): CollectionTiming {
  if (hoursSinceReady <= 24) return "on_time";
  if (hoursSinceReady <= 24 * 7) return "late";
  return "very_late";
}

export function craftDurationHours(rodId: FishingRodId): number {
  return getCraftDurationMs(rodId) / (60 * 60 * 1000);
}

export function rodTierForAnalytics(rodId: FishingRodId): "basic" | "rare" | "epic" {
  return ROD_TIER[rodId] ?? "basic";
}

export function rodElementForAnalytics(rodId: FishingRodId): string {
  return ROD_ELEMENT[rodId] ?? "any";
}

export function collectionTimingForRod(
  rodId: FishingRodId,
  craftStartedAt: number | null | undefined,
  now: number,
): CollectionTiming {
  if (craftStartedAt == null) return "on_time";
  const durationMs = getCraftDurationMs(rodId);
  if (durationMs <= 0) return "on_time";
  const readyAt = craftStartedAt + durationMs;
  const hoursSinceReady = (now - readyAt) / (60 * 60 * 1000);
  return collectionTiming(hoursSinceReady);
}
