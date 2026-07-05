import assert from "node:assert/strict";
import test from "node:test";

import { resolveFishingClaimFromContext } from "./buildFishingClaimContext";
import type { CreatureRef } from "./encounterEngine";
import { catchChance, DUPLICATE_CONSOLATION, resolveFishingClaim } from "./encounterEngine";

const sampleCatalog: CreatureRef[] = [
  {
    creatureTypeId: "puddle-dart",
    displayName: "Puddle Dart",
    poolTier: "common",
    elementType: "fire",
    rodRequired: "basic",
    peakWonderGate: 0,
  },
  {
    creatureTypeId: "bubble-mote",
    displayName: "Bubble Mote",
    poolTier: "common",
    elementType: "water",
    rodRequired: "basic",
    peakWonderGate: 0,
  },
  {
    creatureTypeId: "ember-koi",
    displayName: "Ember Koi",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
  },
];

test("wonder gate miss when pool is empty", () => {
  const claim = resolveFishingClaim({
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
  const claim = resolveFishingClaimFromContext({
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
    { outcome: first.outcome, creatureTypeId: first.creatureTypeId },
    { outcome: second.outcome, creatureTypeId: second.creatureTypeId },
  );
});

test("deterministic catch for seeded roll", () => {
  const claim = resolveFishingClaimFromContext({
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
});

test("duplicate when entire pool is already caught", () => {
  const duplicate = resolveFishingClaimFromContext({
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
  assert.equal(duplicate.creatureTypeId, "puddle-dart");
  assert.equal(duplicate.wonderAwarded, DUPLICATE_CONSOLATION.common.wonder);
  assert.equal(duplicate.materialsAwarded, DUPLICATE_CONSOLATION.common.materials);
});

test("bait increases catch chance ceiling", () => {
  const noBait = catchChance("rare", "fire", 200, false);
  const withBait = catchChance("rare", "fire", 200, true);
  assert.ok(withBait > noBait);
});
