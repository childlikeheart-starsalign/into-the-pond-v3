"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRerollWellQuestion = handleRerollWellQuestion;
exports.rerollWellQuestionCallable = rerollWellQuestionCallable;
const computeAgeBand_1 = require("./computeAgeBand");
const wellQuestionService_1 = require("./wellQuestionService");
const wellHelpers_1 = require("./wellHelpers");
const init_1 = require("../../init");
const economy_1 = require("../economy");
const resolveCallableIdempotency_1 = require("../economy/resolveCallableIdempotency");
async function handleRerollWellQuestion(uid, localDate, requestId, childId) {
  const parsedDate = (0, wellHelpers_1.parseLocalDate)(localDate);
  if (!parsedDate) {
    return { success: false, error: "INVALID_LOCAL_DATE" };
  }
  const idempotencyKey = (0, economy_1.wellRerollKey)(parsedDate, requestId);
  const txResult = await init_1.db.runTransaction(async (tx) => {
    const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
      tx,
      (0, wellHelpers_1.userRef)(uid),
      idempotencyKey,
    );
    if (idemRead.hit) {
      return {
        success: true,
        question: idemRead.response.question,
        fromQuestionId: null,
        committed: false,
      };
    }
    await tx.get((0, wellHelpers_1.userRef)(uid));
    const wellStateSnap = await tx.get((0, wellHelpers_1.wellStateRef)(uid, childId));
    const wellState = (0, wellQuestionService_1.mergeWellState)(wellStateSnap.data());
    if (!wellState.currentQuestionId || wellState.currentQuestionDate !== parsedDate) {
      return { success: false, error: "NO_ACTIVE_QUESTION" };
    }
    const birthRaw = await (0, wellHelpers_1.resolveBirthDateForWell)(tx, uid, childId);
    const birthDate = birthRaw ? (0, computeAgeBand_1.parseBirthDate)(birthRaw) : null;
    if (!birthDate) {
      return { success: false, error: "MISSING_AGE_BAND" };
    }
    const fromQuestionId = wellState.currentQuestionId;
    const ageBand = (0, computeAgeBand_1.computeAgeBand)(birthDate);
    const seed = `${uid}:${parsedDate}:reroll:${wellState.rerollsUsedToday}`;
    const result = (0, wellQuestionService_1.applyReroll)(wellState, ageBand, parsedDate, seed);
    if (!result) {
      return { success: false, error: "REROLL_LIMIT_REACHED" };
    }
    tx.set((0, wellHelpers_1.wellStateRef)(uid, childId), result.nextState, { merge: true });
    const response = { success: true, question: result.question };
    (0, resolveCallableIdempotency_1.writeIdempotencyInTransaction)(
      tx,
      (0, wellHelpers_1.userRef)(uid),
      idempotencyKey,
      "well_reroll",
      response,
    );
    return {
      ...response,
      fromQuestionId,
      committed: true,
    };
  });
  if (!txResult.success) {
    return txResult;
  }
  if (txResult.committed && txResult.fromQuestionId) {
    const fromQuestion = txResult.fromQuestionId;
    await (0, wellHelpers_1.recordWellAnalytics)(uid, {
      type: "well_question_rerolled",
      fromQuestionId: fromQuestion,
      toQuestionId: txResult.question.questionId,
      fromCategory: fromQuestion.split("-")[0],
      toCategory: txResult.question.category,
    });
  }
  return { success: true, question: txResult.question };
}
function rerollWellQuestionCallable(authUid, data) {
  const uid = (0, wellHelpers_1.requireUid)(authUid);
  const rawRequestId = data.requestId;
  const requestId =
    typeof rawRequestId === "string" && rawRequestId.trim() !== "" ? rawRequestId.trim() : "";
  return handleRerollWellQuestion(
    uid,
    String(data.localDate ?? ""),
    requestId,
    (0, wellHelpers_1.parseOptionalChildId)(data.childId),
  );
}
