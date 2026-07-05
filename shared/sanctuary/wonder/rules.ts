import type { DiaryReflectionDepth, PracticeKind, WonderSource } from "../types";

export type WonderRewardRule = {
  source: WonderSource;
  min: number;
  max: number;
};

/** Diary: short / deep / full deep bonus */
export const DIARY_WONDER_BY_DEPTH: Record<DiaryReflectionDepth, WonderRewardRule> = {
  short: { source: "diary_short_reflection", min: 2, max: 3 },
  deep: { source: "diary_deep_reflection", min: 4, max: 5 },
  full_deep: { source: "diary_full_deep_bonus", min: 7, max: 8 },
};

export const WELL_QUESTION_RECORDED: WonderRewardRule = {
  source: "well_question_recorded",
  min: 1,
  max: 2,
};

export const WELL_QUESTION_ANSWERED: WonderRewardRule = {
  source: "well_question_answered",
  min: 12,
  max: 12,
};

export const ROD_REIGNITE_REFLECTION: WonderRewardRule = {
  source: "rod_reignite_reflection",
  min: 2,
  max: 2,
};

export const GARDEN_GIFT_RETURN: WonderRewardRule = {
  source: "garden_gift_return",
  min: 3,
  max: 3,
};

/** Highest-value intentional parenting practice loop */
export const PRACTICE_WONDER_BY_KIND: Record<PracticeKind, WonderRewardRule> = {
  tried_validation: { source: "practice_completion", min: 5, max: 6 },
  stayed_calm_during_conflict: { source: "practice_completion", min: 6, max: 8 },
  used_co_regulation: { source: "practice_completion", min: 6, max: 8 },
  followed_child_lead: { source: "practice_completion", min: 5, max: 7 },
  practiced_curiosity: { source: "practice_completion", min: 5, max: 10 },
};

/** Max Wonder earnable from fishing claims per UTC day (operational cap). */
export const DAILY_FISHING_WONDER_CAP = 10;

export function wonderAmountForRule(rule: WonderRewardRule, seed: string): number {
  if (rule.min === rule.max) return rule.min;
  const span = rule.max - rule.min + 1;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h + seed.charCodeAt(i) * (i + 1)) % span;
  return rule.min + h;
}

export function inferDiaryDepth(
  answers: string[],
  source: "lesson" | "reignite" | "free",
): DiaryReflectionDepth {
  if (source === "reignite") return "short";
  const nonEmpty = answers.filter((a) => a.trim().length > 0);
  const totalChars = nonEmpty.join("").length;
  if (nonEmpty.length >= 3 && totalChars >= 200) return "full_deep";
  if (nonEmpty.length >= 2 && totalChars >= 80) return "deep";
  return "short";
}
