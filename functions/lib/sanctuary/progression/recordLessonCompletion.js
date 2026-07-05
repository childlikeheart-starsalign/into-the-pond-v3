"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordLessonCompletion = recordLessonCompletion;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const init_1 = require("../../init");
const commitEconomyAction_1 = require("../economy/commitEconomyAction");
const economy_1 = require("../economy");
const resolveCallableIdempotency_1 = require("../economy/resolveCallableIdempotency");
const wonderRules_1 = require("../wonderRules");
const wonderEconomy_1 = require("../wonderEconomy");
const partsAwards_1 = require("./partsAwards");
const playerRodHelpers_1 = require("./playerRodHelpers");
async function recordLessonCompletion(uid, input) {
  const lessonId = input.lessonId?.trim();
  if (!lessonId) {
    throw new https_1.HttpsError("invalid-argument", "lessonId is required");
  }
  const source = input.source ?? "lesson";
  const answers = input.answers ?? [];
  const depth = input.depth ?? (0, wonderRules_1.inferDiaryDepth)(answers, source);
  const now = Date.now();
  const userRef = init_1.db.collection("users").doc(uid);
  const lessonProgressRef = userRef.collection("lessonProgress").doc(lessonId);
  const idempotencyKey = (0, economy_1.lessonCompleteKey)(lessonId);
  const transactionId = `tx_lesson_${lessonId}`;
  const preLessonProgress = await (0, playerRodHelpers_1.loadLessonProgress)(uid, {});
  const alreadyCompleted = (0, partsAwards_1.isLessonCompleted)(preLessonProgress, lessonId);
  if (alreadyCompleted) {
    const userSnap = await userRef.get();
    const userData = userSnap.data() ?? {};
    const inventory = userData.inventory ?? {};
    const account = (0, wonderEconomy_1.wonderAccountFromDoc)(uid, userData);
    return {
      alreadyCompleted: true,
      partsAwarded: 0,
      wonderAwarded: 0,
      depth,
      partsTotal: inventory.parts ?? 0,
      currentWonder: account.currentWonder,
      storedWonder: account.storedWonder,
      clusterCompleted: false,
      clusterModuleId: null,
    };
  }
  const partsBreakdown = (0, partsAwards_1.computePartsAwardForLessonCompletion)({
    lessonId,
    lessonProgress: preLessonProgress,
    now,
  });
  const rule = wonderRules_1.DIARY_WONDER_BY_DEPTH[depth];
  const wonderAwarded = (0, wonderRules_1.wonderAmountForRule)(
    rule,
    `${uid}:${lessonId}:${answers.join("|")}:${depth}`,
  );
  const result = await init_1.db.runTransaction(async (tx) => {
    const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return idemRead.response;
    }
    const userSnap = await tx.get(userRef);
    const lessonSnap = await tx.get(lessonProgressRef);
    const userData = userSnap.data() ?? {};
    const lessonData = lessonSnap.data();
    if (lessonData?.completed === true) {
      const inventory = userData.inventory ?? {};
      const account = (0, wonderEconomy_1.wonderAccountFromDoc)(uid, userData);
      return {
        alreadyCompleted: true,
        partsAwarded: 0,
        wonderAwarded: 0,
        partsTotal: inventory.parts ?? 0,
        currentWonder: account.currentWonder,
        storedWonder: account.storedWonder,
        clusterCompleted: false,
        clusterModuleId: null,
      };
    }
    const economyCommit = await (0, commitEconomyAction_1.commitEconomyAction)({
      tx,
      userRef,
      uid,
      idempotencyKey,
      actionType: "lesson_complete",
      touchReflection: false,
      idempotencyMiss: { hit: false },
      build: ({ account, userData: freshUserData }) => {
        const inventory = freshUserData.inventory ?? {};
        const partsBefore = inventory.parts ?? 0;
        const partsTotal = partsBefore + partsBreakdown.total;
        const { transaction } = (0, economy_1.applyWonderEarnInMemory)(account, {
          source: rule.source,
          amount: wonderAwarded,
          transactionId,
          metadata: { lessonId, depth },
        });
        const entry = (0, economy_1.buildEconomyLedgerEntry)({
          uid,
          actionType: "lesson_complete",
          source: rule.source,
          transaction,
          idempotencyKey,
          metadata: { lessonId, depth },
          deltaParts: partsBreakdown.total,
        });
        return {
          entry,
          additionalUserPatch: {
            completedLessons: { [lessonId]: true },
          },
          response: {
            alreadyCompleted: false,
            partsAwarded: partsBreakdown.total,
            wonderAwarded,
            partsTotal,
            currentWonder: account.currentWonder + wonderAwarded,
            storedWonder: account.storedWonder + wonderAwarded,
            clusterCompleted: partsBreakdown.clusterCompleted,
            clusterModuleId: partsBreakdown.clusterModuleId,
          },
        };
      },
    });
    if (economyCommit.committed) {
      tx.set(
        lessonProgressRef,
        {
          lessonId,
          completed: true,
          completedAt: firestore_1.Timestamp.fromMillis(now),
          lastOpenedAt: firestore_1.Timestamp.fromMillis(now),
        },
        { merge: true },
      );
      const diaryDocId = (0, economy_1.idempotencyDocId)(`lesson_diary:${lessonId}`);
      tx.set(userRef.collection("diaryEntries").doc(diaryDocId), {
        entryId: diaryDocId,
        userId: uid,
        lessonId,
        source,
        depth,
        prompts: (input.prompts ?? []).map((question, index) => ({
          promptId: `prompt-${index + 1}`,
          question,
          response: answers[index] ?? "",
        })),
        answers,
        status: "completed",
        wonderAwarded,
        plantStage: 1,
        ritualId: input.ritualId ?? null,
        createdAt: firestore_1.Timestamp.now(),
        updatedAt: firestore_1.Timestamp.now(),
      });
    }
    return economyCommit.result;
  });
  return {
    ...result,
    depth,
  };
}
