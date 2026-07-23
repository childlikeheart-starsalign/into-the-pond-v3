import assert from "node:assert/strict";
import test from "node:test";

import { toClientClaimSummary } from "./fishingClaimPresentation";
import type { FishingClaim } from "../types";

function baseClaim(overrides: Partial<FishingClaim> = {}): FishingClaim {
  return {
    id: "claim_1",
    encounterId: "cast_1",
    userId: "user_a",
    claimedAt: 1_700_000_000_000,
    currentWonderAtClaim: 10,
    outcome: "miss",
    poolTier: "common",
    rarityIndicator: "common",
    wonderAwarded: 0,
    materialsAwarded: 1,
    metadata: {},
    ...overrides,
  };
}

test("toClientClaimSummary copies wonder_gate reason for miss SFX", () => {
  const summary = toClientClaimSummary(
    baseClaim({ metadata: { castId: "cast_1", reason: "wonder_gate" } }),
  );
  assert.equal(summary.outcome, "miss");
  assert.deepEqual(summary.metadata, { reason: "wonder_gate" });
});

test("toClientClaimSummary copies chance reason for miss SFX", () => {
  const summary = toClientClaimSummary(
    baseClaim({ metadata: { castId: "cast_1", reason: "chance" } }),
  );
  assert.deepEqual(summary.metadata, { reason: "chance" });
});

test("toClientClaimSummary omits metadata when reason absent", () => {
  const summary = toClientClaimSummary(baseClaim({ metadata: { castId: "cast_1" } }));
  assert.equal(summary.metadata, undefined);
});

test("toClientClaimSummary does not expose unrelated metadata keys", () => {
  const summary = toClientClaimSummary(
    baseClaim({
      outcome: "catch",
      creatureTypeId: "puddle-dart",
      creatureDisplayName: "Puddle Dart",
      metadata: { castId: "cast_1", reason: "chance", secretOdds: 0.99 },
    }),
  );
  assert.deepEqual(summary.metadata, { reason: "chance" });
  assert.equal("secretOdds" in (summary.metadata ?? {}), false);
});
