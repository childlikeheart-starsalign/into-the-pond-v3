import assert from "node:assert/strict";
import { mock, test } from "node:test";

type Capture = { event: string; properties: Record<string, unknown> };

const captures: Capture[] = [];

mock.module("@/src/services/analytics/posthogClient", {
  namedExports: {
    posthog: {
      capture(event: string, properties: Record<string, unknown>) {
        captures.push({ event, properties });
      },
    },
  },
});

mock.module("@/src/services/analytics/analyticsOptOut", {
  namedExports: {
    isAnalyticsCaptureDisabled: () => false,
  },
});

async function loadEvents() {
  return import("@/src/services/analytics/fishingClaimEvents");
}

function resetCaptures(): void {
  captures.length = 0;
}

test("flag OFF path: resolve + dismiss only (no pond_ripple_complete)", async () => {
  const { trackClaimCelebrationDismissed, trackFishingClaimResolved } = await loadEvents();
  resetCaptures();
  trackFishingClaimResolved({
    outcome: "miss",
    rarityIndicator: "epic",
    ringUiEnabled: false,
    castId: "cast_qa_off",
  });
  trackClaimCelebrationDismissed({
    outcome: "miss",
    ringUiEnabled: false,
    dwellMs: 4200,
  });

  assert.deepEqual(
    captures.map((c) => c.event),
    ["fishing_claim_resolved", "claim_celebration_dismissed"],
  );
  assert.equal(captures[0]!.properties.ringUiEnabled, false);
  assert.equal(captures[1]!.properties.dwellMs, 4200);
  assert.ok(!captures.some((c) => c.event === "pond_ripple_complete"));
});

test("flag ON path: resolve + pond ripple + dismiss", async () => {
  const { trackClaimCelebrationDismissed, trackFishingClaimResolved, trackPondRippleComplete } =
    await loadEvents();
  resetCaptures();
  trackFishingClaimResolved({
    outcome: "catch",
    rarityIndicator: "rare",
    creatureTypeId: "ember-darter",
    ringUiEnabled: true,
    castId: "cast_qa_on",
  });
  trackPondRippleComplete({
    caughtTier: "rare",
    subscriptionTier: "wooden",
    ringUiEnabled: true,
  });
  trackClaimCelebrationDismissed({
    outcome: "catch",
    ringUiEnabled: true,
    dwellMs: 8100,
  });

  assert.deepEqual(
    captures.map((c) => c.event),
    ["fishing_claim_resolved", "pond_ripple_complete", "claim_celebration_dismissed"],
  );
  assert.equal(captures[1]!.properties.caughtTier, "rare");
  assert.equal(captures[1]!.properties.subscriptionTier, "wooden");
});

test("claim ceremony payloads omit PII fields", async () => {
  const { trackFishingClaimResolved } = await loadEvents();
  resetCaptures();
  trackFishingClaimResolved({
    outcome: "catch",
    rarityIndicator: "common",
    creatureTypeId: "puddle-dart",
    ringUiEnabled: true,
    castId: "cast_pii_check",
  });
  const props = captures[0]!.properties;
  for (const key of Object.keys(props)) {
    assert.ok(!/email|password|name|message|child/i.test(key), `unexpected PII key: ${key}`);
  }
});
