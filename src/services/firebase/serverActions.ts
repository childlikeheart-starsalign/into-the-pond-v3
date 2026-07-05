import AsyncStorage from "@react-native-async-storage/async-storage";
import { httpsCallable } from "firebase/functions";

import type {
  CraftBaitResponse,
  CompletePracticeResponse,
  FishingClaimClientSummary,
  SubmitDiaryEntryResponse,
} from "@/shared/sanctuary/economy/callableResponses";
import { functions } from "@/src/services/firebase/client";

import type {
  GetOrAssignTodaysQuestionResponse,
  RerollWellQuestionResponse,
  SubmitWellReflectionResponse,
} from "@/src/services/firebase/types";

function createClientRequestId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

const BAIT_REQUEST_ID_PREFIX = "fishing:bait-request:";

async function getOrCreateBaitRequestId(uid: string, tier: string): Promise<string> {
  const key = `${BAIT_REQUEST_ID_PREFIX}${uid}:${tier}`;
  const existing = await AsyncStorage.getItem(key);
  if (existing) return existing;
  const requestId = createClientRequestId("bait");
  await AsyncStorage.setItem(key, requestId);
  return requestId;
}

async function clearBaitRequestId(uid: string, tier: string): Promise<void> {
  await AsyncStorage.removeItem(`${BAIT_REQUEST_ID_PREFIX}${uid}:${tier}`);
}

function ensureSignedIn(uid: string | null | undefined) {
  if (!uid) throw new Error("Sign in required.");
}

/** Unauthenticated — used before sign-in to route login artboard errors (22 vs 23). */
export async function checkSignInEmailRegistered(email: string): Promise<boolean> {
  const callable = httpsCallable<{ email: string }, { registered: boolean }>(
    functions,
    "checkSignInEmailRegistered",
  );
  const result = await callable({ email: email.trim() });
  return result.data.registered === true;
}

export async function ensureWellState(uid: string) {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "ensureWellState");
  const result = await callable({});
  return result.data as { success: true; alreadyExisted: boolean };
}

export async function getOrAssignTodaysWellQuestion(
  uid: string,
  localDate: string,
): Promise<GetOrAssignTodaysQuestionResponse> {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "getOrAssignTodaysQuestion");
  const result = await callable({ localDate });
  return result.data as GetOrAssignTodaysQuestionResponse;
}

export async function submitWellReflection(
  uid: string,
  payload: {
    questionId: string;
    reflectionText: string;
    headline?: string | null;
    localDate: string;
  },
): Promise<SubmitWellReflectionResponse> {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "submitWellReflection");
  const result = await callable(payload);
  return result.data as SubmitWellReflectionResponse;
}

export async function rerollWellQuestion(
  uid: string,
  localDate: string,
  requestId?: string,
): Promise<RerollWellQuestionResponse> {
  ensureSignedIn(uid);
  const stableRequestId = requestId ?? createClientRequestId("well_reroll");
  const callable = httpsCallable(functions, "rerollWellQuestion");
  const result = await callable({ localDate, requestId: stableRequestId });
  return result.data as RerollWellQuestionResponse;
}

export type ServerClaimSummary = FishingClaimClientSummary & {
  materialsAwarded: number;
};

export async function submitDiaryEntry(
  uid: string,
  payload: Record<string, unknown>,
): Promise<SubmitDiaryEntryResponse> {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "submitDiaryEntry");
  const result = await callable(payload);
  return result.data as SubmitDiaryEntryResponse;
}

export async function completePractice(
  uid: string,
  payload: { kind: string; note?: string; localDate?: string },
): Promise<CompletePracticeResponse> {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "completePractice");
  const result = await callable(payload);
  return result.data as CompletePracticeResponse;
}

export async function initializeSanctuary(
  uid: string,
  payload: { requestId: string },
): Promise<{ status: "success" | "already_initialized"; sanctuaryInitialized: boolean }> {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "initializeSanctuary");
  const result = await callable({ requestId: payload.requestId });
  return result.data as {
    status: "success" | "already_initialized";
    sanctuaryInitialized: boolean;
  };
}

