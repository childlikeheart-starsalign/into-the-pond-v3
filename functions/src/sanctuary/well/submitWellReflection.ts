import { Timestamp } from "firebase-admin/firestore";

import { applyOperationalCounterResetsInTransaction } from "../dailyCounters";
import { commitEconomyAction } from "../economy/commitEconomyAction";
import { applyWonderEarnInMemory, buildEconomyLedgerEntry, wellAnswerKey } from "../economy";
import { readIdempotencyInTransaction } from "../economy/resolveCallableIdempotency";
import { WELL_QUESTION_ANSWERED, wonderAmountForRule } from "../wonderRules";
import { computeAgeBand, parseBirthDate } from "./computeAgeBand";
import { isValidWellQuestionId, WELL_QUESTION_BY_ID } from "./catalog";
import { hasAnsweredToday, mergeWellState } from "./wellQuestionService";
import type { DiscoveryCategory } from "./types";
import {
  logStaleAgeBandSubmission,
  parseLocalDate,
  recordWellAnalytics,
  requireUid,
  userRef,
  wellStateRef,
} from "./wellHelpers";
import { db } from "../../init";

export type SubmitWellReflectionRequest = {
  questionId: string;
  reflectionText: string;
  headline?: string | null;
  localDate: string;
};

export type SubmitWellReflectionError =
  | "ALREADY_ANSWERED_TODAY"
  | "QUESTION_MISMATCH"
  | "INVALID_QUESTION_ID"
  | "REFLECTION_TOO_SHORT"
  | "REFLECTION_TOO_LONG"
  | "INVALID_LOCAL_DATE";

export type SubmitWellReflectionResponse =
  | { success: true; wonderAwarded: number; newInsightCount: number; atlasEntryId: string }
  | { success: false; error: SubmitWellReflectionError };

type WellReflectionSuccessPayload = {
  wonderAwarded: number;
  newInsightCount: number;
  atlasEntryId: string;
  analytics: {
    category: DiscoveryCategory;
    ageBand: string;
    reflectionLength: number;
    hasHeadline: boolean;
    depthRating: number;
    wonderAwarded: number;
  };
  staleAgeBand: { questionId: string; expectedBand: ReturnType<typeof computeAgeBand> } | null;
};

