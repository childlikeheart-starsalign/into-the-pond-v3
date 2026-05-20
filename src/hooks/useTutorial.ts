import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

import { firebaseAuth } from "@/src/services/firebase/client";
import { getDocument, setDocument } from "@/src/services/firebase/firestore";

const STORAGE_KEY = "@itp/tutorial-state-v1";
const SKIP_CACHE_KEY = "@itp/tutorial-skip-v1";
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

export type TutorialState = {
  startedAtIso: string;
  openingSequenceCompleted: boolean;
  dismissedDays: number[];
};

export type TutorialTipContent = {
  day: number;
  title: string;
  body: string;
  ctaLabel: string;
};

const DEFAULT_STATE: TutorialState = {
  startedAtIso: new Date().toISOString(),
  openingSequenceCompleted: false,
  dismissedDays: [],
};

const DAY_TIPS: TutorialTipContent[] = [
  { day: 1, title: "Welcome to the pond", body: "Start gently. Explore one small action today.", ctaLabel: "Let's begin" },
  { day: 2, title: "Keep it light", body: "Try one independent step and notice what worked.", ctaLabel: "Got it" },
  { day: 3, title: "Pause and reset", body: "A short pause can help before transitions.", ctaLabel: "Continue" },
  { day: 4, title: "Celebrate effort", body: "Progress is built from tiny consistent steps.", ctaLabel: "Continue" },
  { day: 5, title: "Ask for guidance", body: "Use support early instead of waiting for overwhelm.", ctaLabel: "Continue" },
  { day: 6, title: "Build routine", body: "Repeat one habit at the same time today.", ctaLabel: "Continue" },
  { day: 7, title: "You're ready", body: "You have completed the 7-day onboarding journey.", ctaLabel: "Finish" },
];

function getCurrentDay(startedAtIso: string): number {
  const startedAtMs = new Date(startedAtIso).getTime();
  const elapsed = Date.now() - startedAtMs;
  const day = Math.floor(elapsed / MILLIS_PER_DAY) + 1;
  return Math.min(Math.max(day, 1), 7);
}

async function markTutorialSeenInFirestore(): Promise<void> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) return;
  await setDocument("users", uid, { hasSeenTutorial: true });
}

export function useTutorial() {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<TutorialState>(DEFAULT_STATE);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // 1. Fast path: AsyncStorage skip cache (avoids Firestore hit for same-device returning users)
        const skipCache = await AsyncStorage.getItem(SKIP_CACHE_KEY);
        if (skipCache === "1") {
          if (alive) setEnabled(false);
          return;
        }

        // 2. Cross-device check: Firestore users/{uid}.hasSeenTutorial
        const uid = firebaseAuth.currentUser?.uid;
        if (uid) {
          const userDoc = await getDocument<{ hasSeenTutorial?: boolean }>("users", uid);
          if (userDoc?.hasSeenTutorial === true) {
            await AsyncStorage.setItem(SKIP_CACHE_KEY, "1");
            if (alive) setEnabled(false);
            return;
          }
        }

        // 3. New user — load or initialise tutorial state from AsyncStorage
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!alive) return;

        if (raw) {
          const parsed = JSON.parse(raw) as TutorialState;
          setState({
            startedAtIso: parsed.startedAtIso || DEFAULT_STATE.startedAtIso,
            openingSequenceCompleted: Boolean(parsed.openingSequenceCompleted),
            dismissedDays: Array.isArray(parsed.dismissedDays) ? parsed.dismissedDays : [],
          });
        } else {
          setState(DEFAULT_STATE);
        }

        if (alive) setEnabled(true);
      } catch {
        if (alive) setEnabled(false);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback(async (next: TutorialState) => {
    setState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const currentDay = useMemo(() => getCurrentDay(state.startedAtIso), [state.startedAtIso]);
  const currentTip = useMemo(
    () => DAY_TIPS.find((item) => item.day === currentDay) ?? DAY_TIPS[0],
    [currentDay],
  );

  const shouldShowOpeningSequence = ready && enabled && currentDay === 1 && !state.openingSequenceCompleted;
  const shouldShowDailyTip = ready && enabled && !state.dismissedDays.includes(currentDay);

  const completeOpeningSequence = useCallback(async () => {
    await persist({ ...state, openingSequenceCompleted: true });
  }, [persist, state]);

  const dismissTodayTip = useCallback(async () => {
    if (state.dismissedDays.includes(currentDay)) return;
    const next: TutorialState = { ...state, dismissedDays: [...state.dismissedDays, currentDay] };
    await persist(next);

    // Day 7 is the final tip — mark complete in Firestore and cache the skip flag locally
    if (currentDay === 7) {
      await Promise.all([
        AsyncStorage.setItem(SKIP_CACHE_KEY, "1"),
        markTutorialSeenInFirestore(),
      ]);
      setState((prev) => prev); // keep local state consistent; tutorial will hide via enabled flag on next mount
    }
  }, [currentDay, persist, state]);

  const resetTutorial = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(SKIP_CACHE_KEY),
      AsyncStorage.removeItem(STORAGE_KEY),
    ]);
    const fresh: TutorialState = { ...DEFAULT_STATE, startedAtIso: new Date().toISOString() };
    setState(fresh);
    setEnabled(true);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }, []);

  return {
    ready,
    currentDay,
    currentTip,
    shouldShowOpeningSequence,
    shouldShowDailyTip,
    completeOpeningSequence,
    dismissTodayTip,
    resetTutorial,
  };
}
