import type { FishingRodId, Rod, RodCraftJob, RodState, RodTypeKey } from "../types";
import {
  getCraftCost,
  getCraftDurationMs,
  ROD_PROGRESSION_CRAFT_COSTS,
} from "../progression/craftCosts";

export const ROD_CATALOG: Record<
  FishingRodId,
  Omit<Rod, "state" | "storedWonderInvested" | "dullnessCount">
> = {
  basic: {
    id: "basic",
    rodTypeKey: "basic",
    displayName: "Wooden Rod",
    tier: "basic",
    element: "any",
    peakWonderGate: 0,
  },
  rare_fire: {
    id: "rare_fire",
    rodTypeKey: "rare1",
    displayName: "Rare Fire Rod",
    tier: "rare",
    element: "fire",
    peakWonderGate: 40,
  },
  rare_water: {
    id: "rare_water",
    rodTypeKey: "rare2",
    displayName: "Rare Water Rod",
    tier: "rare",
    element: "water",
    peakWonderGate: 40,
  },
  rare_wind: {
    id: "rare_wind",
    rodTypeKey: "rare3",
    displayName: "Rare Wind Rod",
    tier: "rare",
    element: "wind",
    peakWonderGate: 40,
  },
  rare_electric: {
    id: "rare_electric",
    rodTypeKey: "rare4",
    displayName: "Rare Electric Rod",
    tier: "rare",
    element: "electric",
    peakWonderGate: 40,
  },
  rare_wildcard: {
    id: "rare_wildcard",
    rodTypeKey: "rare5",
    displayName: "Rare Wildcard Rod",
    tier: "rare",
    element: "any",
    peakWonderGate: 65,
  },
  epic_fire: {
    id: "epic_fire",
    rodTypeKey: "epic1",
    displayName: "Epic Fire Rod",
    tier: "epic",
    element: "fire",
    peakWonderGate: 90,
  },
  epic_water: {
    id: "epic_water",
    rodTypeKey: "epic2",
    displayName: "Epic Water Rod",
    tier: "epic",
    element: "water",
    peakWonderGate: 90,
  },
  epic_wind: {
    id: "epic_wind",
    rodTypeKey: "epic3",
    displayName: "Epic Wind Rod",
    tier: "epic",
    element: "wind",
    peakWonderGate: 90,
  },
  epic_electric: {
    id: "epic_electric",
    rodTypeKey: "epic4",
    displayName: "Epic Electric Rod",
    tier: "epic",
    element: "electric",
    peakWonderGate: 90,
  },
};

/** @deprecated Import `ROD_PROGRESSION_CRAFT_COSTS` from `shared/sanctuary/progression`. */
export const ROD_CRAFT_COSTS: Record<FishingRodId, { parts: number; storedWonder: number }> =
  ROD_PROGRESSION_CRAFT_COSTS;

export { ROD_PROGRESSION_CRAFT_COSTS, getCraftDurationMs } from "../progression/craftCosts";

export const DULLNESS_THRESHOLD = 5;

export function rodTypeKeyForId(rodId: FishingRodId): RodTypeKey {
  return ROD_CATALOG[rodId].rodTypeKey;
}

export function createRodInstance(rodId: FishingRodId, state: RodState = "locked"): Rod {
  const base = ROD_CATALOG[rodId];
  return {
    ...base,
    state,
    storedWonderInvested: 0,
    dullnessCount: 0,
  };
}

export function startRodCraftJob(
  userId: string,
  jobId: string,
  rodId: FishingRodId,
  now = Date.now(),
): RodCraftJob {
  const cost = getCraftCost(rodId);
  const durationMs = getCraftDurationMs(rodId);
  return {
    id: jobId,
    userId,
    rodId,
    partsRequired: cost.parts,
    storedWonderCost: cost.storedWonder,
    startedAt: now,
    completesAt: now + (durationMs > 0 ? durationMs : 3 * 24 * 60 * 60 * 1000),
    status: "building",
  };
}

export function advanceRodCraftJob(job: RodCraftJob, now = Date.now()): RodCraftJob {
  if (job.status !== "building") return job;
  if (now >= job.completesAt) {
    return { ...job, status: "ready_to_collect" };
  }
  return job;
}

export type RodTransition =
  | { rod: Rod; kind: "none" }
  | { rod: Rod; kind: "became_dull" }
  | { rod: Rod; kind: "reignite_required" };

/** Increment dullness after fishing without reflection — never deducts Wonder. */
export function recordRodUse(rod: Rod): RodTransition {
  if (rod.state !== "ready") return { rod, kind: "none" };
  const dullnessCount = rod.dullnessCount + 1;
  const next: Rod = { ...rod, dullnessCount };
  if (dullnessCount >= DULLNESS_THRESHOLD) {
    return { rod: { ...next, state: "dull" }, kind: "became_dull" };
  }
  return { rod: next, kind: "none" };
}

export function beginRodReignite(rod: Rod): Rod {
  if (rod.state !== "dull") return rod;
  return { ...rod, state: "reigniting" };
}

export function completeRodReignite(rod: Rod): Rod {
  return { ...rod, state: "ready", dullnessCount: 0 };
}