export async function handleSubmitWellReflection(
  uid: string,
  payload: SubmitWellReflectionRequest,
): Promise<SubmitWellReflectionResponse> {
  const { questionId, reflectionText, headline, localDate } = payload;

  if (!isValidWellQuestionId(questionId)) {
    await recordWellAnalytics(uid, {
      type: "well_reflection_rejected",
      error: "INVALID_QUESTION_ID",
      questionId,
    });
    return { success: false, error: "INVALID_QUESTION_ID" };
  }

  const parsedDate = parseLocalDate(localDate);
  if (!parsedDate) {
    await recordWellAnalytics(uid, {
      type: "well_reflection_rejected",
      error: "INVALID_LOCAL_DATE",
      questionId,
    });
    return { success: false, error: "INVALID_LOCAL_DATE" };
  }

  const trimmed = reflectionText.trim();
  if (trimmed.length < 10) {
    await recordWellAnalytics(uid, {
      type: "well_reflection_rejected",
      error: "REFLECTION_TOO_SHORT",
      questionId,
    });
    return { success: false, error: "REFLECTION_TOO_SHORT" };
  }
  if (trimmed.length > 2000) {
    await recordWellAnalytics(uid, {
      type: "well_reflection_rejected",
      error: "REFLECTION_TOO_LONG",
      questionId,
    });
    return { success: false, error: "REFLECTION_TOO_LONG" };
  }

  const question = WELL_QUESTION_BY_ID[questionId];
  const idempotencyKey = wellAnswerKey(parsedDate);

  const txResult = await db.runTransaction(async (tx) => {
    const idemRead = await readIdempotencyInTransaction<WellReflectionSuccessPayload>(
      tx,
      userRef(uid),
      idempotencyKey,
    );

    if (idemRead.hit) {
      return {
        success: true as const,
        idempotent: true as const,
        wonderAwarded: idemRead.response.wonderAwarded,
        newInsightCount: idemRead.response.newInsightCount,
        atlasEntryId: idemRead.response.atlasEntryId,
      };
    }

    const userSnap = await tx.get(userRef(uid));
    const userData = (userSnap.data() ?? {}) as Record<string, unknown>;
    applyOperationalCounterResetsInTransaction(tx, userRef(uid), userData);
    const wellStateSnap = await tx.get(wellStateRef(uid));
    const wellState = mergeWellState(wellStateSnap.data());
    const userProfile = userData as { childBirthDate?: string } | undefined;
    let staleAgeBand: {
      questionId: string;
      expectedBand: ReturnType<typeof computeAgeBand>;
    } | null = null;

    if (wellState.currentQuestionId !== questionId) {
      return { success: false as const, error: "QUESTION_MISMATCH" as const };
    }

    if (hasAnsweredToday(wellState, parsedDate, questionId)) {
      return { success: false as const, error: "ALREADY_ANSWERED_TODAY" as const };
    }

    if (userProfile?.childBirthDate) {
      const birthDate = parseBirthDate(userProfile.childBirthDate);
      if (birthDate) {
        const expectedBand = computeAgeBand(birthDate);
        if (question.ageBand !== expectedBand) {
          staleAgeBand = { questionId, expectedBand };
        }
      }
    }

    const wonderAwarded = wonderAmountForRule(
      WELL_QUESTION_ANSWERED,
      `${uid}:${questionId}:${parsedDate}`,
    );
    const transactionId = `tx_well_${parsedDate}_${questionId}`;
    const updatedAnsweredIds = [...wellState.answeredQuestionIds, questionId];
    const atlasRef = userRef(uid).collection("childAtlas").doc();

    const economyCommit = await commitEconomyAction<WellReflectionSuccessPayload>({
      tx,
      userRef: userRef(uid),
      uid,
      idempotencyKey,
      actionType: "well_reflection",
      touchReflection: true,
      idempotencyMiss: { hit: false },
      build: ({ account }) => {
        const { transaction } = applyWonderEarnInMemory(account, {
          source: WELL_QUESTION_ANSWERED.source,
          amount: wonderAwarded,
          transactionId,
          metadata: { questionId, atlasEntryId: atlasRef.id },
        });

        const entry = buildEconomyLedgerEntry({
          uid,
          actionType: "well_reflection",
          source: WELL_QUESTION_ANSWERED.source,
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
        category: question.category as DiscoveryCategory,
        dateDiscovered: Timestamp.now(),
        reflectionText: trimmed,
        headline: headline?.trim() || null,
        prompt: question.prompt,
        themeLabel: question.themeLabel,
      });

      tx.set(
        wellStateRef(uid),
        {
          ...wellState,
          answeredQuestionIds: updatedAnsweredIds,
          insightCount: updatedAnsweredIds.length,
        },
        { merge: true },
      );
    }

    return {
      success: true as const,
      idempotent: !economyCommit.committed,
      wonderAwarded: result.wonderAwarded,
      newInsightCount: result.newInsightCount,
      atlasEntryId: result.atlasEntryId,
      analytics: result.analytics,
      staleAgeBand: result.staleAgeBand,
    };
  });

  if (!txResult.success) {
    await recordWellAnalytics(uid, {
      type: "well_reflection_rejected",
      error: txResult.error,
      questionId,
    });
    return txResult;
  }

  if (!txResult.idempotent && txResult.staleAgeBand) {
    logStaleAgeBandSubmission(
      uid,
      txResult.staleAgeBand.questionId,
      txResult.staleAgeBand.expectedBand,
    );
  }

  if (!txResult.idempotent) {
    await recordWellAnalytics(uid, {
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

export function submitWellReflectionCallable(
  authUid: string | undefined,
  data: SubmitWellReflectionRequest,
): Promise<SubmitWellReflectionResponse> {
  const uid = requireUid(authUid);
  return handleSubmitWellReflection(uid, {
    questionId: String(data.questionId ?? ""),
    reflectionText: String(data.reflectionText ?? ""),
    headline: data.headline ?? null,
    localDate: String(data.localDate ?? ""),
  });
}
