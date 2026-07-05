/** Server-side default user document — mirrors client `DEFAULT_USER_DOC`. */
export const DEFAULT_USER_DOC = {
  email: "",
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
  equippedRodId: undefined,
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
    baitMaterials: {
      feather: 0,
      scale: 0,
      glimmerdust: 0,
    },
  },
  childArchetype: null,
  hasCompletedDay1Narrative: false,
  narrativeProgress: undefined,
  hasCompletedEmailVerifiedCelebration: false,
  deletionStatus: "active",
  deletionRequestedAt: null,
  deletionPurgeAt: null,
  deletionRequestId: null,
  deletionSource: null,
} as const;

export type InitializeSanctuaryResponse = {
  status: "success" | "already_initialized";
  sanctuaryInitialized: true;
};

export function sanctuaryInitKey(requestId: string): string {
  return `sanctuary_init:${requestId}`;
}
