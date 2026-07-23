/** Pure domain types for the Sanctuary fishing economy. Server-sync friendly. */

export type ISODateString = string;
export type EntityId = string;

// ─── Wonder ───────────────────────────────────────────────────────────────────

export type WonderSource =
  | "diary_short_reflection"
  | "diary_deep_reflection"
  | "diary_full_deep_bonus"
  | "well_question_recorded"
  | "well_question_answered"
  | "rod_reignite_reflection"
  | "garden_gift_return"
  | "practice_completion"
  | "bait_craft"
  | "fishing_miss_consolation"
  | "fishing_duplicate_consolation"
  | "fishing_catch"
  | "fishing_pool_complete_bonus"
  | "rod_craft_investment"
  | "economy_compensation";

export type WonderTransaction = {
  id: EntityId;
  userId: EntityId;
  timestamp: number;
  source: WonderSource;
  /** Positive = earn, negative = spend/invest */
  amount: number;
  metadata: Record<string, unknown>;
};

export type WonderAccount = {
  userId: EntityId;
  /** Spendable — bait crafting and claim-time fishing bonuses */
  currentWonder: number;
  /** Lifetime earned minus rod investments (stored pool) */
  storedWonder: number;
  lifetimeWonderEarned: number;
  updatedAt: number;
};

// ─── Diary / Well / Practice ──────────────────────────────────────────────────

export type DiaryReflectionDepth = "short" | "deep" | "full_deep";

export type DiaryEntry = {
  id: EntityId;
  userId: EntityId;
  lessonId?: string;
  source: "lesson" | "reignite" | "free";
  depth: DiaryReflectionDepth;
  prompts: string[];
  answers: string[];
  wonderAwarded: number;
  createdAt: number;
  updatedAt: number;
};

export type WellQuestion = {
  id: EntityId;
  userId: EntityId;
  questionText: string;
  createdAt: number;
  wonderAwarded: number;
};

export type WellAnswer = {
  questionId: EntityId;
  userId: EntityId;
  answerText: string;
  answeredAt: number;
  wonderAwarded: number;
};

export type PracticeKind =
  | "tried_validation"
  | "stayed_calm_during_conflict"
  | "used_co_regulation"
  | "followed_child_lead"
  | "practiced_curiosity";

export type PracticeCompletion = {
  id: EntityId;
  userId: EntityId;
  kind: PracticeKind;
  note?: string;
  wonderAwarded: number;
  completedAt: number;
};

// ─── Rods ───────────────────────────────────────────────────────────────────

export type FishingRodId =
  | "basic"
  | "rare_fire"
  | "rare_water"
  | "rare_wind"
  | "rare_electric"
  | "rare_wildcard"
  | "epic_fire"
  | "epic_water"
  | "epic_wind"
  | "epic_electric";

/** Maps to creatures150 RodType */
export type RodTypeKey =
  | "basic"
  | "rare1"
  | "rare2"
  | "rare3"
  | "rare4"
  | "rare5"
  | "epic1"
  | "epic2"
  | "epic3"
  | "epic4";

export type RodState = "locked" | "crafting" | "ready" | "dull" | "reigniting";

export type Rod = {
  id: FishingRodId;
  rodTypeKey: RodTypeKey;
  displayName: string;
  tier: "basic" | "rare" | "epic";
  element: "fire" | "water" | "wind" | "electric" | "any";
  state: RodState;
  storedWonderInvested: number;
  dullnessCount: number;
  peakWonderGate: number;
};

export type RodCraftJob = {
  id: EntityId;
  userId: EntityId;
  rodId: FishingRodId;
  partsRequired: number;
  storedWonderCost: number;
  startedAt: number;
  completesAt: number;
  status: "queued" | "building" | "ready_to_collect" | "cancelled";
};

export const ROD_CRAFT_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

// ─── Bait ─────────────────────────────────────────────────────────────────────

export type BaitTier = "basic" | "rare" | "epic";

export type BaitMaterial = "feather" | "scale" | "glimmerdust";

export type BaitInventory = {
  basic: number;
  rare: number;
  epic: number;
  materials: Record<BaitMaterial, number>;
};

export type BaitCraftJob = {
  id: EntityId;
  userId: EntityId;
  tier: BaitTier;
  currentWonderCost: number;
  materialsConsumed: Partial<Record<BaitMaterial, number>>;
  startedAt: number;
  status: "completed" | "failed_insufficient_funds";
};

// ─── Fishing encounters ───────────────────────────────────────────────────────

export type PoolTier = "common" | "rare" | "epic";
export type ElementType = "fire" | "water" | "wind" | "electric" | "any";

export type CatchEncounter = {
  id: EntityId;
  userId: EntityId;
  castId: EntityId;
  rodId: FishingRodId;
  baitTier: BaitTier | null;
  /** Snapshot at cast — claim uses live currentWonder */
  createdAt: number;
  readyAt: number;
  status: "waiting" | "ready" | "claimed" | "expired";
};

export type FishingClaimOutcome = "catch" | "miss" | "duplicate";

/** Epic rods that track independent top-rare dry streaks (Sheet E). */
export type EpicFishingRodId = "epic_fire" | "epic_water" | "epic_wind" | "epic_electric";

/** Flat on users/{uid} — server-written pity counters for fishing. */
export type FishingPityState = {
  consecutiveChanceMisses: number;
  epicTopRareDryStreak: Partial<Record<EpicFishingRodId, number>>;
};

export const DEFAULT_FISHING_PITY: FishingPityState = {
  consecutiveChanceMisses: 0,
  epicTopRareDryStreak: {},
};

export type FishingClaim = {
  id: EntityId;
  encounterId: EntityId;
  userId: EntityId;
  claimedAt: number;
  currentWonderAtClaim: number;
  outcome: FishingClaimOutcome;
  /** Server-selected; client never rolls */
  creatureTypeId?: string;
  creatureDisplayName?: string;
  poolTier: PoolTier;
  rarityIndicator: "common" | "uncommon" | "rare" | "epic";
  wonderAwarded: number;
  materialsAwarded: number;
  spiritMessage?: string;
  metadata: Record<string, unknown>;
};

export type CreatureCollection = {
  userId: EntityId;
  caughtCreatureIds: string[];
  poolCompletionFlags: Partial<Record<string, boolean>>;
  updatedAt: number;
};

// ─── Sanctuary resonance (Phase 4 — no Wonder deduction) ────────────────────

export type SanctuaryResonanceLevel = "vibrant" | "quiet" | "dormant";

export type SanctuaryResonance = {
  userId: EntityId;
  level: SanctuaryResonanceLevel;
  daysSinceLastReflection: number;
  gardenPaused: boolean;
  fishingSpotsQuiet: boolean;
  rodResonanceWeak: boolean;
  lastReflectionAt: number | null;
  updatedAt: number;
};
