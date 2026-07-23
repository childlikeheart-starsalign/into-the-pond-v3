import assert from "node:assert/strict";
import test from "node:test";

import { resolveFishingClaimFromContext } from "./buildFishingClaimContext";
import type { CreatureRef } from "./encounterEngine";
import {
  catchChance,
  DUPLICATE_CONSOLATION,
  effectiveWonderGate,
  resolveFishingClaim,
  topRareShareGivenCatch,
} from "./encounterEngine";

const sampleCatalog: CreatureRef[] = [
  {
    creatureTypeId: "puddle-dart",
    displayName: "Puddle Dart",
    poolTier: "common",
    elementType: "fire",
    rodRequired: "basic",
    peakWonderGate: 0,
    sub_tier: "uniform",
  },
  {
    creatureTypeId: "bubble-mote",
    displayName: "Bubble Mote",
    poolTier: "common",
    elementType: "water",
    rodRequired: "basic",
    peakWonderGate: 0,
    sub_tier: "uniform",
  },
  {
    creatureTypeId: "ember-koi",
    displayName: "Ember Koi",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    sub_tier: "common-rare",
  },
];

/** Sheet E epic_fire 13-count profile: 6 common-rare, 4 mid-rare, 3 top-rare. */
function epicFireSheetECatalog(): CreatureRef[] {
  const refs: CreatureRef[] = [];
  for (let i = 0; i < 6; i += 1) {
    refs.push({
      creatureTypeId: `epic-fire-common-${i}`,
      displayName: `Epic Fire Common ${i}`,
      poolTier: "epic",
      elementType: "fire",
      rodRequired: "epic1",
      peakWonderGate: 90,
      sub_tier: "common-rare",
    });
  }
  for (let i = 0; i < 4; i += 1) {
    refs.push({
      creatureTypeId: `epic-fire-mid-${i}`,
      displayName: `Epic Fire Mid ${i}`,
      poolTier: "epic",
      elementType: "fire",
      rodRequired: "epic1",
      peakWonderGate: 90,
      sub_tier: "mid-rare",
    });
  }
  for (let i = 0; i < 3; i += 1) {
    refs.push({
      creatureTypeId: `epic-fire-top-${i}`,
      displayName: `Epic Fire Top ${i}`,
      poolTier: "epic",
      elementType: "fire",
      rodRequired: "epic1",
      peakWonderGate: 90,
      sub_tier: "top-rare",
    });
  }
  return refs;
}

test("wonder gate miss when pool is empty", () => {
  const { claim } = resolveFishingClaim({
    claimId: "claim_gate",
    encounterId: "enc_gate",
    userId: "user_gate",
    castId: "cast_gate",
    rodId: "epic_fire",
    baitTier: null,
    currentWonderAtClaim: 0,
    caughtIds: new Set(),
    creatureCatalog: sampleCatalog.filter((creature) => creature.peakWonderGate > 0),
  });

  assert.equal(claim.outcome, "miss");
  assert.equal(claim.metadata?.reason, "wonder_gate");
});

test("deterministic miss for seeded roll", () => {
  const { claim } = resolveFishingClaimFromContext({
    claimId: "claim_miss",
    encounterId: "enc_miss",
    userId: "u",
    castId: "miss_0",
    rodUiId: "basic",
    baitUiId: "random_bait",
    currentWonderAtClaim: 0,
    caughtIds: new Set(),
    creatureCatalog: sampleCatalog,
  });

  assert.equal(claim.outcome, "miss");
  assert.equal(claim.materialsAwarded, 1);
});

test("seeded outcomes are stable across repeated calls", () => {
  const input = {
    claimId: "claim_stable",
    encounterId: "enc_stable",
    userId: "u",
    castId: "miss_0",
    rodUiId: "basic",
    baitUiId: "random_bait",
    currentWonderAtClaim: 0,
    caughtIds: new Set<string>(),
    creatureCatalog: sampleCatalog,
  };

  const first = resolveFishingClaimFromContext(input);
  const second = resolveFishingClaimFromContext({ ...input, claimId: "claim_stable_2" });
  assert.deepEqual(
    { outcome: first.claim.outcome, creatureTypeId: first.claim.creatureTypeId },
    { outcome: second.claim.outcome, creatureTypeId: second.claim.creatureTypeId },
  );
});

test("deterministic catch for seeded roll", () => {
  const { claim } = resolveFishingClaimFromContext({
    claimId: "claim_catch",
    encounterId: "enc_catch",
    userId: "qa_user_catch",
    castId: "cast_catch_seed",
    rodUiId: "basic",
    baitUiId: "random_bait",
    currentWonderAtClaim: 500,
    caughtIds: new Set(),
    creatureCatalog: sampleCatalog,
  });

  assert.equal(claim.outcome, "catch");
  assert.ok(claim.creatureTypeId);
  assert.ok(claim.spiritMessage?.includes(claim.creatureDisplayName ?? ""));
});

