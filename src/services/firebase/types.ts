import { Timestamp } from "firebase/firestore";

import { ChildArchetype } from "@/src/constants/narrative/types";
import type { DiscoveryCategory, WellBankQuestion } from "@/shared/sanctuary/well/types";
import type { FishingRodId } from "@/shared/sanctuary/types";
import type { PlayerRodGiftSource, PlayerRodState } from "@/shared/sanctuary/progression";

export type RodTier = "basic" | "wooden" | "fiberglass";
export type SubscriptionStatus = "free" | "wooden" | "fiberglass";
export type DeletionStatus = "active" | "pending" | "purging" | "purged";
export type DeletionSource = "in_app" | "web_email";

export type UserSubscription = {
  productId: string | null;
  expiryDate: Timestamp | null;
  isLifetime: boolean;
  subscriptionStatus: SubscriptionStatus;
  lastVerifiedAt: Timestamp | null;
  source: "revenuecat" | "unknown";
};

export type ActiveCast = {
  castId: string;
  readyTimestamp: Timestamp;
  rodType: RodTier;
  baitUsed: string;
  expectedRarity: "basic" | "rare" | "legendary";
};

export type UserInventory = {
  parts: number;
  baits: {
    feather_bait: number;
    scale_bait: number;
    glimmerdust_bait: number;
    random_bait: number;
  };
  baitMaterials: {
    feather: number;
    scale: number;
    glimmerdust: number;
  };
};

export type AuthFunnelDoc = {
  createdAt?: Timestamp;
  provider?: string;
  emailVerified?: boolean;
  verifyAbandonedEventSent?: boolean;
  sanctuaryInitialized?: boolean;
  verifiedAt?: Timestamp;
  initializedAt?: Timestamp;
};

export type UserDoc = {
  email: string;
  hasSeenTutorial: boolean;
  totalWonder: number;
  /** Spendable — bait, claim-time fishing bonuses */
  currentWonder?: number;
  /** Lifetime earned minus rod investments */
  storedWonder?: number;
  lifetimeWonderEarned?: number;
  lastReflectionAt?: Timestamp | null;
  completedLessons: Record<string, boolean>;
  dailyQuestionCount: number;
  lastQuestionResetDate: Timestamp | null;
  fishingWonderToday: number;
  lastFishingResetDate: Timestamp | null;
  activeRod: RodTier;
  /** Domain rod selected for fishing / collection (v2 progression). */
  equippedRodId?: FishingRodId;
  rodDullnessCount: number;
  isRodDull: boolean;
  subscription: UserSubscription;
  activeCast: ActiveCast | null;
  inventory: UserInventory;
  /** Day 1 narrative onboarding */
  childArchetype?: ChildArchetype | null;
  /** ISO date "YYYY-MM-DD" — used to compute Well question age band */
  childBirthDate?: string;
  hasCompletedDay1Narrative?: boolean;
  /** Set when user taps Enter on the email-verified celebration screen. */
  hasCompletedEmailVerifiedCelebration?: boolean;
  narrativeProgress?: {
    currentScene: number;
    archetype?: ChildArchetype;
    completedAt?: string;
    lastUpdated?: string;
  };
  /** When true, skip client and server PostHog events for this user. */
  analyticsOptOut?: boolean;
  /** Server-written auth funnel marker — not client-writable. */
  authFunnel?: AuthFunnelDoc;
  /** Account deletion lifecycle — server-written only. */
  deletionStatus?: DeletionStatus;
  deletionRequestedAt?: Timestamp | null;
  deletionPurgeAt?: Timestamp | null;
  deletionRequestId?: string | null;
  deletionSource?: DeletionSource | null;
};

