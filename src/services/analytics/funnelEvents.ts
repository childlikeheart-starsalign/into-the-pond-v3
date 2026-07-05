import { posthog } from "@/src/services/analytics/posthogClient";
import type { PostHogEventProperties } from "@posthog/core";

function capture(event: string, properties: PostHogEventProperties): void {
  posthog?.capture(event, properties);
}

// ── craft_bench_opened ──────────────────────────────────────────────────
export function trackCraftBenchOpened(params: {
  rodsCrafting: number;
  rodsReady: number;
  rodsCraftable: number;
  rodsLocked: number;
  entryPoint: "sanctuary_tap" | "notification" | "deep_link" | "tab_bar";
  timeOfDay: "morning" | "afternoon" | "sunset" | "night";
  daysSinceLastBenchVisit: number | null;
}) {
  capture("craft_bench_opened", params);
}

// ── rod_detail_viewed ────────────────────────────────────────────────────
export function trackRodDetailViewed(params: {
  rodId: string;
  rodTier: "basic" | "rare" | "epic";
  rodElement: string;
  rodState: "locked" | "craftable" | "crafting" | "ready" | "equipped";
  partsCurrent: number;
  partsRequired: number;
  wonderCurrent: number;
  wonderRequired: number;
  partsGap: number;
  wonderGap: number;
  craftProgressPct: number | null;
  hoursRemaining: number | null;
  viewDurationMs: number;
  tappedStartCraft: boolean;
}) {
  capture("rod_detail_viewed", params);
}

// ── craft_started ────────────────────────────────────────────────────────
export function trackCraftStarted(params: {
  rodId: string;
  rodTier: "rare" | "epic";
  rodElement: string;
  wonderInvested: number;
  partsSpent: number;
  wonderRemaining: number;
  partsRemaining: number;
  craftDurationHours: number;
  benchSessionDurationMs: number;
  isFirstCraft: boolean;
  moduleLessonsCompleted: number;
  moduleLessonsTotal: number;
}) {
  capture("craft_started", params);
}

// ── craft_collected ──────────────────────────────────────────────────────
export function trackCraftCollected(params: {
  rodId: string;
  rodTier: string;
  rodElement: string;
  hoursToCollect: number;
  craftDurationHours: number;
  collectionTiming: "on_time" | "late" | "very_late";
  castSameSession: boolean;
}) {
  capture("craft_collected", params);
}

// ── craft_collected_late ─────────────────────────────────────────────────
export function trackCraftCollectedLate(params: {
  rodId: string;
  daysOverdue: number;
  receivedReadyNotification: boolean;
  notificationToCollectionDays: number | null;
  returnEntryPoint: "notification" | "organic" | "deep_link" | "unknown";
}) {
  capture("craft_collected_late", params);
}

// craft_abandoned — server-side only (Cloud Function + posthog-node). See Task 5.
