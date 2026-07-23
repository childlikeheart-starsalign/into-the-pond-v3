import { useCallback, useEffect, useRef, useState } from "react";

import { getLocalDateString } from "@/src/features/well/localDate";
import {
  clearWellReflectionDraft,
  getWellReflectionDraft,
  setWellReflectionDraft,
} from "@/src/features/well/wellReflectionDraft";
import { resetWellAskedForReroll } from "@/src/hooks/useWellCardStatus";
import { firebaseAuth } from "@/src/services/firebase/client";
import {
  ensureWellState,
  getOrAssignTodaysWellQuestion,
  rerollWellQuestion,
  submitWellReflection,
} from "@/src/services/firebase/serverActions";
import type { WellBankQuestion } from "@/shared/sanctuary/well/types";
import type { SubmitWellReflectionResponse } from "@/src/services/firebase/types";
import type { WellCardStatus } from "@/src/features/well/wellCardStatus";
import {
  classifyWellLoadError,
  type WellLoadError,
} from "@/src/features/well/classifyWellLoadError";
import {
  devRerollWellQuestion,
  devSubmitWellReflection,
  isCallableAuthError,
  isFunctionsUnavailable,
  loadDevWellQuestion,
} from "@/src/features/well/wellDevPreview";
import { deriveWellCardStatus, getWellAskedFlag } from "@/src/features/well/wellCardStatus";
import { Sentry } from "@/src/services/sentry/init";

function warnWellCallableAuthFailure(flow: string, err: unknown) {
  if (__DEV__ && isCallableAuthError(err)) {
    console.warn(
      `[Well] callable auth failed (${flow}) — check EXPO_PUBLIC_FIREBASE_PROJECT_ID, EXPO_PUBLIC_CLOUD_FUNCTIONS_REGION, and signed-in user token.`,
      err,
    );
  }
}

export type UseWellQuestionResult = {
  status: "idle" | "loading" | "ready" | "answered" | "error";
  cardStatus: WellCardStatus | null;
  question: WellBankQuestion | null;
  hasAnsweredToday: boolean;
  canReroll: boolean;
  error: WellLoadError | null;
  localDate: string;
  draftText: string;
  setDraftText: (text: string) => void;
  refresh: () => Promise<void>;
  markAsked: () => Promise<void>;
  reroll: () => Promise<void>;
  submitReflection: (text: string, headline?: string) => Promise<SubmitWellReflectionResponse>;
};

function applyQuestionLoadResult(
  response: Extract<Awaited<ReturnType<typeof getOrAssignTodaysWellQuestion>>, { success: true }>,
  uid: string,
  localDate: string,
  setters: {
    setQuestion: (q: WellBankQuestion) => void;
    setHasAnsweredToday: (v: boolean) => void;
    setCanReroll: (v: boolean) => void;
    setStatus: (s: UseWellQuestionResult["status"]) => void;
    setDraftTextState: (t: string) => void;
    setAsked: (v: boolean) => void;
  },
  isActive: () => boolean,
) {
  if (!isActive()) return;
  setters.setQuestion(response.question);
  setters.setHasAnsweredToday(response.hasAnsweredToday);
  setters.setCanReroll(response.canReroll);
  setters.setStatus(response.hasAnsweredToday ? "answered" : "ready");

  void (async () => {
    const draft = await getWellReflectionDraft(uid, localDate, response.question.questionId);
    if (!isActive()) return;
    setters.setDraftTextState(draft ?? "");
    const askedFlag = await getWellAskedFlag(uid, localDate, response.question.questionId);
    if (!isActive()) return;
    setters.setAsked(askedFlag);
  })();
}

