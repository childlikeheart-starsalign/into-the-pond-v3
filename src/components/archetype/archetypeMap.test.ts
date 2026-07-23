import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { axisToScreenX, axisToScreenY } from "@/src/components/archetype/axisToScreen";
import {
  NAMED_REGION_FILL_OPACITY,
  QUIET_TESTER_FILL,
  QUIET_TESTER_FILL_OPACITY,
  QUIET_TESTER_LABEL_OPACITY,
  gardenCircleRegions,
  mapCornerRadius,
  regionLabels,
  trailCurvePath,
} from "@/src/components/archetype/gardenMapGeometry";
import {
  markerFillForSource,
  MARKER_DEEP,
  MARKER_QUICK,
} from "@/src/constants/archetypeMapMarkers";
import * as gardenMapGeometry from "@/src/components/archetype/gardenMapGeometry";
import { horizontalWavePath, verticalWavePath } from "@/src/components/archetype/wavyBoundaries";
import {
  CENTER_BLEND_CAPTION,
  QUIET_TESTER_CAPTION,
  buildMapCaption,
  leaningTowardCaption,
  tieBreakBlendCaption,
  trendAppendCaption,
} from "@/src/constants/archetypeMapCopy";
import {
  DISPLAY_ARCHETYPE_RESULT_COPY,
  isQuickCheckArchetype,
  scoreQuickCheckTally,
  type DisplayArchetypeName,
  type QuickCheckArchetype,
} from "@/shared/childProfile/archetypeQuickCheck";

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

