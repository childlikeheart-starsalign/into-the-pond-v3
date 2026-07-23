import { useSyncExternalStore } from "react";

import { FEATURE_FLAG_NAMES } from "@/shared/featureFlags/types";
import { firebaseAuth } from "@/src/services/firebase/client";
import {
  getFeatureFlagsEpoch,
  isFeatureEnabled,
  subscribeFeatureFlags,
} from "@/src/services/featureFlags/sessionFlags";

export const CHILD_PROFILE_FLAG_NAMES = FEATURE_FLAG_NAMES;

/**
 * Session-evaluated child-profile flags (Firestore allowlist docs).
 * Default OFF until `hydrateSessionFeatureFlags` runs for the signed-in uid.
 * Prefer `useChildProfileFeatureFlags` in React so UI re-renders after hydrate.
 */
export const childProfileFeatureFlags = {
  get migrationDualRead(): boolean {
    return isFeatureEnabled(
      FEATURE_FLAG_NAMES.childMigrationDualRead,
      firebaseAuth.currentUser?.uid ?? null,
    );
  },
  get createChildProfileUi(): boolean {
    return isFeatureEnabled(
      FEATURE_FLAG_NAMES.createChildProfileUi,
      firebaseAuth.currentUser?.uid ?? null,
    );
  },
  get newOnboardingEnabled(): boolean {
    return isFeatureEnabled(
      FEATURE_FLAG_NAMES.newOnboardingEnabled,
      firebaseAuth.currentUser?.uid ?? null,
    );
  },
  get childResultPeek(): boolean {
    return isFeatureEnabled(
      FEATURE_FLAG_NAMES.childResultPeek,
      firebaseAuth.currentUser?.uid ?? null,
    );
  },
};

export function useChildProfileFeatureFlags(): {
  migrationDualRead: boolean;
  createChildProfileUi: boolean;
  newOnboardingEnabled: boolean;
  childResultPeek: boolean;
} {
  useSyncExternalStore(subscribeFeatureFlags, getFeatureFlagsEpoch, getFeatureFlagsEpoch);
  const uid = firebaseAuth.currentUser?.uid ?? null;
  return {
    migrationDualRead: isFeatureEnabled(FEATURE_FLAG_NAMES.childMigrationDualRead, uid),
    createChildProfileUi: isFeatureEnabled(FEATURE_FLAG_NAMES.createChildProfileUi, uid),
    newOnboardingEnabled: isFeatureEnabled(FEATURE_FLAG_NAMES.newOnboardingEnabled, uid),
    childResultPeek: isFeatureEnabled(FEATURE_FLAG_NAMES.childResultPeek, uid),
  };
}
