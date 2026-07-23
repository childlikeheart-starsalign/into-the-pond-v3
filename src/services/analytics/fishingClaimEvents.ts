import type { PostHogEventProperties } from "@posthog/core";

import { posthog } from "@/src/services/analytics/posthogClient";
import { isAnalyticsCaptureDisabled } from "@/src/services/analytics/analyticsOptOut";
import type {
  PondRippleActiveTier,
  PondRippleDisplayTier,
} from "@/src/features/fishing/pondRippleCatalog";

function capture(event: string, properties: PostHogEventProperties): void {
  if (!posthog || isAnalyticsCaptureDisabled()) return;
  posthog.capture(event, properties);
}

/** Fired when claimCast resolves and the sanctuary modal opens. */
export function trackFishingClaimResolved(params: {
  outcome: string;
  rarityIndicator?: string;
  creatureTypeId?: string;
  ringUiEnabled: boolean;
  castId?: string;
}): void {
  capture("fishing_claim_resolved", params);
}

/** Fired when cancelCast succeeds within the grace window. */
export function trackFishingCastCancelled(params: { castId: string; baitRefunded: boolean }): void {
  capture("fishing_cast_cancelled", {
    ...params,
    area: "fishing",
    flow: "cancel_cast",
  });
}

/** Fired once when Pond Ripple completes (ring UI enabled only). */
export function trackPondRippleComplete(params: {
  caughtTier: PondRippleDisplayTier;
  subscriptionTier: PondRippleActiveTier;
  ringUiEnabled: boolean;
}): void {
  capture("pond_ripple_complete", params);
}

/** Fired when the user taps Continue on the field-note card. */
export function trackClaimCelebrationDismissed(params: {
  outcome: string;
  ringUiEnabled: boolean;
  dwellMs?: number;
}): void {
  capture("claim_celebration_dismissed", params);
}
