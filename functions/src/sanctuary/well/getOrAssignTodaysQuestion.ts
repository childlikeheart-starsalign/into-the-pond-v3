import { computeAgeBand, parseBirthDate } from "./computeAgeBand";
import {
  canReroll,
  getTodaysQuestion,
  hasAnsweredToday,
  mergeWellState,
} from "./wellQuestionService";
import type { WellBankQuestion } from "./types";
import {
  parseLocalDate,
  parseOptionalChildId,
  recordWellAnalytics,
  requireUid,
  resolveBirthDateForWell,
  userRef,
  wellStateRef,
} from "./wellHelpers";
import { db } from "../../init";
import { applyOperationalCounterResetsInTransaction } from "../dailyCounters";
import { wellAssignKey } from "../economy";
import {
  readIdempotencyInTransaction,
  writeIdempotencyInTransaction,
} from "../economy/resolveCallableIdempotency";

export type GetOrAssignTodaysQuestionResponse =
  | {
      success: true;
      question: WellBankQuestion;
      hasAnsweredToday: boolean;
      canReroll: boolean;
    }
  | { success: false; error: "MISSING_BIRTH_DATE" | "INVALID_LOCAL_DATE" };

export async function handleGetOrAssignTodaysQuestion(
  uid: string,
  localDate: string,
  childId?: string | null,
): Promise<GetOrAssignTodaysQuestionResponse> {
  const parsedDate = parseLocalDate(localDate);
  if (!parsedDate) {
    return { success: false, error: "INVALID_LOCAL_DATE" };
  }

  const idempotencyKey = wellAssignKey(parsedDate);

  const txResult = await db.runTransaction(async (tx) => {
    const idemRead = await readIdempotencyInTransaction<{
      success: true;
      question: WellBankQuestion;
      hasAnsweredToday: boolean;
      canReroll: boolean;
    }>(tx, userRef(uid), idempotencyKey);
    if (idemRead.hit) {
      return { ...idemRead.response, analytics: null };
    }

    const userSnap = await tx.get(userRef(uid));
    const userData = (userSnap.data() ?? {}) as Record<string, unknown>;
    applyOperationalCounterResetsInTransaction(tx, userRef(uid), userData);
    const wellStateSnap = await tx.get(wellStateRef(uid, childId));

    const birthRaw = await resolveBirthDateForWell(tx, uid, childId);
    const birthDate = birthRaw ? parseBirthDate(birthRaw) : null;
    if (!birthDate) {
      return { success: false as const, error: "MISSING_BIRTH_DATE" as const };
    }

    const ageBand = computeAgeBand(birthDate);
    const wellState = mergeWellState(wellStateSnap.data());
    const seed = `${uid}:${parsedDate}`;
    const { question, statePatch } = getTodaysQuestion(wellState, ageBand, parsedDate, seed);
    const finalState = statePatch ? { ...wellState, ...statePatch } : wellState;

    if (statePatch) {
      tx.set(wellStateRef(uid, childId), finalState, { merge: true });
    }

    const response = {
      success: true as const,
      question,
      hasAnsweredToday: hasAnsweredToday(finalState, parsedDate, question.questionId),
      canReroll: canReroll(finalState, parsedDate),
    };

    if (statePatch) {
      writeIdempotencyInTransaction(tx, userRef(uid), idempotencyKey, "well_assign", response);
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
    await recordWellAnalytics(uid, {
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

export function getOrAssignTodaysQuestionCallable(
  authUid: string | undefined,
  data: { localDate?: unknown; childId?: unknown },
): Promise<GetOrAssignTodaysQuestionResponse> {
  const uid = requireUid(authUid);
  return handleGetOrAssignTodaysQuestion(
    uid,
    String(data.localDate ?? ""),
    parseOptionalChildId(data.childId),
  );
}