export function useWellQuestion(enabled: boolean, childId?: string | null): UseWellQuestionResult {
  const localDate = getLocalDateString();
  const [status, setStatus] = useState<UseWellQuestionResult["status"]>("idle");
  const [question, setQuestion] = useState<WellBankQuestion | null>(null);
  const [hasAnsweredToday, setHasAnsweredToday] = useState(false);
  const [canReroll, setCanReroll] = useState(false);
  const [error, setError] = useState<UseWellQuestionResult["error"]>(null);
  const [draftText, setDraftTextState] = useState("");
  const [asked, setAsked] = useState(false);
  const mountedRef = useRef(true);
  const childIdRef = useRef(childId);
  childIdRef.current = childId;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid || !enabled) {
      setStatus("idle");
      return;
    }

    setStatus((current) => (current === "ready" || current === "answered" ? current : "loading"));
    setError(null);

    const isActive = () => mountedRef.current;
    const setters = {
      setQuestion,
      setHasAnsweredToday,
      setCanReroll,
      setStatus,
      setDraftTextState,
      setAsked,
    };

    const scopedChildId = childIdRef.current;

    try {
      await ensureWellState(uid, scopedChildId);
      if (!isActive()) return;
      const response = await getOrAssignTodaysWellQuestion(uid, localDate, scopedChildId);
      if (!isActive()) return;
      if (!response.success) {
        setError(response.error === "MISSING_BIRTH_DATE" ? "MISSING_BIRTH_DATE" : "UNKNOWN");
        setStatus("error");
        return;
      }

      applyQuestionLoadResult(response, uid, localDate, setters, isActive);
    } catch (err) {
      if (!isActive()) return;
      console.warn("[Well] load failed", err);
      Sentry.captureException(err, {
        tags: { area: "well", flow: "load_question" },
      });

      warnWellCallableAuthFailure("load", err);
      if (__DEV__ && isFunctionsUnavailable(err)) {
        console.warn(
          "[Well] Cloud Functions unavailable — using local dev preview. Deploy ensureWellState + getOrAssignTodaysQuestion to asia-east2.",
          err,
        );
        const devResponse = await loadDevWellQuestion(uid, localDate);
        if (!isActive()) return;
        if (!devResponse.success) {
          setError(devResponse.error === "MISSING_BIRTH_DATE" ? "MISSING_BIRTH_DATE" : "UNKNOWN");
          setStatus("error");
          return;
        }
        applyQuestionLoadResult(devResponse, uid, localDate, setters, isActive);
        return;
      }

      setError(classifyWellLoadError(err));
      setStatus("error");
    }
  }, [enabled, localDate, childId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setDraftText = useCallback(
    (text: string) => {
      setDraftTextState(text);
      const uid = firebaseAuth.currentUser?.uid;
      if (!uid || !question) return;
      void setWellReflectionDraft(uid, localDate, question.questionId, text);
    },
    [localDate, question],
  );

  const markAsked = useCallback(async () => {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid || !question || hasAnsweredToday) return;
    const { markWellAsked } = await import("@/src/features/well/wellCardStatus");
    await markWellAsked(uid, localDate, question.questionId);
    setAsked(true);
  }, [hasAnsweredToday, localDate, question]);

  const reroll = useCallback(async () => {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid || !question) return;

    const priorId = question.questionId;
    const requestId =
      typeof globalThis.crypto?.randomUUID === "function"
        ? `well_reroll_${globalThis.crypto.randomUUID()}`
        : `well_reroll_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

    let response;
    try {
      response = await rerollWellQuestion(uid, localDate, requestId, childIdRef.current);
    } catch (err) {
      warnWellCallableAuthFailure("reroll", err);
      if (__DEV__ && isFunctionsUnavailable(err)) {
        response = await devRerollWellQuestion(uid, localDate);
      } else {
        console.warn("[Well] reroll failed", err);
        Sentry.captureException(err, {
          tags: { area: "well", flow: "reroll_question" },
        });
        return;
      }
    }

    if (!response.success) return;

    await resetWellAskedForReroll(uid, localDate, priorId);
    await clearWellReflectionDraft(uid, localDate, priorId);

    setQuestion(response.question);
    setHasAnsweredToday(false);
    setCanReroll(false);
    setAsked(false);
    setDraftTextState("");
    setStatus("ready");
  }, [localDate, question]);

  const submitReflection = useCallback(
    async (text: string, headline?: string): Promise<SubmitWellReflectionResponse> => {
      const uid = firebaseAuth.currentUser?.uid;
      if (!uid || !question) {
        return { success: false, error: "QUESTION_MISMATCH" };
      }

      const trimmed = text.trim();
      if (trimmed.length < 10) {
        return { success: false, error: "REFLECTION_TOO_SHORT" };
      }
      if (trimmed.length > 2000) {
        return { success: false, error: "REFLECTION_TOO_LONG" };
      }

      try {
        const response = await submitWellReflection(uid, {
          questionId: question.questionId,
          reflectionText: trimmed,
          headline: headline ?? null,
          localDate,
          childId: childIdRef.current,
        });

        if (response.success) {
          setHasAnsweredToday(true);
          setStatus("answered");
          await clearWellReflectionDraft(uid, localDate, question.questionId);
        }

        return response;
      } catch (err) {
        warnWellCallableAuthFailure("submit", err);
        if (__DEV__ && isFunctionsUnavailable(err)) {
          const response = await devSubmitWellReflection(uid, {
            questionId: question.questionId,
            reflectionText: trimmed,
            headline: headline ?? null,
            localDate,
          });

          if (response.success) {
            setHasAnsweredToday(true);
            setStatus("answered");
            await clearWellReflectionDraft(uid, localDate, question.questionId);
          }

          return response;
        }

        console.warn("[Well] submit reflection failed", err);
        Sentry.captureException(err, {
          tags: { area: "well", flow: "submit_reflection" },
        });
        return { success: false, error: "QUESTION_MISMATCH" };
      }
    },
    [localDate, question],
  );

  const cardStatus = question ? deriveWellCardStatus(hasAnsweredToday, asked) : null;

  return {
    status,
    cardStatus,
    question,
    hasAnsweredToday,
    canReroll,
    error,
    localDate,
    draftText,
    setDraftText,
    refresh: load,
    markAsked,
    reroll,
    submitReflection,
  };
}
