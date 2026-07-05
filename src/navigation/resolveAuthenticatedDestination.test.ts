import { routes } from "@/src/navigation/routes";
import {
  resolveAuthenticatedDestination,
  type AuthDestinationInput,
} from "@/src/navigation/resolveAuthenticatedDestination";
import { resetAuthInitStore, setAuthInitPhase } from "@/src/state/authInitStore";

function expectEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function baseInput(overrides: Partial<AuthDestinationInput> = {}): AuthDestinationInput {
  return {
    uid: "user-1",
    emailVerified: true,
    sanctuaryInitialized: true,
    pathname: "/sanctuary",
    narrative: {
      ready: true,
      needsArchetype: false,
      needsBirthDate: false,
      needsNarrative: false,
    },
    syncNarrativeNeeds: null,
    celebration: { ready: true, hasCompleted: true },
    pendingAuthDeepLink: null,
    gateUnlockedThisSession: false,
    ...overrides,
  };
}

export function runResolveAuthenticatedDestinationSelfTest(): void {
  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({ uid: null, pathname: "/sanctuary", gateUnlockedThisSession: false }),
    ),
    routes.gateEntry,
    "signed out gate locked on sanctuary → gate",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({ uid: null, pathname: "/login", gateUnlockedThisSession: false }),
    ),
    routes.gateEntry,
    "signed out gate locked on login → gate",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({ uid: null, pathname: routes.gateEntry, gateUnlockedThisSession: false }),
    ),
    null,
    "signed out gate locked already on gate → stay",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        uid: null,
        pathname: "/signup",
        gateUnlockedThisSession: true,
      }),
    ),
    null,
    "signed out gate unlocked on signup → stay",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        uid: null,
        pathname: "/login",
        gateUnlockedThisSession: true,
      }),
    ),
    null,
    "signed out gate unlocked on login → stay",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        uid: null,
        pathname: routes.verifyRequired,
        gateUnlockedThisSession: false,
      }),
    ),
    routes.gateEntry,
    "signed out gate locked on verify-required → gate",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        uid: null,
        pathname: routes.verifyRequired,
        gateUnlockedThisSession: true,
      }),
    ),
    null,
    "signed out gate unlocked on verify-required → stay",
  );

  expectEqual(
    resolveAuthenticatedDestination(baseInput({ emailVerified: false, pathname: "/login" })),
    routes.verifyRequired,
    "unverified cold start on login → verify-required",
  );

  expectEqual(
    resolveAuthenticatedDestination(baseInput({ emailVerified: false, pathname: "/sanctuary" })),
    routes.verifyRequired,
    "unverified cold start on sanctuary → verify-required",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({ emailVerified: false, pathname: "/verify-required" }),
    ),
    null,
    "unverified on verify-required → stay",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        emailVerified: false,
        pathname: "/finish-email",
        celebration: { ready: true, hasCompleted: false },
      }),
    ),
    null,
    "unverified on finish-email action route → stay",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        celebration: { ready: true, hasCompleted: false },
        pathname: "/verify-required",
      }),
    ),
    routes.emailVerified,
    "verified celebration unseen → email-verified",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        sanctuaryInitialized: false,
        celebration: { ready: true, hasCompleted: false },
        pathname: "/login",
      }),
    ),
    routes.emailVerified,
    "first-time verify funnel uninitialized on login → email-verified",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        sanctuaryInitialized: false,
        celebration: { ready: true, hasCompleted: true },
        pathname: "/login",
      }),
    ),
    routes.sanctuary,
    "returning user uninitialized on login → sanctuary",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        sanctuaryInitialized: false,
        celebration: { ready: true, hasCompleted: true },
        pathname: "/sanctuary",
      }),
    ),
    null,
    "returning user uninitialized on sanctuary → stay",
  );

  setAuthInitPhase("initializing");
  try {
    expectEqual(
      resolveAuthenticatedDestination(
        baseInput({
          sanctuaryInitialized: false,
          celebration: { ready: true, hasCompleted: false },
          pathname: "/login",
        }),
      ),
      null,
      "initializing phase → stay (no redirect)",
    );
  } finally {
    resetAuthInitStore();
  }

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        celebration: { ready: true, hasCompleted: false },
        pathname: "/email-verified",
      }),
    ),
    null,
    "sticky email-verified until Enter",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        celebration: { ready: true, hasCompleted: true },
        narrative: {
          ready: true,
          needsArchetype: true,
          needsBirthDate: false,
          needsNarrative: false,
        },
        pathname: "/sanctuary",
      }),
    ),
    routes.narrativeOnboarding,
    "celebration done needs archetype → narrative",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        celebration: { ready: true, hasCompleted: true },
        pathname: "/login",
      }),
    ),
    routes.sanctuary,
    "fully onboarded on login → sanctuary",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        celebration: { ready: true, hasCompleted: true },
        pathname: "/sanctuary",
      }),
    ),
    null,
    "returning user cold start on sanctuary → stay",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        celebration: { ready: true, hasCompleted: true },
        pathname: "/login",
      }),
    ),
    routes.sanctuary,
    "returning user cold start → sanctuary",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        celebration: { ready: false, hasCompleted: false },
        pathname: "/sanctuary",
      }),
    ),
    null,
    "celebration hydrating on sanctuary → stay (cold start)",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        celebration: { ready: false, hasCompleted: false },
        pathname: "/verify-required",
      }),
    ),
    routes.emailVerified,
    "celebration hydrating on verify-required → email-verified (do not block Mail return)",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        celebration: { ready: false, hasCompleted: false },
        pathname: "/finish-email",
      }),
    ),
    routes.emailVerified,
    "celebration hydrating on finish-email → email-verified",
  );

  expectEqual(
    resolveAuthenticatedDestination(
      baseInput({
        pendingAuthDeepLink: "finish-email",
        emailVerified: false,
        pathname: "/login",
      }),
    ),
    routes.finishEmail,
    "pending deep link overrides generic routing",
  );

  expectEqual(
    resolveAuthenticatedDestination(baseInput({ uid: "user-1", pathname: routes.gateEntry })),
    routes.sanctuary,
    "signed in on gate entry → sanctuary",
  );
}
