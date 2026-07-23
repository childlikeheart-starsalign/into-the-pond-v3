import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  clampAxis,
  mapArchetypeCheckToTrailPoint,
  prependRecentDeepCheck,
  primaryArchetypeFromDisplay,
  rebuildRecentMapChecks,
  scoreDeepCheck,
  type DeepCheckAxisPair,
} from "./archetypeDeepCheck";

function five(pair: DeepCheckAxisPair): DeepCheckAxisPair[] {
  return [pair, pair, pair, pair, pair];
}

describe("scoreDeepCheck", () => {
  test("averages five pairs into Still Pond corner", () => {
    const scored = scoreDeepCheck(five({ expression: 5, driver: 5 }));
    assert.equal(scored.displayArchetypeName, "Still Pond");
    assert.equal(scored.primaryArchetype, "wall");
    assert.ok(scored.axisA < 20);
    assert.ok(scored.axisB < 20);
  });

  test("center averages to Weather Child", () => {
    const scored = scoreDeepCheck(five({ expression: 50, driver: 50 }));
    assert.equal(scored.displayArchetypeName, "Weather Child");
  });

  test("rejects wrong length", () => {
    assert.throws(() => scoreDeepCheck([{ expression: 50, driver: 50 }]));
  });
});

describe("clampAxis", () => {
  test("clamps to 0–100", () => {
    assert.equal(clampAxis(-10), 0);
    assert.equal(clampAxis(150), 100);
    assert.equal(clampAxis(42), 42);
  });
});

describe("primaryArchetypeFromDisplay", () => {
  test("maps display names", () => {
    assert.equal(primaryArchetypeFromDisplay("Storm Child"), "spark");
    assert.equal(primaryArchetypeFromDisplay("Quiet Storm"), "storm");
  });
});

describe("prependRecentDeepCheck", () => {
  test("keeps newest first and caps at 5", () => {
    const base = Array.from({ length: 5 }, (_, i) => ({
      axisA: i,
      axisB: i,
      completedAt: `2026-01-0${i + 1}T00:00:00.000Z`,
      source: "deep" as const,
    }));
    const next = {
      axisA: 99,
      axisB: 99,
      completedAt: "2026-02-01T00:00:00.000Z",
      source: "quick" as const,
    };
    const out = prependRecentDeepCheck(base, next);
    assert.equal(out.length, 5);
    assert.equal(out[0]?.axisA, 99);
    assert.equal(out[0]?.source, "quick");
    assert.equal(out[4]?.axisA, 3);
  });
});

describe("rebuildRecentMapChecks", () => {
  test("mixes quick + deep and drops oldest beyond cap", () => {
    const existing = [
      {
        type: "deep",
        axisA: 80,
        axisB: 20,
        createdAt: "2026-05-01T00:00:00.000Z",
      },
      {
        type: "quick",
        displayArchetypeName: "Still Pond",
        createdAt: "2026-04-01T00:00:00.000Z",
      },
      {
        type: "deep",
        axisA: 10,
        axisB: 10,
        createdAt: "2026-03-01T00:00:00.000Z",
      },
      {
        type: "quick",
        displayArchetypeName: "Storm Child",
        createdAt: "2026-02-01T00:00:00.000Z",
      },
      {
        type: "deep",
        axisA: 50,
        axisB: 50,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const newest = {
      axisA: 5,
      axisB: 95,
      completedAt: "2026-06-01T00:00:00.000Z",
      source: "quick" as const,
    };
    const out = rebuildRecentMapChecks({
      existingChecksNewestFirst: existing,
      newest,
    });
    assert.equal(out.length, 5);
    assert.equal(out[0]?.source, "quick");
    assert.equal(out[0]?.axisA, 5);
    assert.equal(out[1]?.source, "deep");
    assert.equal(out[1]?.axisA, 80);
    assert.equal(out[2]?.source, "quick");
    assert.equal(out[2]?.axisA, 5); // Still Pond preset
    assert.equal(out[3]?.source, "deep");
    assert.equal(out[3]?.axisA, 10);
    assert.equal(out[4]?.source, "quick");
    assert.equal(out[4]?.axisA, 95); // Storm Child preset; oldest deep dropped
  });

  test("maps quick display name to preset axes", () => {
    const point = mapArchetypeCheckToTrailPoint({
      type: "quick",
      displayArchetypeName: "Quiet Storm",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    assert.ok(point);
    assert.equal(point!.source, "quick");
    assert.equal(point!.axisA, 95);
    assert.equal(point!.axisB, 5);
  });
});
