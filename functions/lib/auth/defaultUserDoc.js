"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_USER_DOC = void 0;
exports.sanctuaryInitKey = sanctuaryInitKey;
/** Server-side default user document — mirrors client `DEFAULT_USER_DOC`. */
exports.DEFAULT_USER_DOC = {
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
};
function sanctuaryInitKey(requestId) {
  return `sanctuary_init:${requestId}`;
}
