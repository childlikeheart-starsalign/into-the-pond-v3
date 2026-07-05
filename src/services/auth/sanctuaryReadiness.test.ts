import { routes } from "@/src/navigation/routes";
import {
  resolveSignInArrivalDestination,
  type SignInArrivalReadiness,
} from "@/src/navigation/resolveSignInArrivalDestination";
import { isPlayableUserDoc } from "@/src/services/auth/sanctuaryPlayable";
import type { UserDoc } from "@/src/services/firebase/types";
import { resetAuthInitStore, setSanctuaryInitializedFromRemote } from "@/src/state/authInitStore";

function expectEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function minimalLegacyUserDoc(): UserDoc {
  return {
    email: "user@example.com",
    hasSeenTutorial: false,
    totalWonder: 0,
    currentWonder: 0,
    storedWonder: 0,
    lifetimeWonderEarned: 0,
    completedLessons: {},
    dailyQuestionCount: 0,
    lastQuestionResetDate: null,
    fishingWonderToday: 0,
    lastFishingResetDate: null,
    activeRod: "basic",
    rodDullnessCount: 0,
    isRodDull: false,
    subscription: {
      productId: null,
      expiryDate: null,
      isLifetime: false,
      subscriptionStatus: "free",
      lastVerifiedAt: null,
      source: "unknown",
    },
    activeCast: null,
    inventory: {
      parts: 0,
      baits: {
        feather_bait: 0,
        scale_bait: 0,
        glimmerdust_bait: 0,
        random_bait: 0,
      },
      baitMaterials: { feather: 0, scale: 0, glimmerdust: 0 },
    },
    childArchetype: null,
    hasCompletedDay1Narrative: false,
    hasCompletedEmailVerifiedCelebration: true,
  };
}

function baseReadiness(overrides: Partial<SignInArrivalReadiness> = {}): SignInArrivalReadiness {
  return {
    uid: "user-1",
    emailVerified: true,
    sanctuaryInitialized: false,
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

export function runSanctuaryReadinessSelfTest(): void {
  expectEqual(isPlayableUserDoc(null), false, "null doc → not playable");
  expectEqual(isPlayableUserDoc(undefined), false, "undefined doc → not playable");

  const legacy = minimalLegacyUserDoc();
  expectEqual(isPlayableUserDoc(legacy), true, "legacy doc without authFunnel → playable");

  expectEqual(
    isPlayableUserDoc({
      ...legacy,
      authFunnel: { sanctuaryInitialized: true },
    }),
    true,
    "authFunnel.sanctuaryInitialized → playable",
  );

  setSanctuaryInitializedFromRemote(true);
  try {
    expectEqual(
      resolveSignInArrivalDestination(baseReadiness(), "user-1"),
      routes.sanctuary,
      "store initialized + readiness false → sanctuary from login",
    );
  } finally {
    resetAuthInitStore();
  }
}
