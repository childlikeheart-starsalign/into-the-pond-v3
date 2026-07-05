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
] as const;

export type ClientSafeUserUpdateKey = (typeof CLIENT_SAFE_USER_UPDATE_KEYS)[number];

const ECONOMY_KEY_SET = new Set<string>(ECONOMY_USER_FIELD_KEYS);

export function payloadContainsEconomyField(payload: Record<string, unknown>): string | null {
  for (const key of Object.keys(payload)) {
    if (ECONOMY_KEY_SET.has(key)) {
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
