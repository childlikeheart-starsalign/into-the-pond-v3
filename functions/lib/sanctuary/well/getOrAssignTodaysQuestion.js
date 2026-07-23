"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetOrAssignTodaysQuestion = handleGetOrAssignTodaysQuestion;
exports.getOrAssignTodaysQuestionCallable = getOrAssignTodaysQuestionCallable;
const computeAgeBand_1 = require("./computeAgeBand");
const wellQuestionService_1 = require("./wellQuestionService");
const wellHelpers_1 = require("./wellHelpers");
const init_1 = require("../../init");
const dailyCounters_1 = require("../dailyCounters");
const economy_1 = require("../economy");
const resolveCallableIdempotency_1 = require("../economy/resolveCallableIdempotency");
async function handleGetOrAssignTodaysQuestion(uid, localDate, childId) {
  const parsedDate = (0, wellHelpers_1.parseLocalDate)(localDate);
  if (!parsedDate) {
    return { success: false, error: "INVALID_LOCAL_DATE" };
  }
  const idempotencyKey = (0, economy_1.wellAssignKey)(parsedDate);
  const txResult = await init_1.db.runTransaction(async (tx) => {
    const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
      tx,
      (0, wellHelpers_1.userRef)(uid),
      idempotencyKey,
    );
    if (idemRead.hit) {
      return { ...idemRead.response, analytics: null };
    }
    const userSnap = await tx.get((0, wellHelpers_1.userRef)(uid));
    const userData = userSnap.data() ?? {};
    (0, dailyCounters_1.applyOperationalCounterResetsInTransaction)(
      tx,
      (0, wellHelpers_1.userRef)(uid),
      userData,
    );
    const wellStateSnap = await tx.get((0, wellHelpers_1.wellStateRef)(uid, childId));
    const birthRaw = await (0, wellHelpers_1.resolveBirthDateForWell)(tx, uid, childId);
    const birthDate = birthRaw ? (0, computeAgeBand_1.parseBirthDate)(birthRaw) : null;
    if (!birthDate) {
      return { success: false, error: "MISSING_BIRTH_DATE" };
    }
    const ageBand = (0, computeAgeBand_1.computeAgeBand)(birthDate);
    const wellState = (0, wellQuestionService_1.mergeWellState)(wellStateSnap.data());
    const seed = `${uid}:${parsedDate}`;
    const { question, statePatch } = (0, wellQuestionService_1.getTodaysQuestion)(
      wellState,
      ageBand,
      parsedDate,
      seed,
    );
    const finalState = statePatch ? { ...wellState, ...statePatch } : wellState;
    if (statePatch) {
      tx.set((0, wellHelpers_1.wellStateRef)(uid, childId), finalState, { merge: true });
    }
    const response = {
      success: true,
      question,
      hasAnsweredToday: (0, wellQuestionService_1.hasAnsweredToday)(
        finalState,
        parsedDate,
        question.questionId,
      ),
      canReroll: (0, wellQuestionService_1.canReroll)(finalState, parsedDate),
    };
    if (statePatch) {
      (0, resolveCallableIdempotency_1.writeIdempotencyInTransaction)(
        tx,
        (0, wellHelpers_1.userRef)(uid),
        idempotencyKey,
        "well_assign",
        response,
      );
    }
    return {
      ...response,
      analytics:
        statePatch != null
          ? {
              questionId: question.questionId,
              category: question.category,
              ageBand: question.ageBand,
              isRepeat: wellState.askedQuestionIds.includes(question.questionId),
            }
          : null,
    };
  });
  if (!txResult.success) {
    return txResult;
  }
  if (txResult.analytics) {
    await (0, wellHelpers_1.recordWellAnalytics)(uid, {
      type: "well_question_assigned",
      ...txResult.analytics,
    });
  }
  return {
    success: true,
    question: txResult.question,
    hasAnsweredToday: txResult.hasAnsweredToday,
    canReroll: txResult.canReroll,
  };
}
function getOrAssignTodaysQuestionCallable(authUid, data) {
  const uid = (0, wellHelpers_1.requireUid)(authUid);
  return handleGetOrAssignTodaysQuestion(
    uid,
    String(data.localDate ?? ""),
    (0, wellHelpers_1.parseOptionalChildId)(data.childId),
  );
}
