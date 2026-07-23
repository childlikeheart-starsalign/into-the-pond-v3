import AsyncStorage from "@react-native-async-storage/async-storage";

import { getDocument, setDocument } from "@/src/services/firebase/firestore";
import {
  ChildArchetype,
  NarrativeOnboardingState,
  SceneNumber,
} from "@/src/constants/narrative/types";
import { childProfileFeatureFlags } from "@/src/features/childProfile/featureFlags";
import { firestore } from "@/src/services/firebase/client";
import { doc, getDoc } from "firebase/firestore";

import type { QuickCheckArchetype } from "@/shared/childProfile/archetypeQuickCheck";

const STORAGE_KEY = "@itp/narrative-onboarding-v1";
/** Fast-path key: set once when narrative is fully complete, so we skip Firestore on every launch. */
const COMPLETE_CACHE_KEY = "@itp/narrative-onboarding-complete-v1";

const DEFAULT_STATE: NarrativeOnboardingState = {
  childArchetype: null,
  childBirthDate: null,
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
  needsBirthDate: boolean;
  needsNarrative: boolean;
} | null {
  if (!narrativeStateOverride) return null;
  const completed = narrativeStateOverride.hasCompletedDay1Narrative;
  return {
    needsArchetype: !completed && !narrativeStateOverride.childArchetype,
    needsBirthDate:
      !completed &&
      !!narrativeStateOverride.childArchetype &&
      !narrativeStateOverride.childBirthDate,
    needsNarrative:
      !completed &&
      !!narrativeStateOverride.childArchetype &&
      !!narrativeStateOverride.childBirthDate,
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
      childBirthDate: parsed.childBirthDate ?? null,
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

export async function setChildBirthDate(isoDate: string): Promise<void> {
  const current = await getNarrativeOnboardingState();
  const next: NarrativeOnboardingState = {
    ...current,
    childBirthDate: isoDate,
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
          childBirthDate: null,
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
  childBirthDate?: string | null;
  hasCompletedDay1Narrative?: boolean;
  narrativeProgress?: {
    currentScene: number;
    archetype?: ChildArchetype;
    completedAt?: string;
    lastUpdated?: string;
  };
};

export async function syncNarrativeFromFirestore(uid: string): Promise<{
  hasCompleted: boolean;
  childArchetype: ChildArchetype | null;
  childBirthDate: string | null;
}> {
  try {
    const docData = await getDocument<{
      hasCompletedDay1Narrative?: boolean;
      childArchetype?: ChildArchetype;
      childBirthDate?: string;
      activeChildId?: string | null;
    }>("users", uid);

    let childArchetype = docData?.childArchetype ?? null;
    let childBirthDate = docData?.childBirthDate ?? null;
    let hasCompleted = docData?.hasCompletedDay1Narrative === true;

    // Dual-read (Flag A): prefer children/{activeChildId} narrative fields when present.
    if (
      childProfileFeatureFlags.migrationDualRead &&
      typeof docData?.activeChildId === "string" &&
      docData.activeChildId.trim()
    ) {
      try {
        const childSnap = await getDoc(
          doc(firestore, "users", uid, "children", docData.activeChildId),
        );
        if (childSnap.exists()) {
          const child = childSnap.data() as {
            archetype?: ChildArchetype | null;
            dob?: string | null;
            hasCompletedDay1Narrative?: boolean;
          };
          if (child.archetype) childArchetype = child.archetype;
          if (typeof child.dob === "string" && child.dob.trim()) {
            childBirthDate = child.dob.trim();
          }
          if (child.hasCompletedDay1Narrative === true) hasCompleted = true;
        }
      } catch {
        /* fall through to legacy root fields */
      }
    }

    return {
      hasCompleted,
      childArchetype,
      childBirthDate,
    };
  } catch {
    return { hasCompleted: false, childArchetype: null, childBirthDate: null };
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

// ─── Prologue Part 2 draft (uid-scoped, resumable) ───────────────────────────

export type ProloguePart2Step =
  | "name"
  | "nickname"
  | "birthdate"
  | "quick_check"
  | "result"
  | "prepare"
  | "sanctuary_intro";

export type ProloguePart2Draft = {
  draftId: string;
  currentStep: ProloguePart2Step;
  keeperName: string | null;
  childNickname: string | null;
  childBirthDate: string | null;
  archetype: QuickCheckArchetype | null;
  quickCheckTally: QuickCheckArchetype[];
  displayArchetypeName: string | null;
  tieOccurred: boolean;
  updatedAtIso: string;
};

const PART2_DRAFT_PREFIX = "@itp/prologue-part2-draft-v1:";
const PRE_AUTH_COMPLETE_KEY = "@itp/prologue-preauth-complete-v1";

function part2DraftKey(uid: string): string {
  return `${PART2_DRAFT_PREFIX}${uid}`;
}

function newDraftId(): string {
  return `p2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyProloguePart2Draft(
  existing?: Partial<ProloguePart2Draft> | null,
): ProloguePart2Draft {
  return {
    draftId: existing?.draftId ?? newDraftId(),
    currentStep: existing?.currentStep ?? "name",
    keeperName: existing?.keeperName ?? null,
    childNickname: existing?.childNickname ?? null,
    childBirthDate: existing?.childBirthDate ?? null,
    archetype: existing?.archetype ?? null,
    quickCheckTally: existing?.quickCheckTally ?? [],
    displayArchetypeName: existing?.displayArchetypeName ?? null,
    tieOccurred: existing?.tieOccurred ?? false,
    updatedAtIso: new Date().toISOString(),
  };
}

export async function getProloguePart2Draft(uid: string): Promise<ProloguePart2Draft | null> {
  try {
    const raw = await AsyncStorage.getItem(part2DraftKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProloguePart2Draft>;
    if (typeof parsed.draftId !== "string" || !parsed.draftId) return null;
    return createEmptyProloguePart2Draft(parsed);
  } catch {
    return null;
  }
}

export async function saveProloguePart2Draft(
  uid: string,
  patch: Partial<ProloguePart2Draft>,
): Promise<ProloguePart2Draft> {
  const current = (await getProloguePart2Draft(uid)) ?? createEmptyProloguePart2Draft();
  const next: ProloguePart2Draft = {
    ...current,
    ...patch,
    draftId: patch.draftId ?? current.draftId,
    quickCheckTally: patch.quickCheckTally ?? current.quickCheckTally,
    updatedAtIso: new Date().toISOString(),
  };
  await AsyncStorage.setItem(part2DraftKey(uid), JSON.stringify(next));
  return next;
}

export async function clearProloguePart2Draft(uid: string): Promise<void> {
  await AsyncStorage.removeItem(part2DraftKey(uid));
}

export async function markPreAuthPrologueComplete(): Promise<void> {
  await AsyncStorage.setItem(PRE_AUTH_COMPLETE_KEY, "1");
}

export async function hasCompletedPreAuthPrologue(): Promise<boolean> {
  const v = await AsyncStorage.getItem(PRE_AUTH_COMPLETE_KEY);
  return v === "1";
}
