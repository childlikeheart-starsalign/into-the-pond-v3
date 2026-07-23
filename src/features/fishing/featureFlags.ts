import { useSyncExternalStore } from "react";

import { FEATURE_FLAG_NAMES } from "@/shared/featureFlags/types";
import { firebaseAuth } from "@/src/services/firebase/client";
import {
  getFeatureFlagsEpoch,
  isFeatureEnabled,
  subscribeFeatureFlags,
} from "@/src/services/featureFlags/sessionFlags";

export const FISHING_FLAG_NAMES = {
  catalogRarityRingUi: FEATURE_FLAG_NAMES.catalogRarityRingUi,
} as const;

/**
 * Session-evaluated fishing UI flags. Default OFF until hydrate runs.
 * Prefer `useFishingFeatureFlags` in React so UI re-renders after hydrate.
 */
export function useFishingFeatureFlags(): { catalogRarityRingUi: boolean } {
  useSyncExternalStore(subscribeFeatureFlags, getFeatureFlagsEpoch, getFeatureFlagsEpoch);
  const uid = firebaseAuth.currentUser?.uid ?? null;
  return {
    catalogRarityRingUi: isFeatureEnabled(FEATURE_FLAG_NAMES.catalogRarityRingUi, uid),
  };
}
