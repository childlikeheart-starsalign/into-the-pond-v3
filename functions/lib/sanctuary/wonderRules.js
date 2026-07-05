"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAILY_FISHING_WONDER_CAP =
  exports.PRACTICE_WONDER_BY_KIND =
  exports.GARDEN_GIFT_RETURN =
  exports.ROD_REIGNITE_REFLECTION =
  exports.WELL_QUESTION_ANSWERED =
  exports.WELL_QUESTION_RECORDED =
  exports.DIARY_WONDER_BY_DEPTH =
    void 0;
exports.wonderAmountForRule = wonderAmountForRule;
exports.inferDiaryDepth = inferDiaryDepth;
/** Diary: short / deep / full deep bonus */
exports.DIARY_WONDER_BY_DEPTH = {
  short: { source: "diary_short_reflection", min: 2, max: 3 },
  deep: { source: "diary_deep_reflection", min: 4, max: 5 },
  full_deep: { source: "diary_full_deep_bonus", min: 7, max: 8 },
};
exports.WELL_QUESTION_RECORDED = {
  source: "well_question_recorded",
  min: 1,
  max: 2,
};
exports.WELL_QUESTION_ANSWERED = {
  source: "well_question_answered",
  min: 12,
  max: 12,
};
exports.ROD_REIGNITE_REFLECTION = {
  source: "rod_reignite_reflection",
  min: 2,
  max: 2,
};
exports.GARDEN_GIFT_RETURN = {
  source: "garden_gift_return",
  min: 3,
  max: 3,
};
/** Highest-value intentional parenting practice loop */
exports.PRACTICE_WONDER_BY_KIND = {
  tried_validation: { source: "practice_completion", min: 5, max: 6 },
  stayed_calm_during_conflict: { source: "practice_completion", min: 6, max: 8 },
  used_co_regulation: { source: "practice_completion", min: 6, max: 8 },
  followed_child_lead: { source: "practice_completion", min: 5, max: 7 },
  practiced_curiosity: { source: "practice_completion", min: 5, max: 10 },
};
/** Max Wonder earnable from fishing claims per UTC day (operational cap). */
exports.DAILY_FISHING_WONDER_CAP = 10;
function wonderAmountForRule(rule, seed) {
  if (rule.min === rule.max) return rule.min;
  const span = rule.max - rule.min + 1;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h + seed.charCodeAt(i) * (i + 1)) % span;
  return rule.min + h;
}
function inferDiaryDepth(answers, source) {
  if (source === "reignite") return "short";
  const nonEmpty = answers.filter((a) => a.trim().length > 0);
  const totalChars = nonEmpty.join("").length;
  if (nonEmpty.length >= 3 && totalChars >= 200) return "full_deep";
  if (nonEmpty.length >= 2 && totalChars >= 80) return "deep";
  return "short";
}
