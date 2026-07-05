import { computeAgeBand, parseBirthDate } from "./computeAgeBand";
import { applyReroll, mergeWellState } from "./wellQuestionService";
import type { WellBankQuestion } from "./types";
import {
  parseLocalDate,
  recordWellAnalytics,
  requireUid,
  userRef,
  wellStateRef,
} from "./wellHelpers";
import { db } from "../../init";
import { wellRerollKey } from "../economy";
import {
  readIdempotencyInTransaction,
  writeIdempotencyInTransaction,
} from "../economy/resolveCallableIdempotency";

export type RerollWellQuestionResponse =
  | { success: true; question: WellBankQuestion }
  | {
      success: false;
      error:
        | "REROLL_LIMIT_REACHED"
        | "NO_ACTIVE_QUESTION"
        | "MISSING_AGE_BAND"
        | "INVALID_LOCAL_DATE";
    };

export async function handleRerollWellQuestion(
  uid: string,
  localDate: string,
  requestId: string,
): Promise<RerollWellQuestionResponse> {
  const parsedDate = parseLocalDate(localDate);
  if (!parsedDate) {
    return { success: false, error: "INVALID_LOCAL_DATE" };
  }

  const idempotencyKey = wellRerollKey(parsedDate, requestId);

  const txResult = await db.runTransaction(async (tx) => {
    const idemRead = await readIdempotencyInTransaction<{
      success: true;
      question: WellBankQuestion;
    }>(tx, userRef(uid), idempotencyKey);
    if (idemRead.hit) {
      return {
        success: true as const,
        question: idemRead.response.question,
        fromQuestionId: null,
        committed: false,
      };
    }

    const userSnap = await tx.get(userRef(uid));
    const wellStateSnap = await tx.get(wellStateRef(uid));
    const userData = userSnap.data() as { childBirthDate?: string } | undefined;
    const wellState = mergeWellState(wellStateSnap.data());

    if (!wellState.currentQuestionId || wellState.currentQuestionDate !== parsedDate) {
      return { success: false as const, error: "NO_ACTIVE_QUESTION" as const };
    }

    const birthDate = userData?.childBirthDate ? parseBirthDate(userData.childBirthDate) : null;
    if (!birthDate) {
      return { success: false as const, error: "MISSING_AGE_BAND" as const };
    }

    const fromQuestionId = wellState.currentQuestionId;
    const ageBand = computeAgeBand(birthDate);
    const seed = `${uid}:${parsedDate}:reroll:${wellState.rerollsUsedToday}`;
    const result = applyReroll(wellState, ageBand, parsedDate, seed);

    if (!result) {
      return { success: false as const, error: "REROLL_LIMIT_REACHED" as const };
    }

    tx.set(wellStateRef(uid), result.nextState, { merge: true });

    const response = { success: true as const, question: result.question };
    writeIdempotencyInTransaction(tx, userRef(uid), idempotencyKey, "well_reroll", response);

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
    await recordWellAnalytics(uid, {
      type: "well_question_rerolled",
      fromQuestionId: fromQuestion,
      toQuestionId: txResult.question.questionId,
      fromCategory: fromQuestion.split("-")[0],
      toCategory: txResult.question.category,
    });
  }

  return { success: true, question: txResult.question };
}

export function rerollWellQuestionCallable(
  authUid: string | undefined,
  data: { localDate?: unknown; requestId?: unknown },
): Promise<RerollWellQuestionResponse> {
  const uid = requireUid(authUid);
  const rawRequestId = data.requestId;
  const requestId =
    typeof rawRequestId === "string" && rawRequestId.trim() !== "" ? rawRequestId.trim() : "";
  return handleRerollWellQuestion(uid, String(data.localDate ?? ""), requestId);
}
