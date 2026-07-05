import test from "node:test";

import {
  evaluateCraftableStates,
  lessonProgressFromCompletedMap,
  mergeEvaluateResult,
} from "./evaluateCraftable";
import { TOTAL_LESSON_COUNT } from "./moduleRodMap";
import { computePartsAwardForLessonCompletion } from "./partsAwards";
import { ROD_PROGRESSION_CRAFT_COSTS } from "./craftCosts";

function expectEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function expectTrue(value: boolean, message: string) {
  if (!value) throw new Error(message);
}

export function runRodProgressionSelfTest(): void {
  expectEqual(TOTAL_LESSON_COUNT, 31, "lesson catalog count");

  const fireCost = ROD_PROGRESSION_CRAFT_COSTS.rare_fire;
  expectEqual(fireCost.parts, 4, "rare_fire parts");
  expectEqual(fireCost.storedWonder, 25, "rare_fire wonder");
  expectEqual(ROD_PROGRESSION_CRAFT_COSTS.rare_wildcard.parts, 0, "wildcard parts");

  const partsAward = computePartsAwardForLessonCompletion({
    lessonId: "1.6",
    lessonProgress: Object.fromEntries(
      ["1.1", "1.2", "1.3", "1.4", "1.5"].map((id) => [
        id,
        { lessonId: id, completed: true, completedAt: null, lastOpenedAt: null },
      ]),
    ),
  });
  expectEqual(partsAward.base, 1, "diary base parts");
  expectEqual(partsAward.clusterBonus, 5, "module 1 cluster bonus");
  expectEqual(partsAward.total, 6, "total parts for final module lesson");

  const moduleOneComplete = lessonProgressFromCompletedMap({
    "1.1": true,
    "1.2": true,
    "1.3": true,
    "1.4": true,
    "1.5": true,
    "1.6": true,
  });

  const craftable = evaluateCraftableStates({
    lessonProgress: moduleOneComplete,
    playerRods: {},
    subscriptionTier: "wooden",
    inventory: { parts: 10, storedWonder: 30 },
  });
  expectTrue(craftable.rodUnlocked.includes("rare_fire"), "fire rod unlocks after module 1");

  const wildcardGift = evaluateCraftableStates({
    lessonProgress: moduleOneComplete,
    playerRods: {
      rare_fire: {
        rodId: "rare_fire",
        state: "equipped",
        craftStartedAt: null,
        craftCompletedAt: null,
        wonderInvested: 25,
        partsSpentOnCraft: 4,
        sourceModule: 1,
      },
      rare_water: {
        rodId: "rare_water",
        state: "ready",
        craftStartedAt: null,
        craftCompletedAt: null,
        wonderInvested: 35,
        partsSpentOnCraft: 5,
        sourceModule: 2,
      },
      rare_wind: {
        rodId: "rare_wind",
        state: "equipped",
        craftStartedAt: null,
        craftCompletedAt: null,
        wonderInvested: 35,
        partsSpentOnCraft: 5,
        sourceModule: 3,
      },
      rare_electric: {
        rodId: "rare_electric",
        state: "ready",
        craftStartedAt: null,
        craftCompletedAt: null,
        wonderInvested: 45,
        partsSpentOnCraft: 6,
        sourceModule: 4,
      },
    },
    subscriptionTier: "fiberglass",
    inventory: { parts: 0, storedWonder: 0 },
  });
  expectTrue(wildcardGift.wildcardGifted, "wildcard gifted when four rares in hand");

  const merged = mergeEvaluateResult({}, wildcardGift);
  expectEqual(merged.rare_wildcard?.state, "ready", "wildcard merged to ready");
  expectEqual(merged.rare_wildcard?.giftSource, "journey_gift", "wildcard gift source");
}

test("rod progression craft formulas", () => {
  runRodProgressionSelfTest();
});
