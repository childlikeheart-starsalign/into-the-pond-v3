import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { axisToScreenX, axisToScreenY } from "@/src/components/archetype/axisToScreen";
import {
  horizontalWavePath,
  verticalWavePath,
} from "@/src/components/archetype/wavyBoundaries";
import {
  CENTER_BLEND_CAPTION,
  QUIET_TESTER_CAPTION,
  buildMapCaption,
  leaningTowardCaption,
  tieBreakBlendCaption,
  trendAppendCaption,
} from "@/src/constants/archetypeMapCopy";

describe("axisToScreenY", () => {
  test("inverts axisB: 0 bottom, 100 top, 50 mid", () => {
    const insetTop = 10;
    const plotHeight = 100;
    assert.equal(axisToScreenY(0, insetTop, plotHeight), 110);
    assert.equal(axisToScreenY(100, insetTop, plotHeight), 10);
    assert.equal(axisToScreenY(50, insetTop, plotHeight), 60);
  });
});

describe("axisToScreenX", () => {
  test("maps axisA left to right", () => {
    assert.equal(axisToScreenX(0, 10, 100), 10);
    assert.equal(axisToScreenX(100, 10, 100), 110);
    assert.equal(axisToScreenX(50, 10, 100), 60);
  });
});

describe("wavyBoundaries", () => {
  test("paths are stable across remount-equivalent calls", () => {
    const a = verticalWavePath(10, 10, 100, 100);
    const b = verticalWavePath(10, 10, 100, 100);
    assert.equal(a, b);
    const h1 = horizontalWavePath(10, 10, 100, 100);
    const h2 = horizontalWavePath(10, 10, 100, 100);
    assert.equal(h1, h2);
  });
});

describe("buildMapCaption", () => {
  test("center blend equals frozen CENTER_BLEND_CAPTION", () => {
    assert.equal(buildMapCaption(50, 50), CENTER_BLEND_CAPTION);
    assert.equal(buildMapCaption(55, 48), CENTER_BLEND_CAPTION);
  });

  test("Quiet Tester nearest equals frozen QUIET_TESTER_CAPTION", () => {
    assert.equal(buildMapCaption(5, 95), QUIET_TESTER_CAPTION);
  });

  test("leaning toward Spark equals frozen template", () => {
    assert.equal(buildMapCaption(95, 95), leaningTowardCaption("Spark"));
  });

  test("leaning toward Storm", () => {
    assert.equal(buildMapCaption(95, 5), leaningTowardCaption("Storm"));
  });

  test("leaning toward Wall", () => {
    assert.equal(buildMapCaption(5, 5), leaningTowardCaption("Wall"));
  });

  test("tie-break blend equals frozen phrase exactly", () => {
    assert.equal(buildMapCaption(50, 10), tieBreakBlendCaption("Storm", "Wall"));
    assert.equal(buildMapCaption(45, 5), tieBreakBlendCaption("Wall", "Storm"));
  });

  test("trend append when oldest prior nearest differs", () => {
    const caption = buildMapCaption(95, 95, [{ axisA: 5, axisB: 5, completedAt: "2020-01-01" }]);
    assert.equal(
      caption,
      `${leaningTowardCaption("Spark")} ${trendAppendCaption("Spark")}`,
    );
  });
});
