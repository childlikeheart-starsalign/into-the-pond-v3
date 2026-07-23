import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseError } from "firebase/app";
import { doc, getDoc } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";

/**
 * DEV preview only — Well flows when Cloud Functions are unavailable.
 * INVARIANT 2: Never writes economy or wellState to Firestore.
 * State lives in AsyncStorage + local child-atlas dev store only.
 */
import { appendDevChildAtlasEntry } from "@/src/features/childAtlas/childAtlasDevStore";
import { creditDevPreviewWonderIdempotent } from "@/src/features/sanctuary/devPreviewWonder";
import { getNarrativeOnboardingState } from "@/src/services/onboarding/narrativeOnboardingStorage";
import { firestore } from "@/src/services/firebase/client";
import type {
  GetOrAssignTodaysQuestionResponse,
  RerollWellQuestionResponse,
  SubmitWellReflectionResponse,
  UserDoc,
} from "@/src/services/firebase/types";
import { computeAgeBand, parseBirthDate } from "@/shared/sanctuary/well/computeAgeBand";
import { WELL_QUESTION_BY_ID } from "@/shared/sanctuary/well/catalog";
import type { UserWellState } from "@/shared/sanctuary/well/types";
import {
  applyReroll,
  canReroll,
  getTodaysQuestion,
  hasAnsweredToday,
  mergeWellState,
} from "@/shared/sanctuary/well/wellQuestionService";
import { WELL_QUESTION_ANSWERED, wonderAmountForRule } from "@/shared/sanctuary/wonder/rules";

const devStateKey = (uid: string) => `well:dev-state:${uid}`;

export function isFunctionsUnavailable(error: unknown): boolean {
  if (!(error instanceof FirebaseError)) return false;
  return (
    error.code === "functions/not-found" ||
    error.code === "functions/unavailable" ||
    error.code === "not-found" ||
    error.message.includes("not-found")
  );
}

export function isCallableAuthError(error: unknown): boolean {
  if (!(error instanceof FirebaseError)) return false;
  return error.code === "functions/unauthenticated" || error.code === "unauthenticated";
}

async function loadDevWellState(uid: string): Promise<UserWellState> {
  const raw = await AsyncStorage.getItem(devStateKey(uid));
  if (!raw) return mergeWellState(undefined);
  try {
    return mergeWellState(JSON.parse(raw) as Partial<UserWellState>);
  } catch {
    return mergeWellState(undefined);
  }
}

async function saveDevWellState(uid: string, state: UserWellState): Promise<void> {
  await AsyncStorage.setItem(devStateKey(uid), JSON.stringify(state));
}

async function resolveChildBirthDate(uid: string): Promise<string | null> {
  const narrative = await getNarrativeOnboardingState();
  if (narrative.childBirthDate) {
    return narrative.childBirthDate;
  }

  try {
    const snap = await getDoc(doc(firestore, "users", uid));
    const data = snap.data() as UserDoc | undefined;
    return data?.childBirthDate ?? null;
  } catch {
    return null;
  }
}

/** Dev-only no-op when ensureWellState is not deployed. */
export async function devEnsureWellState(): Promise<{ success: true; alreadyExisted: boolean }> {
  return { success: true, alreadyExisted: false };
}

/** Dev-only Well load when Cloud Functions are not deployed (mirrors fishing local cast). */
export async function loadDevWellQuestion(
  uid: string,
  localDate: string,
): Promise<GetOrAssignTodaysQuestionResponse> {
  const isoDate = await resolveChildBirthDate(uid);
  if (!isoDate) {
    return { success: false, error: "MISSING_BIRTH_DATE" };
  }

  const birthDate = parseBirthDate(isoDate);
  if (!birthDate) {
    return { success: false, error: "MISSING_BIRTH_DATE" };
  }

  const ageBand = computeAgeBand(birthDate);
  const state = await loadDevWellState(uid);
  const seed = `${uid}:${localDate}`;
  const { question, statePatch } = getTodaysQuestion(state, ageBand, localDate, seed);
  const finalState = statePatch ? { ...state, ...statePatch } : state;

  if (statePatch) {
    await saveDevWellState(uid, finalState);
  }

  return {
    success: true,
    question,
    hasAnsweredToday: hasAnsweredToday(finalState, localDate, question.questionId),
    canReroll: canReroll(finalState, localDate),
  };
}

