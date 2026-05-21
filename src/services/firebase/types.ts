import { Timestamp } from "firebase/firestore";

import { ChildArchetype } from "@/src/constants/narrative/types";

export type RodTier = "basic" | "wooden" | "fiberglass";
export type SubscriptionStatus = "free" | "wooden" | "fiberglass";

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

export type UserDoc = {
  email: string;
  hasSeenTutorial: boolean;
  totalWonder: number;
  completedLessons: Record<string, boolean>;
  dailyQuestionCount: number;
  lastQuestionResetDate: Timestamp | null;
  fishingWonderToday: number;
  lastFishingResetDate: Timestamp | null;
  activeRod: RodTier;
  rodDullnessCount: number;
  isRodDull: boolean;
  subscription: UserSubscription;
  activeCast: ActiveCast | null;
  inventory: UserInventory;
  /** Day 1 narrative onboarding */
  childArchetype?: ChildArchetype | null;
  hasCompletedDay1Narrative?: boolean;
  narrativeProgress?: {
    currentScene: number;
    archetype?: ChildArchetype;
    completedAt?: string;
    lastUpdated?: string;
  };
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
