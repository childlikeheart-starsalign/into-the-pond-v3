export type EntityId = string;

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

export type BaitTier = "basic" | "rare" | "epic";
export type PoolTier = "common" | "rare" | "epic";
export type ElementType = "fire" | "water" | "wind" | "electric" | "any";
export type FishingClaimOutcome = "catch" | "miss" | "duplicate";

export type EpicFishingRodId = "epic_fire" | "epic_water" | "epic_wind" | "epic_electric";

export type FishingPityState = {
  consecutiveChanceMisses: number;
  epicTopRareDryStreak: Partial<Record<EpicFishingRodId, number>>;
};

export const DEFAULT_FISHING_PITY: FishingPityState = {
  consecutiveChanceMisses: 0,
  epicTopRareDryStreak: {},
};

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

export type WonderAccount = {
  userId: string;
  currentWonder: number;
  storedWonder: number;
  lifetimeWonderEarned: number;
  updatedAt: number;
};

export type WonderTransaction = {
  id: string;
  userId: string;
  timestamp: number;
  source: WonderSource;
  amount: number;
  metadata: Record<string, unknown>;
};

export type FishingClaim = {
  id: string;
  encounterId: string;
  userId: string;
  claimedAt: number;
  currentWonderAtClaim: number;
  outcome: FishingClaimOutcome;
  creatureTypeId?: string;
  creatureDisplayName?: string;
  poolTier: PoolTier;
  rarityIndicator: "common" | "uncommon" | "rare" | "epic";
  wonderAwarded: number;
  materialsAwarded: number;
  spiritMessage?: string;
  metadata: Record<string, unknown>;
};

export type DiaryReflectionDepth = "short" | "deep" | "full_deep";

export type PracticeKind =
  | "tried_validation"
  | "stayed_calm_during_conflict"
  | "used_co_regulation"
  | "followed_child_lead"
  | "practiced_curiosity";
