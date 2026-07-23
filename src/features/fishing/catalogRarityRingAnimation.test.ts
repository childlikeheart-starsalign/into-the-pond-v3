import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  outcomeToDisplayTier,
  pondRippleCalmBeatDelayMs,
  pondRippleSequenceDurationMs,
  pondRippleSequencePhaseEndsMs,
  POND_RIPPLE_SEQUENCE_TOTAL_MS,
} from "./pondRippleCatalog";

const OUTCOME_FIXTURES = [
  { outcome: "miss" as const },
  { outcome: "catch" as const, rarityIndicator: "common" as const },
  { outcome: "catch" as const, rarityIndicator: "rare" as const },
  { outcome: "catch" as const, rarityIndicator: "epic" as const },
];

test("sequence duration byte-identical across forced outcome fixtures", () => {
  const baseline = pondRippleSequenceDurationMs();
  assert.equal(baseline, POND_RIPPLE_SEQUENCE_TOTAL_MS);

  const durations = OUTCOME_FIXTURES.map((claim) => {
    const tier = outcomeToDisplayTier(claim);
    assert.ok(tier);
    return pondRippleSequenceDurationMs();
  });

  assert.ok(durations.every((d) => d === baseline));
});

test("calm beat starts simultaneously at illuminate end for all bands", () => {
  const phases = pondRippleSequencePhaseEndsMs();
  assert.equal(pondRippleCalmBeatDelayMs(), phases.illuminateEnd);
  for (const claim of OUTCOME_FIXTURES) {
    outcomeToDisplayTier(claim);
    assert.equal(pondRippleCalmBeatDelayMs(), phases.illuminateEnd);
  }
});

test("WatercolorPondPlate uses stacked opacity only — no blur filters", () => {
  const source = readFileSync(
    join(process.cwd(), "src/features/fishing/WatercolorPondPlate.tsx"),
    "utf8",
  );
  assert.ok(!source.includes("FeGaussianBlur"));
  assert.ok(!source.includes("filter="));
  assert.ok(!source.includes("BlurView"));
  assert.ok(source.includes("stacked-opacity") || source.includes("SVG filters"));
});

test("CatalogRarityRing ceremony does not reference pulse shared value", () => {
  const source = readFileSync(
    join(process.cwd(), "src/features/fishing/CatalogRarityRing.tsx"),
    "utf8",
  );
  assert.ok(!source.includes("const pulse = useSharedValue"));
  assert.ok(source.includes("recognitionWarmth"));
  assert.ok(source.includes("calmBeat"));
});
