export type DiscoveryCategory =
  | "curiosity"
  | "worries"
  | "excitement"
  | "interests"
  | "emotional"
  | "social"
  | "identity"
  | "imagination";

export type AgeBand = "4-6" | "6-12";

export type WellBankQuestion = {
  questionId: string;
  category: DiscoveryCategory;
  ageBand: AgeBand;
  themeLabel: string;
  prompt: string;
  depthRating: 1 | 2 | 3 | 4 | 5;
  whyThisMatters: string;
};

/** Stored at users/{uid}/wellState/current */
export type UserWellState = {
  askedQuestionIds: string[];
  answeredQuestionIds: string[];
  currentQuestionId: string | null;
  currentQuestionDate: string;
  rerollsUsedToday: number;
  insightCount: number;
};

export const DEFAULT_USER_WELL_STATE: UserWellState = {
  askedQuestionIds: [],
  answeredQuestionIds: [],
  currentQuestionId: null,
  currentQuestionDate: "",
  rerollsUsedToday: 0,
  insightCount: 0,
};

export const MAX_REROLLS_PER_DAY = 1;
export const RECENT_CATEGORY_WINDOW = 3;
export const RECENT_REPEAT_AVOIDANCE = 10;
