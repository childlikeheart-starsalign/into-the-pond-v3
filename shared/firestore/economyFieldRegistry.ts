/**
 * Canonical registry for Invariant 2 — keep in sync with firestore.rules via
 * functions/scripts/validate-firestore-rules-registry.js
 */

/** Server-only fields on users/{uid} — client must never create or update these. */
export const ECONOMY_USER_FIELD_KEYS = [
  "totalWonder",
  "currentWonder",
  "storedWonder",
  "lifetimeWonderEarned",
  "lastReflectionAt",
  "inventory",
  "activeCast",
  "lastClaimedCastId",
  "fishingWonderToday",
  "lastFishingResetDate",
  "fishingPity",
  /** Rolling cancel timestamps (ms) — server-enforced cancel rate limit. */
  "castCancelRecentMs",
  "dailyQuestionCount",
  "lastQuestionResetDate",
  "activeRod",
  "rodDullnessCount",
  "isRodDull",
  "equippedRodId",
  "subscription",
  "completedLessons",
] as const;

export type EconomyUserFieldKey = (typeof ECONOMY_USER_FIELD_KEYS)[number];

/** Server-write-only subcollections under users/{uid}. */
export const ECONOMY_SUBCOLLECTIONS = [
  "diaryEntries",
  "creatures",
  "wellQuestions",
  "wellState",
  "childAtlas",
  "playerRods",
  "lessonProgress",
  "wonderTransactions",
  "economyLedger",
  "economyLedgerCheckpoint",
  "economyIdempotency",
  "sanctuaryAnalytics",
  "fishingClaims",
  "practiceCompletions",
  "purchases",
  /** Multi-child profile + nested Well/Atlas — Admin SDK / callables only. */
  "children",
] as const;

export type EconomySubcollection = (typeof ECONOMY_SUBCOLLECTIONS)[number];

/** Fields allowed on client create of users/{uid}. */
export const CLIENT_SAFE_USER_CREATE_KEYS = [
  "email",
  "hasSeenTutorial",
  "childArchetype",
  "hasCompletedDay1Narrative",
] as const;

export type ClientSafeUserCreateKey = (typeof CLIENT_SAFE_USER_CREATE_KEYS)[number];

/** Fields allowed on client update of users/{uid} (non-economy onboarding / profile). */
export const CLIENT_SAFE_USER_UPDATE_KEYS = [
  "email",
  "hasSeenTutorial",
  "hasCompletedEmailVerifiedCelebration",
  "childArchetype",
  "childBirthDate",
  "hasCompletedDay1Narrative",
  "narrativeProgress",
  "analyticsOptOut",
  /** Multi-child switcher — childrenSummary / children docs remain server-only. */
  "activeChildId",
] as const;

export type ClientSafeUserUpdateKey = (typeof CLIENT_SAFE_USER_UPDATE_KEYS)[number];

/** Server-only fields on users/{uid} — never client-writable (Cloud Functions / Admin SDK). */
export const SERVER_ONLY_USER_FIELD_KEYS = [
  "authFunnel",
  "deletionStatus",
  "deletionRequestedAt",
  "deletionPurgeAt",
  "deletionRequestId",
  "deletionSource",
  /** Denormalized switcher list — written by createChildProfile / switchActiveChild. */
  "childrenSummary",
  /** Split-prologue completion — written only by createChildProfile when onboardingComplete. */
  "hasCompletedPrologueOnboarding",
] as const;

export type ServerOnlyUserFieldKey = (typeof SERVER_ONLY_USER_FIELD_KEYS)[number];

const ECONOMY_KEY_SET = new Set<string>(ECONOMY_USER_FIELD_KEYS);
const CLIENT_SAFE_UPDATE_KEY_SET = new Set<string>(CLIENT_SAFE_USER_UPDATE_KEYS);

export function payloadContainsEconomyField(payload: Record<string, unknown>): string | null {
  for (const key of Object.keys(payload)) {
    if (ECONOMY_KEY_SET.has(key)) {
      return key;
    }
  }
  return null;
}

export function payloadContainsDisallowedUserField(
  payload: Record<string, unknown>,
): string | null {
  const economyKey = payloadContainsEconomyField(payload);
  if (economyKey) {
    return economyKey;
  }
  for (const key of Object.keys(payload)) {
    if (!CLIENT_SAFE_UPDATE_KEY_SET.has(key)) {
      return key;
    }
  }
  return null;
}

export function assertClientSafeUserPayload(payload: Record<string, unknown>): void {
  const economyKey = payloadContainsEconomyField(payload);
  if (economyKey) {
    throw new Error(
      `Client cannot write economy field "${economyKey}" on users/{uid}. Use a Cloud Function.`,
    );
  }
}

/** Reject keys outside CLIENT_SAFE_USER_UPDATE_KEYS (defense in depth with Firestore rules). */
export function assertClientSafeUserUpdatePayload(payload: Record<string, unknown>): void {
  const disallowedKey = payloadContainsDisallowedUserField(payload);
  if (disallowedKey) {
    const inEconomy = ECONOMY_KEY_SET.has(disallowedKey);
    throw new Error(
      inEconomy
        ? `Client cannot write economy field "${disallowedKey}" on users/{uid}. Use a Cloud Function.`
        : `Client cannot write field "${disallowedKey}" on users/{uid}. Not in CLIENT_SAFE_USER_UPDATE_KEYS.`,
    );
  }
}
