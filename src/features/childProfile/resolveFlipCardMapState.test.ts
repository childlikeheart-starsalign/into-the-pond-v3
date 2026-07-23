import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { trailCurvePath } from "@/src/components/archetype/gardenMapGeometry";
import { resolveFlipCardMapState } from "./resolveFlipCardMapState";
import type { RecentDeepCheckPoint } from "@/shared/childProfile/archetypeDeepCheck";

/** Mirror ArchetypeResultMap prior cap (current + ≤4 priors = 5 total). */
function capPriors(trail: { axisA: number; axisB: number; completedAt: string }[]) {
  return trail.length > 4 ? trail.slice(-4) : trail;
}

function points(n: number, source: "quick" | "deep" = "deep"): RecentDeepCheckPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    axisA: (n - i) * 10,
    axisB: (n - i) * 5,
    completedAt: `2026-0${Math.min(n - i, 9)}-01T00:00:00.000Z`,
    source,
  }));
}

describe("resolveFlipCardMapState", () => {
  test("without history uses display presets", () => {
    const state = resolveFlipCardMapState("Storm Child", null);
    assert.equal(state.hasMapHistory, false);
    assert.equal(state.hasDeepHistory, false);
    assert.equal(state.axisA, 95);
    assert.equal(state.axisB, 95);
    assert.equal(state.trail.length, 0);
    assert.equal(state.observedAt, null);
    assert.equal(state.currentSource, null);
  });

  test("0 checks → no priors, no path", () => {
    const state = resolveFlipCardMapState("Still Pond", []);
    assert.equal(state.trail.length, 0);
    assert.equal(state.observedAt, null);
    assert.equal(trailCurvePath([{ x: state.axisA, y: state.axisB }]), "");
  });

  test("1 deep check → marker only, no dashed path", () => {
    const state = resolveFlipCardMapState("Weather Child", points(1));
    assert.equal(state.hasMapHistory, true);
    assert.equal(state.hasDeepHistory, true);
    assert.equal(state.currentSource, "deep");
    assert.equal(state.trail.length, 0);
    assert.equal(state.observedAt, "2026-01-01T00:00:00.000Z");
    const priors = capPriors(state.trail);
    assert.equal(priors.length, 0);
  });

  test("quick-only history → hasMapHistory but not hasDeepHistory", () => {
    const state = resolveFlipCardMapState("Quiet Storm", points(2, "quick"));
    assert.equal(state.hasMapHistory, true);
    assert.equal(state.hasDeepHistory, false);
    assert.equal(state.currentSource, "quick");
    assert.equal(state.trail.length, 1);
    assert.equal(state.trail[0]?.source, "quick");
  });

  test("2 deep checks → 1 prior + path", () => {
    const state = resolveFlipCardMapState("Weather Child", points(2));
    assert.equal(state.trail.length, 1);
    const priors = capPriors(state.trail);
    assert.equal(priors.length, 1);
    const path = trailCurvePath([
      ...priors.map((p) => ({ x: p.axisA, y: p.axisB })),
      { x: state.axisA, y: state.axisB },
    ]);
    assert.ok(path.startsWith("M "));
  });

  test("3 deep checks → 2 priors + path", () => {
    const state = resolveFlipCardMapState("Weather Child", points(3));
    assert.equal(state.trail.length, 2);
    const priors = capPriors(state.trail);
    assert.equal(priors.length, 2);
    const path = trailCurvePath([
      ...priors.map((p) => ({ x: p.axisA, y: p.axisB })),
      { x: state.axisA, y: state.axisB },
    ]);
    assert.ok(path.length > 0);
  });

  test("5 deep checks → 4 priors drawn on map", () => {
    const state = resolveFlipCardMapState("Weather Child", points(5));
    assert.equal(state.trail.length, 4);
    const priors = capPriors(state.trail);
    assert.equal(priors.length, 4);
    const path = trailCurvePath([
      ...priors.map((p) => ({ x: p.axisA, y: p.axisB })),
      { x: state.axisA, y: state.axisB },
    ]);
    assert.ok(path.startsWith("M "));
  });

  test("6+ deep checks → priors capped at 4 for map", () => {
    const state = resolveFlipCardMapState("Weather Child", points(6));
    assert.equal(state.trail.length, 5);
    const priors = capPriors(state.trail);
    assert.equal(priors.length, 4);
  });

  test("mixed trail passes source through priors oldest-first", () => {
    const state = resolveFlipCardMapState("Weather Child", [
      { axisA: 80, axisB: 20, completedAt: "2026-03-01T00:00:00.000Z", source: "deep" },
      { axisA: 5, axisB: 5, completedAt: "2026-02-01T00:00:00.000Z", source: "quick" },
      { axisA: 10, axisB: 10, completedAt: "2026-01-01T00:00:00.000Z", source: "deep" },
    ]);
    assert.equal(state.hasMapHistory, true);
    assert.equal(state.hasDeepHistory, true);
    assert.equal(state.currentSource, "deep");
    assert.equal(state.axisA, 80);
    assert.deepEqual(state.trail, [
      { axisA: 10, axisB: 10, completedAt: "2026-01-01T00:00:00.000Z", source: "deep" },
      { axisA: 5, axisB: 5, completedAt: "2026-02-01T00:00:00.000Z", source: "quick" },
    ]);
  });

  test("legacy points without source treat as deep", () => {
    const state = resolveFlipCardMapState("Weather Child", [
      { axisA: 50, axisB: 50, completedAt: "2026-01-01T00:00:00.000Z" },
    ]);
    assert.equal(state.currentSource, "deep");
    assert.equal(state.hasDeepHistory, true);
  });
});
