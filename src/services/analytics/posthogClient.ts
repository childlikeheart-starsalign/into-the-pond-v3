import PostHog from "posthog-react-native";

import { env } from "@/src/config/env";

const apiKey = env.posthog.apiKey;

export const posthog = apiKey
  ? new PostHog(apiKey, {
      host: env.posthog.host,
      enableSessionReplay: true,
      sessionReplayConfig: {
        maskAllTextInputs: true,
        maskAllImages: false,
      },
      captureAppLifecycleEvents: true,
    })
  : null;