export type DiaryEntryDoc = {
  entryId: string;
  userId: string;
  lessonId?: string;
  source: "lesson" | "reignite";
  prompts: string[];
  answers: string[];
  status: "draft" | "completed";
  wonderAwarded: number;
  plantStage: 0 | 1 | 2 | 3 | 4;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type WellQuestionDoc = {
  questionText: string;
  answerText?: string;
  createdAt: Timestamp;
  answeredAt?: Timestamp;
};

export type WellStateDocument = {
  askedQuestionIds: string[];
  answeredQuestionIds: string[];
  currentQuestionId: string | null;
  currentQuestionDate: string;
  rerollsUsedToday: number;
  insightCount: number;
};

export type ChildAtlasEntryDoc = {
  questionId: string;
  category: DiscoveryCategory;
  dateDiscovered: Timestamp;
  reflectionText: string;
  headline: string | null;
  prompt: string;
  themeLabel: string;
};

/** `users/{uid}/playerRods/{domainRodId}` — server-written via callables only. */
export type PlayerRodDoc = {
  state: PlayerRodState;
  craftStartedAt: Timestamp | null;
  craftCompletedAt: Timestamp | null;
  wonderInvested: number;
  partsSpentOnCraft: number;
  sourceModule: 1 | 2 | 3 | 4 | 5 | null;
  giftSource?: PlayerRodGiftSource | null;
};

/** `users/{uid}/lessonProgress/{lessonId}` */
export type LessonProgressDoc = {
  lessonId: string;
  completed: boolean;
  completedAt: Timestamp | null;
  lastOpenedAt: Timestamp | null;
};

export type SubmitWellReflectionError =
  | "ALREADY_ANSWERED_TODAY"
  | "QUESTION_MISMATCH"
  | "INVALID_QUESTION_ID"
  | "REFLECTION_TOO_SHORT"
  | "REFLECTION_TOO_LONG"
  | "INVALID_LOCAL_DATE";

export type SubmitWellReflectionResponse =
  | {
      success: true;
      wonderAwarded: number;
      newInsightCount: number;
      atlasEntryId: string;
      previewOnly?: true;
    }
  | { success: false; error: SubmitWellReflectionError };

export type GetOrAssignTodaysQuestionResponse =
  | {
      success: true;
      question: WellBankQuestion;
      hasAnsweredToday: boolean;
      canReroll: boolean;
    }
  | { success: false; error: "MISSING_BIRTH_DATE" | "INVALID_LOCAL_DATE" };

export type RerollWellQuestionResponse =
  | { success: true; question: WellBankQuestion }
  | {
      success: false;
      error:
        | "REROLL_LIMIT_REACHED"
        | "NO_ACTIVE_QUESTION"
        | "MISSING_AGE_BAND"
        | "INVALID_LOCAL_DATE";
    };

export type CreatureDoc = {
  creatureId: string;
  name: string;
  rarity: "basic" | "rare" | "legendary";
  caughtAt: Timestamp;
};

export type LessonDoc = {
  lessonId: string;
  order: number;
  module: number;
  title: string;
  content: string;
  videoUrl: string;
  commitmentMessage: string;
  diaryPrompts: [string, string, string];
  isPlaceholder?: boolean;
};

/** Client-safe fields for initial `users/{uid}` create — no economy/progression writes. */
export {
  CLIENT_SAFE_USER_CREATE_KEYS,
  CLIENT_SAFE_USER_UPDATE_KEYS,
  type ClientSafeUserCreateKey,
  type ClientSafeUserUpdateKey,
} from "@/shared/firestore/economyFieldRegistry";

export const CLIENT_SAFE_USER_CREATE: Pick<
  UserDoc,
  "email" | "hasSeenTutorial" | "childArchetype" | "hasCompletedDay1Narrative"
> = {
  email: "",
  hasSeenTutorial: false,
  childArchetype: null,
  hasCompletedDay1Narrative: false,
};

/** Patch shape for client updates to users/{uid} — economy fields forbidden. */
export type ClientSafeUserPatch = Partial<
  Pick<
    UserDoc,
    | "email"
    | "hasSeenTutorial"
    | "hasCompletedEmailVerifiedCelebration"
    | "childArchetype"
    | "childBirthDate"
    | "hasCompletedDay1Narrative"
    | "narrativeProgress"
  >
>;

export const DEFAULT_USER_DOC: UserDoc = {
  email: "",
  hasSeenTutorial: false,
  totalWonder: 0,
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
    baitMaterials: {
      feather: 0,
      scale: 0,
      glimmerdust: 0,
    },
  },
  childArchetype: null,
  hasCompletedDay1Narrative: false,
  narrativeProgress: undefined,
};