test("duplicate when entire pool is already caught", () => {
  const { claim: duplicate } = resolveFishingClaimFromContext({
    claimId: "claim_dup",
    encounterId: "enc_dup",
    userId: "u_dup",
    castId: "dup_0",
    rodUiId: "basic",
    baitUiId: "random_bait",
    currentWonderAtClaim: 500,
    caughtIds: new Set(["puddle-dart", "bubble-mote"]),
    creatureCatalog: sampleCatalog,
  });

  assert.equal(duplicate.outcome, "duplicate");
  assert.ok(
    duplicate.creatureTypeId === "puddle-dart" || duplicate.creatureTypeId === "bubble-mote",
  );
  assert.equal(duplicate.wonderAwarded, DUPLICATE_CONSOLATION.common.wonder);
  assert.equal(duplicate.materialsAwarded, DUPLICATE_CONSOLATION.common.materials);
  assert.ok(duplicate.spiritMessage?.includes(duplicate.creatureDisplayName ?? ""));
});

test("Sheet D catch% rises by bait tier (basic +5, mid +12, premium +20)", () => {
  const noBait = catchChance("rare", "fire", 45, null);
  const basic = catchChance("rare", "fire", 45, "basic");
  const mid = catchChance("rare", "fire", 45, "rare");
  const premium = catchChance("rare", "fire", 45, "epic");

  // Worked Sheet C/D example: wonder-capped base 0.20 at 45W
  assert.equal(noBait, 0.2);
  assert.equal(basic, 0.25);
  assert.equal(mid, 0.32);
  assert.equal(premium, 0.4);
  assert.ok(premium > mid && mid > basic && basic > noBait);
});

test("Sheet D rare-element 40W clamp: mid and premium stay at exactly 40", () => {
  assert.equal(effectiveWonderGate(40, null), 40);
  assert.equal(effectiveWonderGate(40, "basic"), 40);
  assert.equal(effectiveWonderGate(40, "rare"), 40);
  assert.equal(effectiveWonderGate(40, "epic"), 40);
});

test("Sheet D wildcard mid → 40, premium → 0 (intentional asymmetry)", () => {
  assert.equal(effectiveWonderGate(65, "basic"), 65);
  assert.equal(effectiveWonderGate(65, "rare"), 40);
  assert.equal(effectiveWonderGate(65, "epic"), 0);
});

test("Sheet D epic + premium lands exactly on 40 (90→65→40)", () => {
  assert.equal(effectiveWonderGate(90, "rare"), 65);
  assert.equal(effectiveWonderGate(90, "epic"), 40);
});

test("epic_fire dry streak boosts top-rare share above baseline (Sheet E)", () => {
  const catalog = epicFireSheetECatalog();
  const baseline = topRareShareGivenCatch(catalog, "epic_fire", 0);
  const boosted = topRareShareGivenCatch(catalog, "epic_fire", 25);

  // Baseline: 3×2 / 36 = 16.7%
  assert.ok(Math.abs(baseline - 1 / 6) < 1e-9, `baseline ${baseline}`);
  // Streak 25 → past=5 → top weight 2×1.75=3.5 each → 10.5/40.5 ≈ 25.9%
  assert.ok(Math.abs(boosted - 10.5 / 40.5) < 1e-9, `boosted ${boosted}`);
  assert.ok(boosted > baseline, "pity must raise top-rare share, not lower it");
  assert.ok(Math.abs(boosted - 0.25925925925925924) < 1e-9);
});

test("rare_wildcard rod resolves against elementType any pool (not wonder_gate)", () => {
  const wildcardCatalog: CreatureRef[] = [
    {
      creatureTypeId: "prism-drifter",
      displayName: "Prism Drifter",
      poolTier: "rare",
      elementType: "any",
      rodRequired: "rare5",
      peakWonderGate: 65,
      sub_tier: "common-rare",
    },
  ];

  const { claim } = resolveFishingClaimFromContext({
    claimId: "claim_wildcard",
    encounterId: "enc_wildcard",
    userId: "u_wildcard",
    castId: "wildcard_cast",
    rodUiId: "rare_5",
    baitUiId: "random_bait",
    currentWonderAtClaim: 100,
    caughtIds: new Set(),
    creatureCatalog: wildcardCatalog,
  });

  assert.notEqual(claim.metadata?.reason, "wonder_gate");
});

test("10 consecutive chance misses guarantee the next eligible catch roll", () => {
  const { claim, nextFishingPity } = resolveFishingClaim({
    claimId: "claim_pity",
    encounterId: "enc_pity",
    userId: "u_pity",
    // miss_0 is a known miss seed at 0 wonder without bait on basic
    castId: "miss_0",
    rodId: "basic",
    baitTier: null,
    currentWonderAtClaim: 0,
    caughtIds: new Set(),
    creatureCatalog: sampleCatalog,
    fishingPity: { consecutiveChanceMisses: 10, epicTopRareDryStreak: {} },
  });

  assert.notEqual(claim.outcome, "miss");
  assert.equal(claim.metadata?.guaranteedCatch, true);
  assert.equal(nextFishingPity.consecutiveChanceMisses, 0);
});
