import assert from "node:assert/strict";
import test from "node:test";

import {
  CATALOG_RARITY_RING_FIXTURES,
  claimHasCreature,
  CLAIM_THRESHOLD_SCRIM,
  isBandUnlocked,
  LIFETIME_UNLOCKS_ALL_CATALOG_BANDS,
  liveCatalogPoolTierCounts,
  outcomeToDisplayTier,
  pondRippleCalmBeatDelayMs,
  pondRippleIlluminateOrder,
  pondRippleRecognitionStroke,
  pondRippleRecognitionTargetColor,
  pondRippleSequencePhaseEndsMs,
  recognitionRestAnimatedPropKeys,
  POND_RIPPLE_BAND_ORDER,
  POND_RIPPLE_CATCH_SHARE,
  POND_RIPPLE_CATALOG_COUNTS,
  POND_RIPPLE_CATALOG_FRACTIONS,
  POND_RIPPLE_EMPTY_SHARE,
  POND_RIPPLE_RATIOS,
  POND_RIPPLE_SEQUENCE_TOTAL_MS,
  POND_RIPPLE_STROKE_BUDGET,
  POND_RIPPLE_STROKE_WIDTHS,
  rarityIndicatorToDisplayTier,
  shouldPlayPondRippleCeremony,
  pondRippleCeremonyKey,
  pondRippleSequenceDurationMs,
  unlockedBandCount,
} from "./pondRippleCatalog";

test("empty water is 20% and catch bands sum to 80% with catalog proportions", () => {
  assert.equal(POND_RIPPLE_EMPTY_SHARE, 0.2);
  assert.equal(POND_RIPPLE_CATCH_SHARE, 0.8);
  assert.equal(POND_RIPPLE_RATIOS.empty, 0.2);
  assert.equal(
    POND_RIPPLE_RATIOS.common,
    POND_RIPPLE_CATALOG_FRACTIONS.common * POND_RIPPLE_CATCH_SHARE,
  );
  assert.equal(
    POND_RIPPLE_RATIOS.rare,
    POND_RIPPLE_CATALOG_FRACTIONS.rare * POND_RIPPLE_CATCH_SHARE,
  );
  assert.equal(
    POND_RIPPLE_RATIOS.epic,
    POND_RIPPLE_CATALOG_FRACTIONS.epic * POND_RIPPLE_CATCH_SHARE,
  );
  const catchSum = POND_RIPPLE_RATIOS.common + POND_RIPPLE_RATIOS.rare + POND_RIPPLE_RATIOS.epic;
  assert.ok(Math.abs(catchSum - 0.8) < 1e-12);
  const fullSum = catchSum + POND_RIPPLE_RATIOS.empty;
  assert.ok(Math.abs(fullSum - 1) < 1e-12);
});

test("catalog fractions still match 30/70/50 of 150", () => {
  assert.equal(POND_RIPPLE_CATALOG_FRACTIONS.common, 30 / 150);
  assert.equal(POND_RIPPLE_CATALOG_FRACTIONS.rare, 70 / 150);
  assert.equal(POND_RIPPLE_CATALOG_FRACTIONS.epic, 50 / 150);
});

test("stroke widths match full-circle ratio proportions exactly", () => {
  for (const band of POND_RIPPLE_BAND_ORDER) {
    assert.equal(
      POND_RIPPLE_STROKE_WIDTHS[band],
      POND_RIPPLE_RATIOS[band] * POND_RIPPLE_STROKE_BUDGET,
    );
  }
  const sum = POND_RIPPLE_BAND_ORDER.reduce((n, band) => n + POND_RIPPLE_STROKE_WIDTHS[band], 0);
  assert.ok(Math.abs(sum - POND_RIPPLE_STROKE_BUDGET) < 1e-12);
});

test("SSoT catalog counts match live poolTier aggregate (drift guard)", () => {
  const live = liveCatalogPoolTierCounts();
  assert.equal(live.common, POND_RIPPLE_CATALOG_COUNTS.common);
  assert.equal(live.rare, POND_RIPPLE_CATALOG_COUNTS.rare);
  assert.equal(live.epic, POND_RIPPLE_CATALOG_COUNTS.epic);
  assert.equal(live.total, POND_RIPPLE_CATALOG_COUNTS.total);
});

test("unlocked band counts by subscription (Lifetime = Fiberglass)", () => {
  assert.equal(LIFETIME_UNLOCKS_ALL_CATALOG_BANDS, true);
  assert.equal(unlockedBandCount("free"), 1);
  assert.equal(unlockedBandCount("wooden"), 2);
  assert.equal(unlockedBandCount("fiberglass"), 3);
  assert.equal(unlockedBandCount("lifetime"), 3);
});

