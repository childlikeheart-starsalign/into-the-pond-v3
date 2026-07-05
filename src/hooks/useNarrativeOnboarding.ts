import { useCallback, useEffect, useState } from "react";

import {
  ChildArchetype,
  NarrativeOnboardingState,
  SceneNumber,
} from "@/src/constants/narrative/types";
import { persistChildBirthMonthYear } from "@/src/hooks/useChildBirthDate";
import {
  clearNarrativeStateOverride,
  getNarrativeOnboardingState,
  getNarrativeStateOverride,
  isNarrativeCompleteCached,
  markNarrativeComplete,
  resetNarrativeOnboarding,
  setChildArchetype,
  setChildBirthDate as setChildBirthDateStorage,
  setNarrativeCurrentScene,
  subscribeNarrativeOnboardingReset,
  syncNarrativeFromFirestore,
  syncNarrativeToFirestore,
} from "@/src/services/onboarding/narrativeOnboardingStorage";
import { firebaseAuth } from "@/src/services/firebase/client";

const DEFAULT_STATE: NarrativeOnboardingState = {
  childArchetype: null,
  childBirthDate: null,
  hasCompletedDay1Narrative: false,
  currentScene: 1,
  startedAtIso: null,
  completedAtIso: null,
};

type UseNarrativeOnboardingReturn = {
  ready: boolean;
  needsArchetype: boolean;
  needsBirthDate: boolean;
  needsNarrative: boolean;
  state: NarrativeOnboardingState;
  selectArchetype: (archetype: ChildArchetype) => Promise<void>;
  setChildBirthDate: (month: number, year: number) => Promise<void>;
  setCurrentScene: (scene: SceneNumber) => Promise<void>;
  completeNarrative: () => Promise<void>;
  resetNarrative: () => Promise<void>;
  hydrateFromRemote: (data: {
    childArchetype?: ChildArchetype | null;
    childBirthDate?: string | null;
    hasCompletedDay1Narrative?: boolean;
    narrativeProgress?: { currentScene?: number; completedAt?: string };
  }) => void;
};

