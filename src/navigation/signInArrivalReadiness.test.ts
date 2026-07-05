import { routes } from "@/src/navigation/routes";
import { mergeCelebrationState } from "@/src/navigation/mergeCelebrationState";
import {
  resolveAuthenticatedDestination,
  type AuthDestinationInput,
} from "@/src/navigation/resolveAuthenticatedDestination";
import {
  resolveSignInArrivalDestination,
  type SignInArrivalReadiness,
} from "@/src/navigation/resolveSignInArrivalDestination";
import {
  clearCelebrationSessionComplete,
  markCelebrationSessionComplete,
} from "@/src/services/onboarding/emailVerifiedCelebrationSession";
import { resetAuthInitStore, setSanctuaryInitializedFromRemote } from "@/src/state/authInitStore";

function expectEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function baseReadiness(overrides: Partial<SignInArrivalReadiness> = {}): SignInArrivalReadiness {
  return {
    uid: "user-1",
    emailVerified: true,
    sanctuaryInitialized: true,
    authReady: true,
    authAccessReady: true,
    celebration: { ready: true, hasCompleted: true },
    narrative: {
      ready: true,
      needsArchetype: false,
      needsBirthDate: false,
      needsNarrative: false,
    },
    syncNarrativeNeeds: null,
    gateUnlockedThisSession: true,
    ...overrides,
  };
}

function baseResolverInput(overrides: Partial<AuthDestinationInput> = {}): AuthDestinationInput {
  return {
    uid: "user-1",
    emailVerified: true,
    sanctuaryInitialized: true,
    pathname: "/login",
    narrative: {
      ready: true,
      needsArchetype: false,
      needsBirthDate: false,
      needsNarrative: false,
    },
    syncNarrativeNeeds: null,
    celebration: { ready: true, hasCompleted: true },
    gateUnlockedThisSession: true,
    ...overrides,
  };
}

export function runSignInArrivalReadinessSelfTest(): void {
  clearCelebrationSessionComplete();

  markCelebrationSessionComplete("user-1");
  const mergedAfterSession = mergeCelebrationState("user-1", { ready: false, hasCompleted: false });
  expectEqual(mergedAfterSession.ready, true, "mergeCelebrationState sets ready from session");
  expectEqual(
    mergedAfterSession.hasCompleted,
    true,
    "mergeCelebrationState sets hasCompleted from session",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseResolverInput({
        celebration: { ready: false, hasCompleted: true },
      }),
    ),
    null,
    "resolver without ready merge blocks before hasCompleted check",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseResolverInput({
        celebration: mergeCelebrationState("user-1", { ready: false, hasCompleted: true }),
      }),
    ),
    routes.sanctuary,
    "resolver with merged ready proceeds to sanctuary from login",
  );

  expectEqual(
    resolveSignInArrivalDestination(baseReadiness(), "user-1"),
    routes.sanctuary,
    "arrival destination for onboarded returning user",
  );

  expectEqual(
    resolveSignInArrivalDestination(baseReadiness({ uid: null }), "user-1"),
    null,
    "arrival waits when authState.uid lags expectedUid",
  );

  expectEqual(
    resolveSignInArrivalDestination(baseReadiness(), "other-uid"),
    null,
    "arrival waits when expectedUid mismatches auth uid",
  );

  setSanctuaryInitializedFromRemote(true);
  try {
    expectEqual(
      resolveSignInArrivalDestination(baseReadiness({ sanctuaryInitialized: false }), "user-1"),
      routes.sanctuary,
      "arrival uses authInitStore when readiness sanctuaryInitialized lags",
    );
  } finally {
    resetAuthInitStore();
  }

  clearCelebrationSessionComplete();
}
