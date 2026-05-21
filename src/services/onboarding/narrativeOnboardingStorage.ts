import AsyncStorage from "@react-native-async-storage/async-storage";

import { getDocument, setDocument } from "@/src/services/firebase/firestore";
import {
  ChildArchetype,
  NarrativeOnboardingState,
  SceneNumber,
} from "@/src/constants/narrative/types";

const STORAGE_KEY = "@itp/narrative-onboarding-v1";
/** Fast-path key: set once when narrative is fully complete, so we skip Firestore on every launch. */
const COMPLETE_CACHE_KEY = "@itp/narrative-onboarding-complete-v1";

const DEFAULT_STATE: NarrativeOnboardingState = {
  childArchetype: null,
  hasCompletedDay1Narrative: false,
  currentScene: 1,
  startedAtIso: null,
  completedAtIso: null,
};

type ResetListener = () => void;
const resetListeners = new Set<ResetListener>();

/** Synchronous override so guards see reset before React re-renders. */
let narrativeStateOverride: NarrativeOnboardingState | null = null;

export function getNarrativeStateOverride(): NarrativeOnboardingState | null {
  return narrativeStateOverride;
}

export function clearNarrativeStateOverride(): void {
  narrativeStateOverride = null;
}

export function getSyncNarrativeNeeds(): {
  needsArchetype: boolean;
  needsNarrative: boolean;
} | null {
  if (!narrativeStateOverride) return null;
  return {
    needsArchetype:
      !narrativeStateOverride.hasCompletedDay1Narrative && !narrativeStateOverride.childArchetype,
    needsNarrative:
      !narrativeStateOverride.hasCompletedDay1Narrative && !!narrativeStateOverride.childArchetype,
  };
}

/** Lets every useNarrativeOnboarding instance reload after a dev/user reset. */
export function subscribeNarrativeOnboardingReset(listener: ResetListener): () => void {
  resetListeners.add(listener);
  return () => resetListeners.delete(listener);
}

function notifyNarrativeOnboardingReset(): void {
  resetListeners.forEach((listener) => listener());
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getNarrativeOnboardingState(): Promise<NarrativeOnboardingState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<NarrativeOnboardingState>;
    return {
      childArchetype: parsed.childArchetype ?? null,
      hasCompletedDay1Narrative: Boolean(parsed.hasCompletedDay1Narrative),
      currentScene: (parsed.currentScene as SceneNumber) ?? 1,
      startedAtIso: parsed.startedAtIso ?? null,
      completedAtIso: parsed.completedAtIso ?? null,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function isNarrativeCompleteCached(): Promise<boolean> {
  const v = await AsyncStorage.getItem(COMPLETE_CACHE_KEY);
  return v === "1";
}

// ─── Write ───────────────────────────────────────────────────────────────────

export async function setNarrativeOnboardingState(
  patch: Partial<NarrativeOnboardingState>,
): Promise<void> {
  const current = await getNarrativeOnboardingState();
  const next: NarrativeOnboardingState = { ...current, ...patch };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function setChildArchetype(archetype: ChildArchetype): Promise<void> {
  const current = await getNarrativeOnboardingState();
  const next: NarrativeOnboardingState = {
    ...current,
    childArchetype: archetype,
    startedAtIso: current.startedAtIso ?? new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function setNarrativeCurrentScene(scene: SceneNumber): Promise<void> {
  await setNarrativeOnboardingState({ currentScene: scene });
}

export async function markNarrativeComplete(): Promise<void> {
  const current = await getNarrativeOnboardingState();
  const next: NarrativeOnboardingState = {
    ...current,
    hasCompletedDay1Narrative: true,
    currentScene: 6,
    completedAtIso: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  await AsyncStorage.setItem(COMPLETE_CACHE_KEY, "1");
}

// ─── Reset ───────────────────────────────────────────────────────────────────

export async function resetNarrativeOnboarding(uid?: string | null): Promise<void> {
  narrativeStateOverride = { ...DEFAULT_STATE };

  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEY),
      AsyncStorage.removeItem(COMPLETE_CACHE_KEY),
    ]);

    if (uid) {
      await syncNarrativeToFirestore(
        uid,
        {
          childArchetype: null,
          hasCompletedDay1Narrative: false,
          narrativeProgress: {
            currentScene: 1,
            lastUpdated: new Date().toISOString(),
          },
        },
        { throwOnError: true },
      );
    }

    notifyNarrativeOnboardingReset();
  } catch (error) {
    narrativeStateOverride = null;
    throw error;
  }
}

// ─── Firestore sync ──────────────────────────────────────────────────────────

type FirestoreNarrativePatch = {
  childArchetype?: ChildArchetype | null;
  hasCompletedDay1Narrative?: boolean;
  narrativeProgress?: {
    currentScene: number;
    archetype?: ChildArchetype;
    completedAt?: string;
    lastUpdated?: string;
  };
};

export async function syncNarrativeFromFirestore(
  uid: string,
): Promise<{ hasCompleted: boolean; childArchetype: ChildArchetype | null }> {
  try {
    const doc = await getDocument<{
      hasCompletedDay1Narrative?: boolean;
      childArchetype?: ChildArchetype;
    }>("users", uid);
    return {
      hasCompleted: doc?.hasCompletedDay1Narrative === true,
      childArchetype: doc?.childArchetype ?? null,
    };
  } catch {
    return { hasCompleted: false, childArchetype: null };
  }
}

export async function syncNarrativeToFirestore(
  uid: string,
  patch: FirestoreNarrativePatch,
  options?: { throwOnError?: boolean },
): Promise<void> {
  try {
    await setDocument("users", uid, patch as Record<string, unknown>);
  } catch (error) {
    if (options?.throwOnError) throw error;
  }
}
