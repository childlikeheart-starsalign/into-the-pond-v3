import { doc, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

import { getLocalDateString } from "@/src/features/well/localDate";
import {
  clearWellAsked,
  deriveWellCardStatus,
  getWellAskedFlag,
  markWellAsked,
  type WellCardStatus,
} from "@/src/features/well/wellCardStatus";
import { firestore } from "@/src/services/firebase/client";

export type UseWellCardStatusResult = {
  status: WellCardStatus | null;
  markAsked: () => Promise<void>;
  refresh: () => void;
};

export function useWellCardStatus(
  uid: string | null | undefined,
  questionId: string | null | undefined,
  hasAnsweredToday: boolean,
): UseWellCardStatusResult {
  const localDate = getLocalDateString();
  const [asked, setAsked] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!uid || !questionId) {
      setAsked(false);
      return;
    }
    void getWellAskedFlag(uid, localDate, questionId).then(setAsked);
  }, [uid, localDate, questionId, tick]);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(firestore, "users", uid, "wellState", "current");
    const unsub = onSnapshot(ref, () => setTick((t) => t + 1));
    return unsub;
  }, [uid]);

  const status: WellCardStatus | null = questionId
    ? deriveWellCardStatus(hasAnsweredToday, asked)
    : null;

  const markAskedFn = useCallback(async () => {
    if (!uid || !questionId || hasAnsweredToday) return;
    await markWellAsked(uid, localDate, questionId);
    setAsked(true);
  }, [uid, localDate, questionId, hasAnsweredToday]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { status, markAsked: markAskedFn, refresh };
}

export async function resetWellAskedForReroll(
  uid: string,
  localDate: string,
  questionId: string,
): Promise<void> {
  await clearWellAsked(uid, localDate, questionId);
}
