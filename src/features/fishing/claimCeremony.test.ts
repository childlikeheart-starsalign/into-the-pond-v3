import assert from "node:assert/strict";
import test from "node:test";

import {
  claimPresentationId,
  shouldPlayRingForPresentation,
  shouldShowCatalogRarityRingOverlay,
} from "@/src/features/fishing/claimCeremony";

test("shouldShowCatalogRarityRingOverlay shows ring until reveal ready", () => {
  assert.equal(shouldShowCatalogRarityRingOverlay({ claimRevealReady: false }), true);
  assert.equal(shouldShowCatalogRarityRingOverlay({ claimRevealReady: true }), false);
});

test("claimPresentationId uses castId and claimedAt", () => {
  assert.equal(claimPresentationId({ castId: "c1", claimedAt: 100 }), "c1:100");
  assert.equal(claimPresentationId({ castId: null, claimedAt: 100 }), null);
  assert.equal(claimPresentationId({ castId: "", claimedAt: 100 }), null);
});

test("shouldPlayRingForPresentation skips only matching completed presentation", () => {
  assert.equal(shouldPlayRingForPresentation("c1:100", null), true);
  assert.equal(shouldPlayRingForPresentation("c1:100", "c1:100"), false);
  assert.equal(shouldPlayRingForPresentation("c2:200", "c1:100"), true);
  // Same species / different cast — new presentationId plays ring
  assert.equal(shouldPlayRingForPresentation("c2:300", "c1:100"), true);
  assert.equal(shouldPlayRingForPresentation(null, "c1:100"), false);
});
