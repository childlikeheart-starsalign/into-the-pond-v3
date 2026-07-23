import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  ARCHETYPE_CAPTION_BANK,
  axesFromDisplayArchetype,
  resolveDisplayArchetypeFromAxes,
} from "@/shared/childProfile/archetypeCaptionBank";
import {
  DISPLAY_ARCHETYPE_RESULT_COPY,
  isDisplayArchetypeName,
  isQuickCheckArchetype,
  scoreQuickCheckTally,
  type DisplayArchetypeName,
  type QuickCheckArchetype,
} from "@/shared/childProfile/archetypeQuickCheck";

describe("resolveDisplayArchetypeFromAxes", () => {
  test("corners map to poetic display names", () => {
    assert.equal(resolveDisplayArchetypeFromAxes(0, 0), "Still Pond");
    assert.equal(resolveDisplayArchetypeFromAxes(100, 0), "Quiet Storm");
    assert.equal(resolveDisplayArchetypeFromAxes(100, 100), "Storm Child");
    assert.equal(resolveDisplayArchetypeFromAxes(0, 100), "Ember Child");
  });

  test("center blend → Weather Child", () => {
    assert.equal(resolveDisplayArchetypeFromAxes(50, 50), "Weather Child");
    assert.equal(resolveDisplayArchetypeFromAxes(55, 48), "Weather Child");
  });

  test("Storm + Spark blend → Storm Child", () => {
    assert.equal(resolveDisplayArchetypeFromAxes(85, 50), "Storm Child");
  });

  test("Storm + Wall blend → Quiet Storm", () => {
    assert.equal(resolveDisplayArchetypeFromAxes(50, 10), "Quiet Storm");
  });

  test("Wall + Spark blend → Ember Child", () => {
    assert.equal(resolveDisplayArchetypeFromAxes(45, 95), "Ember Child");
  });

  test("Quiet Tester inset (5, 95) → Ember Child", () => {
    assert.equal(resolveDisplayArchetypeFromAxes(5, 95), "Ember Child");
  });
});

describe("axesFromDisplayArchetype", () => {
  test("presets are stable and inset from corners", () => {
    assert.deepEqual(axesFromDisplayArchetype("Still Pond"), { axisA: 5, axisB: 5 });
    assert.deepEqual(axesFromDisplayArchetype("Ember Child"), { axisA: 5, axisB: 95 });
    assert.deepEqual(axesFromDisplayArchetype("Quiet Storm"), { axisA: 95, axisB: 5 });
    assert.deepEqual(axesFromDisplayArchetype("Storm Child"), { axisA: 95, axisB: 95 });
    assert.deepEqual(axesFromDisplayArchetype("Weather Child"), { axisA: 50, axisB: 50 });
  });

  test("summary displayArchetypeName strings map to peek plot presets", () => {
    const summaryLabels = [
      "Still Pond",
      "Ember Child",
      "Quiet Storm",
      "Storm Child",
      "Weather Child",
    ] as const;
    for (const label of summaryLabels) {
      assert.ok(isDisplayArchetypeName(label));
      const axes = axesFromDisplayArchetype(label);
      assert.ok(axes.axisA >= 0 && axes.axisA <= 100);
      assert.ok(axes.axisB >= 0 && axes.axisB <= 100);
    }
    assert.equal(isDisplayArchetypeName("Quiet Tester"), false);
    assert.equal(isDisplayArchetypeName(null), false);
    assert.equal(isDisplayArchetypeName(""), false);
  });
});

describe("ARCHETYPE_CAPTION_BANK", () => {
  test("every display name has spirit, psychology, and ≤4 needs", () => {
    const names = Object.keys(ARCHETYPE_CAPTION_BANK) as DisplayArchetypeName[];
    assert.equal(names.length, 5);
    for (const name of names) {
      const entry = ARCHETYPE_CAPTION_BANK[name];
      assert.ok(entry.spiritVoice.length > 0);
      assert.ok(entry.psychologicalInterpretation.length > 0);
      assert.ok(entry.whatTheyNeed.length >= 3 && entry.whatTheyNeed.length <= 4);
      assert.equal(DISPLAY_ARCHETYPE_RESULT_COPY[name], entry.spiritVoice);
    }
  });
});

describe("Quick Check Quiet Tester exclusion", () => {
  test("no Quiet Tester in display names or tally outcomes", () => {
    assert.equal(isQuickCheckArchetype("Quiet Tester"), false);
    const names = Object.keys(DISPLAY_ARCHETYPE_RESULT_COPY) as string[];
    assert.ok(!names.includes("Quiet Tester"));
    const tallies: QuickCheckArchetype[][] = [
      ["storm", "storm", "storm", "storm", "storm"],
      ["wall", "wall", "wall", "wall", "wall"],
      ["spark", "spark", "spark", "spark", "spark"],
      ["storm", "wall", "spark", "storm", "wall"],
    ];
    for (const answers of tallies) {
      const result = scoreQuickCheckTally(answers);
      assert.notEqual(result.displayArchetypeName as string, "Quiet Tester");
    }
  });
});
