import AsyncStorage from "@react-native-async-storage/async-storage";

import { ROD_CATALOG } from "@/shared/sanctuary/rods/catalog";
import {
  ALL_LESSON_IDS,
  getCraftDurationMs,
  moduleIdForRareRod,
  MODULE_LESSON_IDS,
  TOTAL_LESSON_COUNT,
} from "@/shared/sanctuary/progression";
import type { PlayerRodRecord } from "@/shared/sanctuary/progression";
import type { FishingRodId } from "@/shared/sanctuary/types";

const LAST_BENCH_VISIT_KEY = "analytics:lastBenchVisitAt";

export type CollectionTiming = "on_time" | "late" | "very_late";

export type RodStateCounts = {
  rodsCrafting: number;
  rodsReady: number;
  rodsCraftable: number;
  rodsLocked: number;
};

export type TimeOfDay = "morning" | "afternoon" | "sunset" | "night";

export function timeOfDay(now = new Date()): TimeOfDay {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "sunset";
  return "night";
}

export function countRodStates(
  playerRods: Partial<Record<FishingRodId, PlayerRodRecord>>,
): RodStateCounts {
  let rodsCrafting = 0;
  let rodsReady = 0;
  let rodsCraftable = 0;
  let rodsLocked = 0;

  for (const record of Object.values(playerRods)) {
    if (!record) continue;
    switch (record.state) {
      case "crafting":
        rodsCrafting += 1;
        break;
      case "ready":
      case "equipped":
        rodsReady += 1;
        break;
      case "craftable":
        rodsCraftable += 1;
        break;
      case "locked":
      default:
        rodsLocked += 1;
        break;
    }
  }

  return { rodsCrafting, rodsReady, rodsCraftable, rodsLocked };
}

export function collectionTiming(hoursSinceReady: number): CollectionTiming {
  if (hoursSinceReady <= 24) return "on_time";
  if (hoursSinceReady <= 24 * 7) return "late";
  return "very_late";
}

export function moduleLessonCounts(
  rodId: FishingRodId,
  completedLessons: Record<string, boolean>,
): { moduleLessonsCompleted: number; moduleLessonsTotal: number } {
  const moduleId = moduleIdForRareRod(rodId);
  if (moduleId != null) {
    const lessonIds = MODULE_LESSON_IDS[moduleId] ?? [];
    const completed = lessonIds.filter((id) => completedLessons[id]).length;
    return { moduleLessonsCompleted: completed, moduleLessonsTotal: lessonIds.length };
  }

  const completed = ALL_LESSON_IDS.filter((id) => completedLessons[id]).length;
  return { moduleLessonsCompleted: completed, moduleLessonsTotal: TOTAL_LESSON_COUNT };
}

export function craftProgressPct(
  rodId: FishingRodId,
  craftStartedAt: number | null | undefined,
  now = Date.now(),
): number | null {
  if (craftStartedAt == null) return null;
  const durationMs = getCraftDurationMs(rodId);
  if (durationMs <= 0) return null;
  return Math.min(100, Math.max(0, ((now - craftStartedAt) / durationMs) * 100));
}

export function hoursRemaining(
  rodId: FishingRodId,
  craftStartedAt: number | null | undefined,
  now = Date.now(),
): number | null {
  if (craftStartedAt == null) return null;
  const durationMs = getCraftDurationMs(rodId);
  if (durationMs <= 0) return null;
  const remainingMs = craftStartedAt + durationMs - now;
  return Math.max(0, remainingMs / (60 * 60 * 1000));
}

export function craftDurationHours(rodId: FishingRodId): number {
  return getCraftDurationMs(rodId) / (60 * 60 * 1000);
}

export function rodTierForAnalytics(rodId: FishingRodId): "basic" | "rare" | "epic" {
  return ROD_CATALOG[rodId].tier;
}

export function rodElementForAnalytics(rodId: FishingRodId): string {
  return ROD_CATALOG[rodId].element;
}

export function rodStateForAnalytics(
  state: PlayerRodRecord["state"],
): "locked" | "craftable" | "crafting" | "ready" | "equipped" {
  return state;
}

export function isFirstCraft(
  playerRods: Partial<Record<FishingRodId, PlayerRodRecord>>,
  currentRodId: FishingRodId,
): boolean {
  return !Object.entries(playerRods).some(([rodId, record]) => {
    if (!record || rodId === currentRodId) return false;
    return (
      record.craftStartedAt != null ||
      record.state === "crafting" ||
      record.state === "ready" ||
      record.state === "equipped"
    );
  });
}

export async function readDaysSinceLastBenchVisit(now = Date.now()): Promise<number | null> {
  const raw = await AsyncStorage.getItem(LAST_BENCH_VISIT_KEY);
  if (!raw) return null;
  const lastVisit = Number(raw);
  if (!Number.isFinite(lastVisit)) return null;
  return Math.floor((now - lastVisit) / (24 * 60 * 60 * 1000));
}

export async function persistBenchVisit(now = Date.now()): Promise<void> {
  await AsyncStorage.setItem(LAST_BENCH_VISIT_KEY, String(now));
}

export function daysOverdueFromHoursSinceReady(hoursSinceReady: number): number {
  return Math.max(0, Math.floor((hoursSinceReady - 24 * 7) / 24));
}
