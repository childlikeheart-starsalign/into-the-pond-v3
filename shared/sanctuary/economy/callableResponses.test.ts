import assert from "node:assert/strict";
import test from "node:test";

import type {
  CraftBaitResponse,
  FishingClaimClientSummary,
  SubmitWellReflectionSuccess,
} from "./callableResponses";

test("CraftBaitResponse includes authoritative spend fields", () => {
  const sample: CraftBaitResponse = {
    success: true,
    tier: "basic",
    baitKey: "feather_bait",
    wonderSpent: 3,
    materialsSpent: { feather: 1 },
  };
  assert.equal(sample.wonderSpent, 3);
  assert.deepEqual(sample.materialsSpent, { feather: 1 });
});

test("FishingClaimClientSummary requires wonderAwarded", () => {
  const sample: FishingClaimClientSummary = {
    outcome: "miss",
    rarityIndicator: "common",
    wonderAwarded: 0,
    materialsAwarded: 1,
    previewOnly: true,
  };
  assert.equal(sample.wonderAwarded, 0);
});

test("SubmitWellReflectionSuccess allows previewOnly flag", () => {
  const sample: SubmitWellReflectionSuccess = {
    success: true,
    wonderAwarded: 12,
    newInsightCount: 1,
    atlasEntryId: "dev_1",
    previewOnly: true,
  };
  assert.equal(sample.previewOnly, true);
});
