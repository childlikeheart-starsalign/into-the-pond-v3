import PostHog from "posthog-react-native";

import { env } from "@/src/config/env";
import { loadAnalyticsOptOutPreference } from "@/src/services/analytics/analyticsOptOut";

const apiKey = env.posthog.apiKey;

export const posthog = apiKey
  ? new PostHog(apiKey, {
      host: env.posthog.host,
      enableSessionReplay: true,
      sessionReplayConfig: {
        maskAllTextInputs: true,
        maskAllImages: true,
        maskAllSandboxedViews: true,
      },
      captureAppLifecycleEvents: true,
    })
  : null;

void loadAnalyticsOptOutPreference();