test("empty always unlocked; creature lock model unchanged", () => {
  assert.deepEqual(POND_RIPPLE_BAND_ORDER, ["epic", "rare", "common", "empty"]);
  assert.deepEqual(pondRippleIlluminateOrder(), ["epic", "rare", "common", "empty"]);
  assert.equal(isBandUnlocked("empty", "free"), true);
  assert.equal(isBandUnlocked("empty", "wooden"), true);
  assert.equal(isBandUnlocked("common", "free"), true);
  assert.equal(isBandUnlocked("rare", "free"), false);
  assert.equal(isBandUnlocked("epic", "free"), false);
  assert.equal(isBandUnlocked("rare", "wooden"), true);
  assert.equal(isBandUnlocked("epic", "wooden"), false);
  assert.equal(isBandUnlocked("epic", "lifetime"), true);
});

test("rarityIndicator maps to creature display tier for pulse", () => {
  assert.equal(rarityIndicatorToDisplayTier("common"), "common");
  assert.equal(rarityIndicatorToDisplayTier("uncommon"), "common");
  assert.equal(rarityIndicatorToDisplayTier("rare"), "rare");
  assert.equal(rarityIndicatorToDisplayTier("epic"), "epic");
});

test("outcomeToDisplayTier maps miss to empty water", () => {
  assert.equal(outcomeToDisplayTier({ outcome: "miss" }), "empty");
  assert.equal(outcomeToDisplayTier({ outcome: "catch", rarityIndicator: "rare" }), "rare");
  assert.equal(outcomeToDisplayTier({ outcome: "duplicate", rarityIndicator: "epic" }), "epic");
});

test("sequence duration is fixed across all outcome tiers", () => {
  const duration = pondRippleSequenceDurationMs();
  assert.equal(duration, POND_RIPPLE_SEQUENCE_TOTAL_MS);
  assert.ok(duration >= 1600 && duration <= 2600);

  const outcomeFixtures = [
    outcomeToDisplayTier({ outcome: "miss" }),
    outcomeToDisplayTier({ outcome: "catch", rarityIndicator: "common" }),
    outcomeToDisplayTier({ outcome: "catch", rarityIndicator: "rare" }),
    outcomeToDisplayTier({ outcome: "catch", rarityIndicator: "epic" }),
  ];
  for (const tier of outcomeFixtures) {
    assert.notEqual(tier, undefined);
    assert.equal(pondRippleSequenceDurationMs(), duration);
  }

  const phases = pondRippleSequencePhaseEndsMs();
  assert.equal(phases.totalEnd, duration);
  assert.equal(phases.preBeatEnd, 175);
  assert.equal(phases.illuminateEnd, 175 + 4 * 375);
  assert.equal(pondRippleCalmBeatDelayMs(), phases.illuminateEnd);
});

test("recognition rest uses color-only animated props and mist tone for miss", () => {
  const keys = recognitionRestAnimatedPropKeys();
  assert.deepEqual(keys, ["opacity", "stroke", "fill"]);
  assert.ok(!keys.includes("transform"));
  assert.ok(!keys.includes("scale"));

  const epicBase = "#D69B32";
  const missBase = "#6F8F98";
  const epicWarm = pondRippleRecognitionStroke(epicBase, "epic", 1);
  const missMist = pondRippleRecognitionStroke(missBase, "empty", 1);
  assert.notEqual(epicWarm, missMist);
  assert.equal(pondRippleRecognitionTargetColor("empty"), "#A8C4CE");
  assert.equal(
    pondRippleRecognitionStroke(epicBase, "epic", 0).toLowerCase(),
    epicBase.toLowerCase(),
  );
});

test("claimHasCreature gates creature-specific copy", () => {
  assert.equal(claimHasCreature({ creatureTypeId: "a", creatureDisplayName: "A" }), true);
  assert.equal(claimHasCreature({ creatureTypeId: "a" }), false);
  assert.equal(claimHasCreature({}), false);
});

test("ceremony de-dupes by ceremony key (creature or miss:castId)", () => {
  assert.equal(pondRippleCeremonyKey({ outcome: "miss", castId: "c1" }), "miss:c1");
  assert.equal(pondRippleCeremonyKey({ outcome: "miss" }), null);
  assert.equal(pondRippleCeremonyKey({ outcome: "catch", creatureTypeId: "fish-1" }), "fish-1");
  assert.equal(shouldPlayPondRippleCeremony("c1", null), true);
  assert.equal(shouldPlayPondRippleCeremony("miss:c1", "miss:c1"), false);
  assert.equal(shouldPlayPondRippleCeremony("miss:c2", "miss:c1"), true);
  assert.equal(shouldPlayPondRippleCeremony(undefined, "c1"), false);
});

test("fixture matrix covers 16 display × subscription combos", () => {
  assert.equal(CATALOG_RARITY_RING_FIXTURES.length, 16);
  const ids = new Set(CATALOG_RARITY_RING_FIXTURES.map((f) => f.id));
  assert.equal(ids.size, 16);
  assert.ok(CATALOG_RARITY_RING_FIXTURES.some((f) => f.caughtTier === "empty"));
});

test("claim threshold scrim uses unified warm token", () => {
  assert.equal(CLAIM_THRESHOLD_SCRIM, "rgba(31, 26, 23, 0.35)");
});
