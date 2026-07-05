"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCompleteLessonReflection = handleCompleteLessonReflection;
const https_1 = require("firebase-functions/v2/https");
const init_1 = require("../../init");
const evaluateCraftable_1 = require("./evaluateCraftable");
const emitAnalytics_1 = require("./emitAnalytics");
const posthogServer_1 = require("../../analytics/posthogServer");
const playerRodHelpers_1 = require("./playerRodHelpers");
const recordLessonCompletion_1 = require("./recordLessonCompletion");
async function handleCompleteLessonReflection(uid, payload) {
  if (!payload.lessonId?.trim()) {
    throw new https_1.HttpsError("invalid-argument", "lessonId is required");
  }
  const completion = await (0, recordLessonCompletion_1.recordLessonCompletion)(uid, payload);
  await (0, playerRodHelpers_1.ensureProgressionPlayerRodDocs)(uid);
  const userRef = init_1.db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data() ?? {};
  const lessonProgress = await (0, playerRodHelpers_1.loadLessonProgress)(uid, userData);
  const playerRods = await (0, playerRodHelpers_1.loadPlayerRodRecords)(uid);
  const context = (0, playerRodHelpers_1.buildUserProgressionContext)(userData, lessonProgress);
  const evaluateResult = (0, evaluateCraftable_1.evaluateCraftableStates)({
    lessonProgress,
    playerRods,
    subscriptionTier: context.subscriptionTier,
    inventory: {
      parts: context.parts,
      storedWonder: context.storedWonder,
    },
  });
  if (evaluateResult.transitions.length > 0) {
    const batch = init_1.db.batch();
    const merged = (0, evaluateCraftable_1.mergeEvaluateResult)(playerRods, evaluateResult);
    for (const transition of evaluateResult.transitions) {
      const record = merged[transition.rodId];
      if (!record) continue;
      batch.set(
        (0, playerRodHelpers_1.playerRodRef)(uid, transition.rodId),
        (0, playerRodHelpers_1.playerRodRecordToDoc)(record),
        { merge: true },
      );
    }
    await batch.commit();
  }
  await (0, emitAnalytics_1.emitAnalytics)(uid, {
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
    await (0, posthogServer_1.captureLessonCompleted)({
      uid,
      lessonId: payload.lessonId,
      moduleId: completion.clusterModuleId,
      timestamp: Date.now(),
    });
  }
  if (evaluateResult.rodUnlocked.length > 0) {
    for (const rodId of evaluateResult.rodUnlocked) {
      await (0, emitAnalytics_1.emitAnalytics)(uid, {
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