describe("Quiet Tester screen position", () => {
  test("(axisA: 0, axisB: 100) resolves to top-left via shared transforms", () => {
    const plotLeft = 10;
    const plotTop = 10;
    const plotW = 260;
    const plotH = 260;
    const x = axisToScreenX(0, plotLeft, plotW);
    const y = axisToScreenY(100, plotTop, plotH);
    assert.equal(x, plotLeft);
    assert.equal(y, plotTop);
  });

  test("fixture inset (5, 95) lands inside top-left half of plot", () => {
    const plotLeft = 10;
    const plotTop = 10;
    const plotW = 260;
    const plotH = 260;
    const midX = plotLeft + plotW / 2;
    const midY = plotTop + plotH / 2;
    const x = axisToScreenX(5, plotLeft, plotW);
    const y = axisToScreenY(95, plotTop, plotH);
    assert.ok(x < midX, `expected x=${x} left of midX=${midX}`);
    assert.ok(y < midY, `expected y=${y} above midY=${midY}`);
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

describe("Quiet Tester art direction", () => {
  test("fill is Mist Heather #8E7C93 at peer 32% opacity", () => {
    assert.equal(QUIET_TESTER_FILL, "#8E7C93");
    assert.equal(QUIET_TESTER_FILL_OPACITY, 0.32);
    assert.equal(NAMED_REGION_FILL_OPACITY, 0.32);
    assert.equal(QUIET_TESTER_FILL_OPACITY, NAMED_REGION_FILL_OPACITY);
  });

  test("label uses quiet tester at full opacity with no asterisk", () => {
    const labels = regionLabels(10, 10, 260, 260);
    const qt = labels.find((l) => l.text.includes("quiet tester"));
    assert.ok(qt, "quiet tester label present");
    assert.equal(qt!.text, "quiet tester");
    assert.equal(qt!.opacity, QUIET_TESTER_LABEL_OPACITY);
    assert.equal(QUIET_TESTER_LABEL_OPACITY, 1);
  });

  test("placeholder footnote helper and copy are removed", () => {
    assert.equal("QUIET_TESTER_FOOTNOTE" in gardenMapGeometry, false);
    assert.equal("quietTesterFootnote" in gardenMapGeometry, false);
    assert.equal(
      Object.values(gardenMapGeometry).some(
        (v) => typeof v === "string" && v.includes("placeholder color"),
      ),
      false,
    );
  });
});

describe("gardenMapGeometry", () => {
  test("circle regions are stable across remount-equivalent calls", () => {
    const fills = {
      wall: "#6F7D68",
      storm: "#A87878",
      spark: "#C4A35A",
      quietTester: QUIET_TESTER_FILL,
    };
    const a = gardenCircleRegions(10, 10, 260, 260, fills);
    const b = gardenCircleRegions(10, 10, 260, 260, fills);
    assert.deepEqual(a, b);
    assert.equal(mapCornerRadius(260), 40);
    assert.equal(regionLabels(10, 10, 260, 260).length, 4);
    const path = trailCurvePath([
      { x: 100, y: 190 },
      { x: 140, y: 150 },
      { x: 170, y: 112 },
    ]);
    assert.equal(
      path,
      trailCurvePath([
        { x: 100, y: 190 },
        { x: 140, y: 150 },
        { x: 170, y: 112 },
      ]),
    );
  });

  test("trailCurvePath returns empty for fewer than 2 points", () => {
    assert.equal(trailCurvePath([]), "");
    assert.equal(trailCurvePath([{ x: 10, y: 20 }]), "");
  });
});

describe("buildMapCaption", () => {
  test("center blend equals frozen CENTER_BLEND_CAPTION", () => {
    assert.equal(buildMapCaption(50, 50), CENTER_BLEND_CAPTION);
    assert.equal(buildMapCaption(55, 48), CENTER_BLEND_CAPTION);
  });

  test("Quiet Tester nearest equals frozen QUIET_TESTER_CAPTION", () => {
    assert.equal(buildMapCaption(5, 95), QUIET_TESTER_CAPTION);
    assert.equal(buildMapCaption(0, 100), QUIET_TESTER_CAPTION);
  });

  test("Quiet Tester a11y caption equals visible caption (provisional framing)", () => {
    // ArchetypeResultMap sets accessibilityLabel={caption} from buildMapCaption.
    const visibleCaption = buildMapCaption(5, 95);
    assert.equal(visibleCaption, QUIET_TESTER_CAPTION);
    assert.ok(visibleCaption.includes("don't have a full picture"));
    assert.notEqual(visibleCaption, leaningTowardCaption("Quiet Tester"));
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
    assert.equal(caption, `${leaningTowardCaption("Spark")} ${trendAppendCaption("Spark")}`);
  });
});

describe("Quick Check cannot produce Quiet Tester", () => {
  test("QuickCheckArchetype union excludes Quiet Tester", () => {
    const allowed: QuickCheckArchetype[] = ["storm", "wall", "spark"];
    for (const id of allowed) {
      assert.equal(isQuickCheckArchetype(id), true);
    }
    assert.equal(isQuickCheckArchetype("quiet_tester"), false);
    assert.equal(isQuickCheckArchetype("Quiet Tester"), false);
  });

  test("DisplayArchetypeName union has no Quiet Tester", () => {
    const names = Object.keys(DISPLAY_ARCHETYPE_RESULT_COPY) as DisplayArchetypeName[];
    assert.ok(!names.includes("Quiet Tester" as DisplayArchetypeName));
    for (const name of names) {
      assert.ok(!name.toLowerCase().includes("quiet tester"));
    }
  });

  test("scoreQuickCheckTally never returns Quiet Tester display name", () => {
    const tallies: QuickCheckArchetype[][] = [
      ["storm", "storm", "storm", "storm", "storm"],
      ["wall", "wall", "wall", "wall", "wall"],
      ["spark", "spark", "spark", "spark", "spark"],
      ["storm", "wall", "spark", "storm", "wall"],
      ["wall", "spark", "wall", "spark", "wall"],
    ];
    for (const answers of tallies) {
      const result = scoreQuickCheckTally(answers);
      assert.notEqual(result.displayArchetypeName, "Quiet Tester");
      assert.ok(isQuickCheckArchetype(result.primaryArchetype));
    }
  });
});

describe("Quiet Tester fixture preset", () => {
  test("fixture axes (5, 95) classify to Quiet Tester caption and TL quadrant", () => {
    assert.equal(buildMapCaption(5, 95), QUIET_TESTER_CAPTION);
    const plotLeft = 10;
    const plotTop = 10;
    const plotW = 260;
    const plotH = 260;
    const x = axisToScreenX(5, plotLeft, plotW);
    const y = axisToScreenY(95, plotTop, plotH);
    assert.ok(x < plotLeft + plotW / 2);
    assert.ok(y < plotTop + plotH / 2);
  });
});

describe("markerFillForSource", () => {
  test("quick is sage, deep/legacy is bark", () => {
    assert.equal(markerFillForSource("quick"), MARKER_QUICK);
    assert.equal(markerFillForSource("deep"), MARKER_DEEP);
    assert.equal(markerFillForSource(null), MARKER_DEEP);
    assert.equal(markerFillForSource(undefined), MARKER_DEEP);
  });
});
