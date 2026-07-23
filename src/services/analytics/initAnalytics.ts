/**
 * Boot analytics after PostHog is constructed.
 * Kept separate from posthogClient so analyticsOptOut can import `posthog`
 * without creating a require cycle (posthogClient ↔ analyticsOptOut).
 */
import "@/src/services/analytics/posthogClient";
import { loadAnalyticsOptOutPreference } from "@/src/services/analytics/analyticsOptOut";

void loadAnalyticsOptOutPreference();
