import type { Href } from "expo-router";

import { mergeCelebrationState } from "@/src/navigation/mergeCelebrationState";
import { resolveAuthenticatedDestination } from "@/src/navigation/resolveAuthenticatedDestination";
import type { getSyncNarrativeNeeds } from "@/src/services/onboarding/narrativeOnboardingStorage";
import { isSanctuaryInitialized } from "@/src/state/authInitStore";

export type SignInArrivalReadiness = {
  uid: string | null;
  emailVerified: boolean;
  sanctuaryInitialized: boolean;
  authReady: boolean;
  authAccessReady: boolean;
  celebration: { ready: boolean; hasCompleted: boolean };
  narrative: {
    ready: boolean;
    needsArchetype: boolean;
    needsBirthDate: boolean;
    needsNarrative: boolean;
  };
  syncNarrativeNeeds: ReturnType<typeof getSyncNarrativeNeeds>;
  gateUnlockedThisSession: boolean;
};

/** Destination when sign-in arrival may navigate (login path, auth caught up). */
export function resolveSignInArrivalDestination(
  readiness: SignInArrivalReadiness,
  expectedUid: string | null,
): Href | null {
  if (!expectedUid || readiness.uid !== expectedUid) {
    return null;
  }
  if (!readiness.authReady || !readiness.emailVerified) {
    return null;
  }
  if (readiness.uid && !readiness.authAccessReady) {
    return null;
  }

  const mergedCelebration = mergeCelebrationState(readiness.uid, readiness.celebration);

  return resolveAuthenticatedDestination({
    uid: readiness.uid,
    emailVerified: readiness.emailVerified,
    sanctuaryInitialized: readiness.sanctuaryInitialized || isSanctuaryInitialized(),
    pathname: "/login",
    narrative: readiness.narrative,
    syncNarrativeNeeds: readiness.syncNarrativeNeeds,
    celebration: mergedCelebration,
    gateUnlockedThisSession: readiness.gateUnlockedThisSession,
  });
}
