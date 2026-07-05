"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RECENT_REPEAT_AVOIDANCE =
  exports.RECENT_CATEGORY_WINDOW =
  exports.MAX_REROLLS_PER_DAY =
  exports.DEFAULT_USER_WELL_STATE =
    void 0;
exports.DEFAULT_USER_WELL_STATE = {
  askedQuestionIds: [],
  answeredQuestionIds: [],
  currentQuestionId: null,
  currentQuestionDate: "",
  rerollsUsedToday: 0,
  insightCount: 0,
};
exports.MAX_REROLLS_PER_DAY = 1;
exports.RECENT_CATEGORY_WINDOW = 3;
exports.RECENT_REPEAT_AVOIDANCE = 10;
