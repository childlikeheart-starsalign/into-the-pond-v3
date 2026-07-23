/**
 * Create Child Profile funnel analytics (PostHog).
 * childId is attached on completion so drop-off can be measured per child, not once.
 */
import type { PostHogEventProperties } from "@posthog/core";

import { isAnalyticsCaptureDisabled } from "@/src/services/analytics/analyticsOptOut";
import { posthog } from "@/src/services/analytics/posthogClient";

function capture(event: string, properties: PostHogEventProperties): void {
  if (!posthog || isAnalyticsCaptureDisabled()) return;
  posthog.capture(event, properties);
}

export function trackCreateChildProfileEntry(params: { entry: "first_run" | "add_child" }): void {
  capture("create_child_profile_entry", {
    area: "profile",
    flow: "create_child_profile",
    entry: params.entry,
  });
}

export function trackCreateChildProfileCompleted(params: {
  entry: "first_run" | "add_child";
  childId: string;
  childOrder: number;
}): void {
  capture("create_child_profile_completed", {
    area: "profile",
    flow: "create_child_profile",
    entry: params.entry,
    childId: params.childId,
    childOrder: params.childOrder,
  });
}
