import { useCallback, useEffect, useState } from "react";

import {
  ChildArchetype,
  NarrativeOnboardingState,
  SceneNumber,
} from "@/src/constants/narrative/types";
import {
  clearNarrativeStateOverride,
  getNarrativeOnboardingState,
  getNarrativeStateOverride,
  isNarrativeCompleteCached,
  markNarrativeComplete,
  resetNarrativeOnboarding,
  setChildArchetype,
  setNarrativeCurrentScene,
  subscribeNarrativeOnboardingReset,
  syncNarrativeFromFirestore,
  syncNarrativeToFirestore,
} from "@/src/services/onboarding/narrativeOnboardingStorage";
import { firebaseAuth } from "@/src/services/firebase/client";

const DEFAULT_STATE: NarrativeOnboardingState = {
  childArchetype: null,
  hasCompletedDay1Narrative: false,
  currentScene: 1,
  startedAtIso: null,
  completedAtIso: null,
};

type UseNarrativeOnboardingReturn = {
  /** True once the initial async load is done. */
  ready: boolean;
  /** Authenticated user has no archetype stored — show the picker first. */
  needsArchetype: boolean;
  /** Archetype is set but Day 1 narrative not yet completed. */
  needsNarrative: boolean;
  state: NarrativeOnboardingState;
  selectArchetype: (archetype: ChildArchetype) => Promise<void>;
  setCurrentScene: (scene: SceneNumber) => Promise<void>;
  completeNarrative: () => Promise<void>;
  resetNarrative: () => Promise<void>;
  /** Hydrate from a remote user profile snapshot (Firestore). */
  hydrateFromRemote: (data: {
    childArchetype?: ChildArchetype | null;
    hasCompletedDay1Narrative?: boolean;
    narrativeProgress?: { currentScene?: number; completedAt?: string };
  }) => void;
};

/**
 * Orchestrates loading, gating, and persisting the Day 1 narrative onboarding.
 *
 * Mount-time sequence:
 * 1. Check AsyncStorage fast-path cache (avoids Firestore hit for returning users).
 * 2. If not cached, cross-check Firestore (handles device switching).
 * 3. Load full local state for in-progress users.
 */
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

        // 1. Fast path: already marked complete locally
        const cached = await isNarrativeCompleteCached();
        if (cached) {
          if (alive) setState((prev) => ({ ...prev, hasCompletedDay1Narrative: true }));
          return;
        }

        // 2. Cross-device: Firestore check
        const uid = firebaseAuth.currentUser?.uid;
        if (uid) {
          const { hasCompleted, childArchetype: remoteArchetype } =
            await syncNarrativeFromFirestore(uid);
          if (hasCompleted) {
            // Cache the result so we skip this check on subsequent launches
            await markNarrativeComplete();
            if (alive) setState((prev) => ({ ...prev, hasCompletedDay1Narrative: true }));
            return;
          }
          // If Firestore has an archetype but local doesn't, pick it up
          if (remoteArchetype) {
            await setChildArchetype(remoteArchetype);
          }
        }

        // 3. Load full local state
        const localState = await getNarrativeOnboardingState();
        if (alive) setState(localState);
      } catch {
        // On any error, keep defaults — user will see the picker/flow from scratch
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
      hasCompletedDay1Narrative?: boolean;
      narrativeProgress?: { currentScene?: number; completedAt?: string };
    }) => {
      setState((prev) => {
        const next: NarrativeOnboardingState = { ...prev };
        if (data.childArchetype != null) {
          next.childArchetype = data.childArchetype;
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
    },
    [],
  );

  const effectiveState = getNarrativeStateOverride() ?? state;

  const needsArchetype =
    ready && !effectiveState.hasCompletedDay1Narrative && !effectiveState.childArchetype;
  const needsNarrative =
    ready && !effectiveState.hasCompletedDay1Narrative && !!effectiveState.childArchetype;

  return {
    ready,
    needsArchetype,
    needsNarrative,
    state,
    selectArchetype,
    setCurrentScene: handleSetCurrentScene,
    completeNarrative,
    resetNarrative,
    hydrateFromRemote,
  };
}