export function useNarrativeOnboarding(): UseNarrativeOnboardingReturn {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<NarrativeOnboardingState>(DEFAULT_STATE);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const override = getNarrativeStateOverride();
        if (override) {
          if (alive) setState(override);
          return;
        }

        const cached = await isNarrativeCompleteCached();
        if (cached) {
          if (alive) setState((prev) => ({ ...prev, hasCompletedDay1Narrative: true }));
          return;
        }

        const uid = firebaseAuth.currentUser?.uid;
        if (uid) {
          const {
            hasCompleted,
            childArchetype: remoteArchetype,
            childBirthDate: remoteBirthDate,
          } = await syncNarrativeFromFirestore(uid);
          if (hasCompleted) {
            await markNarrativeComplete();
            if (alive) setState((prev) => ({ ...prev, hasCompletedDay1Narrative: true }));
            return;
          }
          if (remoteArchetype) {
            await setChildArchetype(remoteArchetype);
          }
          if (remoteBirthDate) {
            await setChildBirthDateStorage(remoteBirthDate);
          }
        }

        const localState = await getNarrativeOnboardingState();
        if (alive) setState(localState);
      } catch {
        const localState = await getNarrativeOnboardingState().catch(() => DEFAULT_STATE);
        if (alive) setState(localState);
      } finally {
        if (alive) setReady(true);
      }
    };

    void load();

    const unsubscribe = subscribeNarrativeOnboardingReset(() => {
      if (!alive) return;
      const override = getNarrativeStateOverride() ?? { ...DEFAULT_STATE };
      setState(override);
      setReady(true);
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const selectArchetype = useCallback(async (archetype: ChildArchetype) => {
    clearNarrativeStateOverride();
    await setChildArchetype(archetype);
    setState((prev) => ({ ...prev, childArchetype: archetype }));
    const uid = firebaseAuth.currentUser?.uid;
    if (uid) {
      await syncNarrativeToFirestore(uid, { childArchetype: archetype });
    }
  }, []);

  const setChildBirthDate = useCallback(async (month: number, year: number) => {
    clearNarrativeStateOverride();
    const result = await persistChildBirthMonthYear(month, year);
    if (!result.ok) {
      throw new Error(result.error);
    }
    setState((prev) => ({ ...prev, childBirthDate: result.isoDate }));
  }, []);

  const handleSetCurrentScene = useCallback(async (scene: SceneNumber) => {
    await setNarrativeCurrentScene(scene);
    setState((prev) => ({ ...prev, currentScene: scene }));
    const uid = firebaseAuth.currentUser?.uid;
    if (uid) {
      await syncNarrativeToFirestore(uid, {
        narrativeProgress: { currentScene: scene, lastUpdated: new Date().toISOString() },
      });
    }
  }, []);

  const completeNarrative = useCallback(async () => {
    clearNarrativeStateOverride();
    await markNarrativeComplete();
    setState((prev) => ({
      ...prev,
      hasCompletedDay1Narrative: true,
      completedAtIso: new Date().toISOString(),
    }));
    const uid = firebaseAuth.currentUser?.uid;
    if (uid) {
      const archetype = state.childArchetype ?? undefined;
      await syncNarrativeToFirestore(uid, {
        hasCompletedDay1Narrative: true,
        narrativeProgress: {
          currentScene: 6,
          completedAt: new Date().toISOString(),
          ...(archetype ? { archetype } : {}),
        },
      });
    }
  }, [state.childArchetype]);

  const resetNarrative = useCallback(async () => {
    const uid = firebaseAuth.currentUser?.uid ?? null;
    await resetNarrativeOnboarding(uid);
    const override = getNarrativeStateOverride() ?? { ...DEFAULT_STATE };
    setState(override);
    setReady(true);
  }, []);

  const hydrateFromRemote = useCallback(
    (data: {
      childArchetype?: ChildArchetype | null;
      childBirthDate?: string | null;
      hasCompletedDay1Narrative?: boolean;
      narrativeProgress?: { currentScene?: number; completedAt?: string };
    }) => {
      setState((prev) => {
        const next: NarrativeOnboardingState = { ...prev };
        if (data.childArchetype != null) {
          next.childArchetype = data.childArchetype;
        }
        if (data.childBirthDate != null) {
          next.childBirthDate = data.childBirthDate;
        }
        if (data.hasCompletedDay1Narrative === true) {
          next.hasCompletedDay1Narrative = true;
          if (!next.completedAtIso && data.narrativeProgress?.completedAt) {
            next.completedAtIso = data.narrativeProgress.completedAt;
          }
        }
        if (data.narrativeProgress?.currentScene) {
          next.currentScene = data.narrativeProgress.currentScene as SceneNumber;
        }
        return next;
      });

      void (async () => {
        if (data.childBirthDate) {
          const local = await getNarrativeOnboardingState();
          if (!local.childBirthDate) {
            await setChildBirthDateStorage(data.childBirthDate);
          }
        }
      })();
    },
    [],
  );

  const effectiveState = getNarrativeStateOverride() ?? state;
  const completed = effectiveState.hasCompletedDay1Narrative;

  const needsArchetype = ready && !completed && !effectiveState.childArchetype;
  const needsBirthDate =
    ready && !completed && !!effectiveState.childArchetype && !effectiveState.childBirthDate;
  const needsNarrative =
    ready && !completed && !!effectiveState.childArchetype && !!effectiveState.childBirthDate;

  return {
    ready,
    needsArchetype,
    needsBirthDate,
    needsNarrative,
    state: effectiveState,
    selectArchetype,
    setChildBirthDate,
    setCurrentScene: handleSetCurrentScene,
    completeNarrative,
    resetNarrative,
    hydrateFromRemote,
  };
}
