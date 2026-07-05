import { WELL_QUESTIONS, WELL_QUESTION_BY_ID, QUESTIONS_BY_AGE_BAND } from "./catalog";
import { computeAgeBand, parseBirthDate } from "./computeAgeBand";
import { applyReroll, canReroll, getTodaysQuestion, mergeWellState } from "./wellQuestionService";

function expectEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function expectTrue(value: boolean, message: string) {
  if (!value) throw new Error(message);
}

export function runWellQuestionServiceSelfTest(): void {
  expectEqual(WELL_QUESTIONS.length, 204, "catalog total count");
  expectEqual(QUESTIONS_BY_AGE_BAND["4-6"].length, 104, "4-6 band count");
  expectEqual(QUESTIONS_BY_AGE_BAND["6-12"].length, 100, "6-12 band count");

  const ids = WELL_QUESTIONS.map((question) => question.questionId);
  expectEqual(new Set(ids).size, ids.length, "question IDs are unique");

  for (const question of WELL_QUESTIONS) {
    expectTrue(
      question.questionId.startsWith(`${question.category}-${question.ageBand}-`),
      `questionId prefix for ${question.questionId}`,
    );
    expectEqual(
      WELL_QUESTION_BY_ID[question.questionId]?.prompt,
      question.prompt,
      `lookup for ${question.questionId}`,
    );
  }

  const birth5 = parseBirthDate("2019-06-15");
  expectTrue(birth5 != null, "parseBirthDate valid");
  expectEqual(computeAgeBand(birth5!, new Date(2026, 5, 14)), "4-6", "age 5 → 4-6");
  expectEqual(computeAgeBand(birth5!, new Date(2026, 5, 15)), "6-12", "age 6 birthday → 6-12");

  const birth7 = parseBirthDate("2018-01-01");
  expectEqual(computeAgeBand(birth7!, new Date(2026, 0, 1)), "6-12", "age 7 → 6-12");

  expectTrue(parseBirthDate("invalid") === null, "invalid birth date rejected");

  const state = mergeWellState(undefined);
  const today = "2026-06-14";
  const first = getTodaysQuestion(state, "6-12", today, "user-1:2026-06-14");
  const second = getTodaysQuestion(
    { ...state, ...first.statePatch } as typeof state,
    "6-12",
    today,
    "user-1:2026-06-14",
  );
  expectEqual(second.question.questionId, first.question.questionId, "sticky daily question");
  expectTrue(second.statePatch === null, "no patch when question already set");

  const tomorrow = getTodaysQuestion(
    { ...state, ...first.statePatch } as typeof state,
    "6-12",
    "2026-06-15",
    "user-1:2026-06-15",
  );
  expectTrue(
    tomorrow.question.questionId !== first.question.questionId ||
      WELL_QUESTIONS.filter((q) => q.ageBand === "6-12").length === 1,
    "new day selects a question",
  );

  const askedWorries = mergeWellState({
    askedQuestionIds: ["worries-6-12-001", "worries-6-12-002", "worries-6-12-003"],
  });
  const rotated = getTodaysQuestion(askedWorries, "6-12", today, "rotate-test");
  expectTrue(rotated.question.category !== "worries", "category rotation deprioritizes recent");

  const rerollState = mergeWellState({
    currentQuestionId: first.question.questionId,
    currentQuestionDate: today,
    rerollsUsedToday: 0,
    askedQuestionIds: [first.question.questionId],
  });
  expectTrue(canReroll(rerollState, today), "reroll allowed once");
  const rerolled = applyReroll(rerollState, "6-12", today, "reroll-seed");
  expectTrue(rerolled != null, "reroll succeeds");
  expectEqual(rerolled!.nextState.rerollsUsedToday, 1, "reroll counter increments");
  expectTrue(!canReroll(rerolled!.nextState, today), "second reroll blocked");
  expectTrue(
    applyReroll(rerolled!.nextState, "6-12", today, "reroll-2") === null,
    "applyReroll null",
  );
}