export async function devSubmitWellReflection(
  uid: string,
  payload: {
    questionId: string;
    reflectionText: string;
    headline?: string | null;
    localDate: string;
  },
): Promise<SubmitWellReflectionResponse> {
  const { questionId, reflectionText, headline, localDate } = payload;
  const trimmed = reflectionText.trim();

  if (trimmed.length < 10) {
    return { success: false, error: "REFLECTION_TOO_SHORT" };
  }
  if (trimmed.length > 2000) {
    return { success: false, error: "REFLECTION_TOO_LONG" };
  }

  const question = WELL_QUESTION_BY_ID[questionId];
  if (!question) {
    return { success: false, error: "INVALID_QUESTION_ID" };
  }

  const state = await loadDevWellState(uid);
  if (state.currentQuestionId !== questionId) {
    return { success: false, error: "QUESTION_MISMATCH" };
  }
  if (hasAnsweredToday(state, localDate, questionId)) {
    return { success: false, error: "ALREADY_ANSWERED_TODAY" };
  }

  const wonderAwarded = wonderAmountForRule(
    WELL_QUESTION_ANSWERED,
    `${uid}:${questionId}:${localDate}`,
  );
  const updatedAnsweredIds = [...state.answeredQuestionIds, questionId];
  await saveDevWellState(uid, {
    ...state,
    answeredQuestionIds: updatedAnsweredIds,
    insightCount: updatedAnsweredIds.length,
  });

  const atlasEntryId = `dev_${Date.now()}`;
  await appendDevChildAtlasEntry(uid, {
    id: atlasEntryId,
    questionId,
    category: question.category,
    reflectionText: trimmed,
    headline: headline?.trim() || null,
    prompt: question.prompt,
    themeLabel: question.themeLabel,
    dateDiscovered: Timestamp.now(),
  });

  await creditDevPreviewWonderIdempotent(uid, wonderAwarded, `well:${questionId}:${localDate}`);

  return {
    success: true,
    wonderAwarded,
    newInsightCount: updatedAnsweredIds.length,
    atlasEntryId,
    previewOnly: true,
  };
}

/** Backfill preview wonder for dev Well answers that predate overlay crediting. */
export async function syncDevPreviewWonderFromWellState(uid: string): Promise<void> {
  if (!__DEV__) return;

  const state = await loadDevWellState(uid);
  const { currentQuestionId, currentQuestionDate } = state;
  if (!currentQuestionId || !currentQuestionDate) return;
  if (!hasAnsweredToday(state, currentQuestionDate, currentQuestionId)) return;

  const wonderAwarded = wonderAmountForRule(
    WELL_QUESTION_ANSWERED,
    `${uid}:${currentQuestionId}:${currentQuestionDate}`,
  );
  await creditDevPreviewWonderIdempotent(
    uid,
    wonderAwarded,
    `well:${currentQuestionId}:${currentQuestionDate}`,
  );
}

export async function devRerollWellQuestion(
  uid: string,
  localDate: string,
): Promise<RerollWellQuestionResponse> {
  const isoDate = await resolveChildBirthDate(uid);
  if (!isoDate) {
    return { success: false, error: "MISSING_AGE_BAND" };
  }

  const birthDate = parseBirthDate(isoDate);
  if (!birthDate) {
    return { success: false, error: "MISSING_AGE_BAND" };
  }

  const state = await loadDevWellState(uid);
  if (!state.currentQuestionId || state.currentQuestionDate !== localDate) {
    return { success: false, error: "NO_ACTIVE_QUESTION" };
  }

  const ageBand = computeAgeBand(birthDate);
  const seed = `${uid}:${localDate}:reroll:${state.rerollsUsedToday}`;
  const result = applyReroll(state, ageBand, localDate, seed);
  if (!result) {
    return { success: false, error: "REROLL_LIMIT_REACHED" };
  }

  await saveDevWellState(uid, result.nextState);
  return { success: true, question: result.question };
}
