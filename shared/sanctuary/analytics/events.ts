import type { WonderSource } from "../types";
import type { AgeBand, DiscoveryCategory, WellBankQuestion } from "../well/types";

export type SanctuaryAnalyticsEvent =
  | {
      type: "wonder_earned";
      userId: string;
      source: WonderSource;
      amount: number;
      timestamp: number;
    }
  | {
      type: "practice_completed";
      userId: string;
      kind: string;
      wonderAwarded: number;
      timestamp: number;
    }
  | {
      type: "fishing_claim";
      userId: string;
      outcome: string;
      duplicate?: boolean;
      rarityIndicator?: string;
      timestamp: number;
    }
  | {
      type: "reflection_session";
      userId: string;
      channel: "diary" | "well" | "practice" | "reignite";
      timestamp: number;
    }
  | {
      type: "well_state_initialized";
      userId: string;
      channel: "well";
      timestamp: number;
    }
  | {
      type: "well_question_assigned";
      userId: string;
      channel: "well";
      timestamp: number;
      questionId: string;
      category: DiscoveryCategory;
      ageBand: AgeBand;
      isRepeat: boolean;
    }
  | {
      type: "well_question_rerolled";
      userId: string;
      channel: "well";
      timestamp: number;
      fromQuestionId: string;
      toQuestionId: string;
      fromCategory: string;
      toCategory: DiscoveryCategory;
    }
  | {
      type: "well_reflection_submitted";
      userId: string;
      channel: "well";
      timestamp: number;
      category: DiscoveryCategory;
      ageBand: AgeBand;
      reflectionLength: number;
      hasHeadline: boolean;
      depthRating: number;
      wonderAwarded: number;
    }
  | {
      type: "well_reflection_rejected";
      userId: string;
      channel: "well";
      timestamp: number;
      error: string;
      questionId: string;
    }
  | {
      type: "well_stale_age_band_submission";
      userId: string;
      channel: "well";
      timestamp: number;
      questionId: string;
      expectedBand: AgeBand;
      actualBand?: AgeBand;
    };

export type ReflectionVsFarmingMetrics = {
  wonderFromReflection: number;
  wonderFromFishing: number;
  practiceCompletions: number;
  fishingClaims: number;
  reflectionRatio: number;
};

export function accumulateMetrics(events: SanctuaryAnalyticsEvent[]): ReflectionVsFarmingMetrics {
  let wonderFromReflection = 0;
  let wonderFromFishing = 0;
  let practiceCompletions = 0;
  let fishingClaims = 0;

  for (const event of events) {
    if (event.type === "wonder_earned") {
      if (event.source.startsWith("fishing_") || event.source === "bait_craft") {
        wonderFromFishing += event.amount;
      } else {
        wonderFromReflection += event.amount;
      }
    }
    if (event.type === "practice_completed") practiceCompletions += 1;
    if (event.type === "fishing_claim") fishingClaims += 1;
  }

  const total = wonderFromReflection + wonderFromFishing;
  return {
    wonderFromReflection,
    wonderFromFishing,
    practiceCompletions,
    fishingClaims,
    reflectionRatio: total > 0 ? wonderFromReflection / total : 1,
  };
}

export function trackWonderEarned(
  userId: string,
  source: WonderSource,
  amount: number,
): SanctuaryAnalyticsEvent {
  return { type: "wonder_earned", userId, source, amount, timestamp: Date.now() };
}
