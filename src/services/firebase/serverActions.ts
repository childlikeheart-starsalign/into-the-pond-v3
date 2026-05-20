import { httpsCallable } from "firebase/functions";

import { functions } from "@/src/services/firebase/client";

function ensureSignedIn(uid: string | null | undefined) {
  if (!uid) throw new Error("Sign in required.");
}

export async function submitDiaryEntry(uid: string, payload: Record<string, unknown>) {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "submitDiaryEntry");
  const result = await callable(payload);
  return result.data as { success: boolean; wonderAwarded?: number };
}

export async function createWellQuestion(uid: string, payload: Record<string, unknown>) {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "createWellQuestion");
  const result = await callable(payload);
  return result.data as { success: boolean; questionId?: string };
}

export async function createCast(uid: string, payload: Record<string, unknown>) {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "createCast");
  const result = await callable(payload);
  return result.data as { success: boolean; castId?: string };
}

export async function claimCast(uid: string, payload: Record<string, unknown>) {
  ensureSignedIn(uid);
  const callable = httpsCallable(functions, "claimCast");
  const result = await callable(payload);
  return result.data as { success: boolean; rewardWonder?: number };
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
