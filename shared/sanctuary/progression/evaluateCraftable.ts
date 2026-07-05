import { getCraftCost, isCraftTimerComplete } from "./craftCosts";
import { allLessonsComplete, isModuleClusterComplete } from "./partsAwards";
import {
  clusterLessonIdsForRod,
  EPIC_ELEMENT_ROD_IDS,
  moduleIdForRareRod,
  RARE_ELEMENT_ROD_IDS,
  rareRodForEpic,
  WILDCARD_ROD_ID,
} from "./moduleRodMap";
import { canCraftRodBySubscription } from "./subscriptionCraftGate";
import { isRodInHand } from "./craftStates";
import type { FishingRodId } from "../types";
import type {
  EvaluateCraftableInput,
  EvaluateCraftableResult,
  PlayerRodRecord,
  PlayerRodState,
  StateTransition,
} from "./types";

const ALL_PROGRESSION_ROD_IDS: readonly FishingRodId[] = [
  ...RARE_ELEMENT_ROD_IDS,
  WILDCARD_ROD_ID,
  ...EPIC_ELEMENT_ROD_IDS,
];

function defaultPlayerRod(rodId: FishingRodId): PlayerRodRecord {
  return {
    rodId,
    state: "locked",
    craftStartedAt: null,
    craftCompletedAt: null,
    wonderInvested: 0,
    partsSpentOnCraft: 0,
    sourceModule: moduleIdForRareRod(rodId) as PlayerRodRecord["sourceModule"],
    giftSource: null,
  };
}

function getRodRecord(
  playerRods: Partial<Record<FishingRodId, PlayerRodRecord>>,
  rodId: FishingRodId,
): PlayerRodRecord {
  return playerRods[rodId] ?? defaultPlayerRod(rodId);
}

function hasSufficientBalances(
  rodId: FishingRodId,
  inventory: EvaluateCraftableInput["inventory"],
): boolean {
  const cost = getCraftCost(rodId);
  return inventory.parts >= cost.parts && inventory.storedWonder >= cost.storedWonder;
}

function allFourRareRodsInHand(
  playerRods: Partial<Record<FishingRodId, PlayerRodRecord>>,
): boolean {
  return RARE_ELEMENT_ROD_IDS.every((rodId) => isRodInHand(getRodRecord(playerRods, rodId).state));
}

function evaluateRareRodCraftable(rodId: FishingRodId, input: EvaluateCraftableInput): boolean {
  const moduleId = moduleIdForRareRod(rodId);
  if (moduleId == null) return false;
  if (!canCraftRodBySubscription(rodId, input.subscriptionTier)) return false;
  if (!isModuleClusterComplete(input.lessonProgress, moduleId)) return false;
  return hasSufficientBalances(rodId, input.inventory);
}

function evaluateEpicRodCraftable(rodId: FishingRodId, input: EvaluateCraftableInput): boolean {
  const rareId = rareRodForEpic(rodId);
  if (rareId == null) return false;
  if (!canCraftRodBySubscription(rodId, input.subscriptionTier)) return false;
  if (!allLessonsComplete(input.lessonProgress)) return false;
  if (!isRodInHand(getRodRecord(input.playerRods, rareId).state)) return false;
  return hasSufficientBalances(rodId, input.inventory);
}

function evaluateTargetState(
  rodId: FishingRodId,
  input: EvaluateCraftableInput,
  now: number,
): PlayerRodState {
  const current = getRodRecord(input.playerRods, rodId);

  if (current.state === "equipped") {
    return "equipped";
  }

  if (current.state === "crafting") {
    if (isCraftTimerComplete(rodId, current.craftStartedAt, now)) {
      return "ready";
    }
    return "crafting";
  }

  if (rodId === WILDCARD_ROD_ID) {
    if (current.state === "ready") {
      return "ready";
    }
    if (allFourRareRodsInHand(input.playerRods)) {
      return "ready";
    }
    return "locked";
  }

  if (current.state === "ready") {
    return "ready";
  }

  const isRare = (RARE_ELEMENT_ROD_IDS as readonly string[]).includes(rodId);
  const isEpic = (EPIC_ELEMENT_ROD_IDS as readonly string[]).includes(rodId);

  const craftable = isRare
    ? evaluateRareRodCraftable(rodId, input)
    : isEpic
      ? evaluateEpicRodCraftable(rodId, input)
      : false;

  return craftable ? "craftable" : "locked";
}

/**
 * Pure progression evaluation — shared by server and client (read-only hints on client).
 * Firestore remains source of truth; server applies transitions transactionally.
 */
export function evaluateCraftableStates(input: EvaluateCraftableInput): EvaluateCraftableResult {
  const now = input.now ?? Date.now();
  const transitions: StateTransition[] = [];
  const rodUnlocked: FishingRodId[] = [];
  let wildcardGifted = false;

  for (const rodId of ALL_PROGRESSION_ROD_IDS) {
    const current = getRodRecord(input.playerRods, rodId);
    const next = evaluateTargetState(rodId, input, now);

    if (current.state === next) continue;

    // Never downgrade active craft progress.
    if (current.state === "crafting" && next === "locked") continue;
    if (current.state === "ready" && next === "locked") continue;
    if (current.state === "craftable" && next === "locked") continue;

    const reason =
      rodId === WILDCARD_ROD_ID && next === "ready"
        ? "journey_gift"
        : next === "craftable"
          ? "prerequisites_met"
          : next === "ready" && current.state === "crafting"
            ? "craft_timer_complete"
            : "progression_update";

    transitions.push({ rodId, from: current.state, to: next, reason });

    if (next === "craftable" && current.state === "locked") {
      rodUnlocked.push(rodId);
    }

    if (rodId === WILDCARD_ROD_ID && next === "ready" && current.state === "locked") {
      wildcardGifted = true;
    }
  }

  return { transitions, rodUnlocked, wildcardGifted };
}

export function mergeEvaluateResult(
  playerRods: Partial<Record<FishingRodId, PlayerRodRecord>>,
  result: EvaluateCraftableResult,
  now = Date.now(),
): Partial<Record<FishingRodId, PlayerRodRecord>> {
  const next: Partial<Record<FishingRodId, PlayerRodRecord>> = { ...playerRods };

  for (const transition of result.transitions) {
    const existing = getRodRecord(next, transition.rodId);
    const patch: PlayerRodRecord = {
      ...existing,
      state: transition.to,
    };

    if (transition.to === "ready" && transition.from === "crafting") {
      patch.craftCompletedAt = now;
    }

    if (
      transition.rodId === WILDCARD_ROD_ID &&
      transition.to === "ready" &&
      transition.reason === "journey_gift"
    ) {
      patch.giftSource = "journey_gift";
    }

    next[transition.rodId] = patch;
  }

  return next;
}

/** Legacy `completedLessons` map → lesson progress records for evaluation. */
export function lessonProgressFromCompletedMap(
  completedLessons: Record<string, boolean>,
): Record<string, { lessonId: string; completed: boolean; completedAt: null; lastOpenedAt: null }> {
  return Object.fromEntries(
    Object.entries(completedLessons).map(([lessonId, completed]) => [
      lessonId,
      { lessonId, completed, completedAt: null, lastOpenedAt: null },
    ]),
  );
}