export async function craftBait(
  uid: string,
  payload: { tier: "basic" | "rare" | "epic"; requestId?: string },
): Promise<CraftBaitResponse> {
  ensureSignedIn(uid);
  const requestId = payload.requestId ?? (await getOrCreateBaitRequestId(uid, payload.tier));
  const callable = httpsCallable(functions, "craftBait");
  const result = await callable({ tier: payload.tier, requestId });
  await clearBaitRequestId(uid, payload.tier);
  return result.data as CraftBaitResponse;
}

export async function createCast(
  uid: string,
  payload: Record<string, unknown> & { requestId?: string },
) {
  ensureSignedIn(uid);
  const requestId = payload.requestId ?? createClientRequestId("cast");
  const callable = httpsCallable(functions, "createCast");
  const result = await callable({ ...payload, requestId });
  return result.data as { success: boolean; castId?: string; readyAt?: number };
}

export async function claimCast(uid: string, payload: Record<string, unknown>) {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "claimCast");
  const result = await callable(payload);
  return result.data as { success: boolean; claim?: ServerClaimSummary };
}

export type StartCraftResult = {
  success: true;
  rodId: string;
  state: "crafting";
  craftStartedAt: number;
  craftCompletesAt: number;
  wonderInvested: number;
  partsSpent: number;
  partsRemaining: number;
  storedWonderRemaining: number;
};

export async function startCraft(uid: string, rodId: string): Promise<StartCraftResult> {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "startCraft");
  const result = await callable({ rodId });
  return result.data as StartCraftResult;
}

export type CollectCraftResult = {
  success: true;
  rodId: string;
  state: "ready";
};

export async function collectCraft(uid: string, rodId: string): Promise<CollectCraftResult> {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "collectCraft");
  const result = await callable({ rodId });
  return result.data as CollectCraftResult;
}

export type EquipRodResult = {
  success: true;
  rodId: string;
  state: "equipped";
  equippedRodId: string;
  hoursToCollect?: number;
};

export async function equipRod(
  uid: string,
  rodId: string,
  options?: { collectedThisBenchSession?: boolean },
): Promise<EquipRodResult> {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "equipRod");
  const result = await callable({
    rodId,
    ...(options?.collectedThisBenchSession != null
      ? { collectedThisBenchSession: options.collectedThisBenchSession }
      : {}),
  });
  return result.data as EquipRodResult;
}

export type CompleteLessonReflectionResult = {
  success: true;
  lessonId: string;
  alreadyCompleted: boolean;
  partsAwarded: number;
  wonderAwarded: number;
  depth: string;
  partsTotal: number;
  currentWonder: number;
  storedWonder: number;
  rodUnlocked: string[];
  wildcardGifted: boolean;
  newlyCraftableRods: string[];
};

export async function completeLessonReflection(
  uid: string,
  payload: {
    lessonId: string;
    prompts?: string[];
    answers: string[];
    source?: "lesson" | "reignite" | "free";
    depth?: "short" | "deep" | "full_deep";
    ritualId?: string | null;
  },
): Promise<CompleteLessonReflectionResult> {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "completeLessonReflection");
  const result = await callable(payload);
  return result.data as CompleteLessonReflectionResult;
}

export type GetRodProgressionResult = {
  success: true;
  playerRods: Record<string, unknown>;
  parts: number;
  storedWonder: number;
};

export async function getRodProgression(uid: string): Promise<GetRodProgressionResult> {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "getRodProgression");
  const result = await callable({});
  return result.data as GetRodProgressionResult;
}

export async function requestSubscriptionSync(uid: string) {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "syncSubscriptionStatus");
  const result = await callable();
  return result.data as {
    success: boolean;
    mismatchDetected: boolean;
    activeRod: "basic" | "wooden" | "fiberglass";
    subscriptionStatus: "free" | "wooden" | "fiberglass";
  };
}
