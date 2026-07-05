import { HttpsError } from "firebase-functions/v2/https";

import { db } from "../../init";
import type { FishingRodId } from "./_sanctuaryTypes";
import { evaluateCraftableStates, mergeEvaluateResult } from "./evaluateCraftable";
import { emitAnalytics } from "./emitAnalytics";
import { captureLessonCompleted } from "../../analytics/posthogServer";
import {
  buildUserProgressionContext,
  ensureProgressionPlayerRodDocs,
  loadLessonProgress,
  loadPlayerRodRecords,
  playerRodRef,
  playerRodRecordToDoc,
  subscriptionCraftTierFromUser,
} from "./playerRodHelpers";
import { recordLessonCompletion, type RecordLessonCompletionInput } from "./recordLessonCompletion";

export type CompleteLessonReflectionRequest = RecordLessonCompletionInput & {
  prompts?: string[];
  ritualId?: string | null;
};

export type CompleteLessonReflectionResponse = {
  success: true;
  lessonId: string;
  alreadyCompleted: boolean;
  partsAwarded: number;
  wonderAwarded: number;
  depth: string;
  partsTotal: number;
  currentWonder: number;
  storedWonder: number;
  rodUnlocked: FishingRodId[];
  wildcardGifted: boolean;
  newlyCraftableRods: FishingRodId[];
};

export async function handleCompleteLessonReflection(
  uid: string,
  payload: CompleteLessonReflectionRequest,
): Promise<CompleteLessonReflectionResponse> {
  if (!payload.lessonId?.trim()) {
    throw new HttpsError("invalid-argument", "lessonId is required");
  }

  const completion = await recordLessonCompletion(uid, payload);

  await ensureProgressionPlayerRodDocs(uid);

  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const userData = (userSnap.data() ?? {}) as Record<string, unknown>;
  const lessonProgress = await loadLessonProgress(
    uid,
    userData as { completedLessons?: Record<string, boolean> },
  );
  const playerRods = await loadPlayerRodRecords(uid);
  const context = buildUserProgressionContext(userData, lessonProgress);

  const evaluateResult = evaluateCraftableStates({
    lessonProgress,
    playerRods,
    subscriptionTier: context.subscriptionTier,
    inventory: {
      parts: context.parts,
      storedWonder: context.storedWonder,
    },
  });

  if (evaluateResult.transitions.length > 0) {
    const batch = db.batch();
    const merged = mergeEvaluateResult(playerRods, evaluateResult);
    for (const transition of evaluateResult.transitions) {
      const record = merged[transition.rodId];
      if (!record) continue;
      batch.set(playerRodRef(uid, transition.rodId), playerRodRecordToDoc(record), { merge: true });
    }
    await batch.commit();
  }

  await emitAnalytics(uid, {
    type: "lesson_completed",
    userId: uid,
    lessonId: payload.lessonId,
    partsAwarded: completion.partsAwarded,
    wonderAwarded: completion.wonderAwarded,
    depth: completion.depth,
    clusterCompleted: completion.clusterCompleted,
    clusterModuleId: completion.clusterModuleId,
    rodUnlocked: evaluateResult.rodUnlocked,
    wildcardGifted: evaluateResult.wildcardGifted,
    timestamp: Date.now(),
  });

  if (!completion.alreadyCompleted) {
    await captureLessonCompleted({
      uid,
      lessonId: payload.lessonId,
      moduleId: completion.clusterModuleId,
      timestamp: Date.now(),
    });
  }

  if (evaluateResult.rodUnlocked.length > 0) {
    for (const rodId of evaluateResult.rodUnlocked) {
      await emitAnalytics(uid, {
        type: "rod_unlocked",
        userId: uid,
        rodId,
        lessonId: payload.lessonId,
        timestamp: Date.now(),
      });
    }
  }

  return {
    success: true,
    lessonId: payload.lessonId,
    alreadyCompleted: completion.alreadyCompleted,
    partsAwarded: completion.partsAwarded,
    wonderAwarded: completion.wonderAwarded,
    depth: completion.depth,
    partsTotal: completion.partsTotal,
    currentWonder: completion.currentWonder,
    storedWonder: completion.storedWonder,
    rodUnlocked: evaluateResult.rodUnlocked,
    wildcardGifted: evaluateResult.wildcardGifted,
    newlyCraftableRods: evaluateResult.rodUnlocked,
  };
}
