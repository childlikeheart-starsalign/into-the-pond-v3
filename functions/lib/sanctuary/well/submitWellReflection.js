"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSubmitWellReflection = handleSubmitWellReflection;
exports.submitWellReflectionCallable = submitWellReflectionCallable;
const firestore_1 = require("firebase-admin/firestore");
const dailyCounters_1 = require("../dailyCounters");
const commitEconomyAction_1 = require("../economy/commitEconomyAction");
const economy_1 = require("../economy");
const resolveCallableIdempotency_1 = require("../economy/resolveCallableIdempotency");
const wonderRules_1 = require("../wonderRules");
const computeAgeBand_1 = require("./computeAgeBand");
const catalog_1 = require("./catalog");
const wellQuestionService_1 = require("./wellQuestionService");
const wellHelpers_1 = require("./wellHelpers");
const init_1 = require("../../init");
async function handleSubmitWellReflection(uid, payload) {
  const { questionId, reflectionText, headline, localDate } = payload;
  if (!(0, catalog_1.isValidWellQuestionId)(questionId)) {
    await (0, wellHelpers_1.recordWellAnalytics)(uid, {
      type: "well_reflection_rejected",
      error: "INVALID_QUESTION_ID",
      questionId,
    });
    return { success: false, error: "INVALID_QUESTION_ID" };
  }
  const parsedDate = (0, wellHelpers_1.parseLocalDate)(localDate);
  if (!parsedDate) {
    await (0, wellHelpers_1.recordWellAnalytics)(uid, {
      type: "well_reflection_rejected",
      error: "INVALID_LOCAL_DATE",
      questionId,
    });
    return { success: false, error: "INVALID_LOCAL_DATE" };
  }
  const trimmed = reflectionText.trim();
  if (trimmed.length < 10) {
    await (0, wellHelpers_1.recordWellAnalytics)(uid, {
      type: "well_reflection_rejected",
      error: "REFLECTION_TOO_SHORT",
      questionId,
    });
    return { success: false, error: "REFLECTION_TOO_SHORT" };
  }
  if (trimmed.length > 2000) {
    await (0, wellHelpers_1.recordWellAnalytics)(uid, {
      type: "well_reflection_rejected",
      error: "REFLECTION_TOO_LONG",
      questionId,
    });
    return { success: false, error: "REFLECTION_TOO_LONG" };
  }
  const question = catalog_1.WELL_QUESTION_BY_ID[questionId];
  const idempotencyKey = (0, economy_1.wellAnswerKey)(parsedDate);
  const txResult = await init_1.db.runTransaction(async (tx) => {
    const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
      tx,
      (0, wellHelpers_1.userRef)(uid),
      idempotencyKey,
    );
    if (idemRead.hit) {
      return {
        success: true,
        idempotent: true,
        wonderAwarded: idemRead.response.wonderAwarded,
        newInsightCount: idemRead.response.newInsightCount,
        atlasEntryId: idemRead.response.atlasEntryId,
      };
    }
    const userSnap = await tx.get((0, wellHelpers_1.userRef)(uid));
    const userData = userSnap.data() ?? {};
    (0, dailyCounters_1.applyOperationalCounterResetsInTransaction)(
      tx,
      (0, wellHelpers_1.userRef)(uid),
      userData,
    );
    const wellStateSnap = await tx.get((0, wellHelpers_1.wellStateRef)(uid));
    const wellState = (0, wellQuestionService_1.mergeWellState)(wellStateSnap.data());
    const userProfile = userData;
    let staleAgeBand = null;
    if (wellState.currentQuestionId !== questionId) {
      return { success: false, error: "QUESTION_MISMATCH" };
    }
    if ((0, wellQuestionService_1.hasAnsweredToday)(wellState, parsedDate, questionId)) {
      return { success: false, error: "ALREADY_ANSWERED_TODAY" };
    }
    if (userProfile?.childBirthDate) {
      const birthDate = (0, computeAgeBand_1.parseBirthDate)(userProfile.childBirthDate);
      if (birthDate) {
        const expectedBand = (0, computeAgeBand_1.computeAgeBand)(birthDate);
        if (question.ageBand !== expectedBand) {
          staleAgeBand = { questionId, expectedBand };
        }
      }
    }
    const wonderAwarded = (0, wonderRules_1.wonderAmountForRule)(
      wonderRules_1.WELL_QUESTION_ANSWERED,
      `${uid}:${questionId}:${parsedDate}`,
    );
    const transactionId = `tx_well_${parsedDate}_${questionId}`;
    const updatedAnsweredIds = [...wellState.answeredQuestionIds, questionId];
    const atlasRef = (0, wellHelpers_1.userRef)(uid).collection("childAtlas").doc();
    const economyCommit = await (0, commitEconomyAction_1.commitEconomyAction)({
      tx,
      userRef: (0, wellHelpers_1.userRef)(uid),
      uid,
      idempotencyKey,
      actionType: "well_reflection",
      touchReflection: true,
      idempotencyMiss: { hit: false },
      build: ({ account }) => {
        const { transaction } = (0, economy_1.applyWonderEarnInMemory)(account, {
          source: wonderRules_1.WELL_QUESTION_ANSWERED.source,
          amount: wonderAwarded,
          transactionId,
          metadata: { questionId, atlasEntryId: atlasRef.id },
        });
        const entry = (0, economy_1.buildEconomyLedgerEntry)({
          uid,
          actionType: "well_reflection",
          source: wonderRules_1.WELL_QUESTION_ANSWERED.source,
          transaction,
          idempotencyKey,
          metadata: { questionId, atlasEntryId: atlasRef.id },
        });
        return {
          entry,
          response: {
            wonderAwarded,
            newInsightCount: updatedAnsweredIds.length,
            atlasEntryId: atlasRef.id,
            analytics: {
              category: question.category,
              ageBand: question.ageBand,
              reflectionLength: trimmed.length,
              hasHeadline: Boolean(headline?.trim()),
              depthRating: question.depthRating,
              wonderAwarded,
            },
            staleAgeBand,
          },
        };
      },
    });
    const result = economyCommit.result;
    if (economyCommit.committed) {
      tx.set(atlasRef, {
        questionId,
        category: question.category,
        dateDiscovered: firestore_1.Timestamp.now(),
        reflectionText: trimmed,
        headline: headline?.trim() || null,
        prompt: question.prompt,
        themeLabel: question.themeLabel,
      });
      tx.set(
        (0, wellHelpers_1.wellStateRef)(uid),
        {
          ...wellState,
          answeredQuestionIds: updatedAnsweredIds,
          insightCount: updatedAnsweredIds.length,
        },
        { merge: true },
      );
    }
    return {
      success: true,
      idempotent: !economyCommit.committed,
      wonderAwarded: result.wonderAwarded,
      newInsightCount: result.newInsightCount,
      atlasEntryId: result.atlasEntryId,
      analytics: result.analytics,
      staleAgeBand: result.staleAgeBand,
    };
  });
  if (!txResult.success) {
    await (0, wellHelpers_1.recordWellAnalytics)(uid, {
      type: "well_reflection_rejected",
      error: txResult.error,
      questionId,
    });
    return txResult;
  }
  if (!txResult.idempotent && txResult.staleAgeBand) {
    (0, wellHelpers_1.logStaleAgeBandSubmission)(
      uid,
      txResult.staleAgeBand.questionId,
      txResult.staleAgeBand.expectedBand,
    );
  }
  if (!txResult.idempotent) {
    await (0, wellHelpers_1.recordWellAnalytics)(uid, {
      type: "well_reflection_submitted",
      ...txResult.analytics,
    });
  }
  return {
    success: true,
    wonderAwarded: txResult.wonderAwarded,
    newInsightCount: txResult.newInsightCount,
    atlasEntryId: txResult.atlasEntryId,
  };
}
function submitWellReflectionCallable(authUid, data) {
  const uid = (0, wellHelpers_1.requireUid)(authUid);
  return handleSubmitWellReflection(uid, {
    questionId: String(data.questionId ?? ""),
    reflectionText: String(data.reflectionText ?? ""),
    headline: data.headline ?? null,
    localDate: String(data.localDate ?? ""),
  });
}
