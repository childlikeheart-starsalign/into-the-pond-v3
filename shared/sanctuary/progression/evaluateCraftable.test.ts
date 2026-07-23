import test from "node:test";

import {
  evaluateCraftableStates,
  lessonProgressFromCompletedMap,
  mergeEvaluateResult,
} from "./evaluateCraftable";
import { ALL_LESSON_IDS, TOTAL_LESSON_COUNT } from "./moduleRodMap";
import { computePartsAwardForLessonCompletion } from "./partsAwards";
import { ROD_PROGRESSION_CRAFT_COSTS } from "./craftCosts";
import { isRodOwnedForFishing } from "./rodFishingAccess";

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

  // Journey 1/2/3 — ready rods stay ready (no decay / no auto-lock on re-evaluate).
  const readyStaysReady = evaluateCraftableStates({
    lessonProgress: moduleOneComplete,
    playerRods: {
      rare_fire: {
        rodId: "rare_fire",
        state: "ready",
        craftStartedAt: "2026-01-01T00:00:00.000Z",
        craftCompletedAt: "2026-01-02T00:00:00.000Z",
        wonderInvested: 25,
        partsSpentOnCraft: 4,
        sourceModule: 1,
      },
    },
    subscriptionTier: "wooden",
    inventory: { parts: 0, storedWonder: 0 },
  });
  expectEqual(
    readyStaysReady.transitions.find((t) => t.rodId === "rare_fire"),
    undefined,
    "Journey 2/3: ready rod does not transition away on re-evaluate",
  );

  // Journey 6 — alreadyCompleted / already in progress map awards 0 parts (no retroactive economy).
  const zeroRetro = computePartsAwardForLessonCompletion({
    lessonId: "1.1",
    lessonProgress: moduleOneComplete,
    alreadyCompleted: true,
  });
  expectEqual(zeroRetro.total, 0, "Journey 6: no retroactive parts when alreadyCompleted");

  // Journey 8 — curriculum complete + rare in hand unlocks epic craftable (lifetime).
  const allLessons = lessonProgressFromCompletedMap(
    Object.fromEntries(ALL_LESSON_IDS.map((id) => [id, true])),
  );
  const epicPath = evaluateCraftableStates({
    lessonProgress: allLessons,
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
    },
    subscriptionTier: "lifetime",
    inventory: { parts: 56, storedWonder: 200 },
  });
  expectTrue(
    epicPath.rodUnlocked.includes("epic_fire"),
    "Journey 8: epic_fire unlocks after curriculum",
  );
}

test("rod progression craft formulas", () => {
  runRodProgressionSelfTest();
});

test("locked rod is not owned for fishing (Journey 5)", () => {
  expectEqual(isRodOwnedForFishing("locked"), false, "locked cannot cast");
  expectEqual(isRodOwnedForFishing("craftable"), false, "craftable cannot cast");
  expectEqual(isRodOwnedForFishing("ready"), true, "ready can cast");
  expectEqual(isRodOwnedForFishing("equipped"), true, "equipped can cast");
});
