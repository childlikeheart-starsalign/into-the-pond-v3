import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import { db } from "../../init";
import { commitEconomyAction } from "../economy/commitEconomyAction";
import {
  applyWonderEarnInMemory,
  buildEconomyLedgerEntry,
  idempotencyDocId,
  lessonCompleteKey,
} from "../economy";
import { readIdempotencyInTransaction } from "../economy/resolveCallableIdempotency";
import { DIARY_WONDER_BY_DEPTH, inferDiaryDepth, wonderAmountForRule } from "../wonderRules";
import { wonderAccountFromDoc } from "../wonderEconomy";
import type { DiaryReflectionDepth } from "../types";
import { computePartsAwardForLessonCompletion, isLessonCompleted } from "./partsAwards";
import { loadLessonProgress } from "./playerRodHelpers";

export type RecordLessonCompletionInput = {
  lessonId: string;
  answers: string[];
  source?: "lesson" | "reignite" | "free";
  depth?: DiaryReflectionDepth;
  prompts?: string[];
  ritualId?: string | null;
};

export type RecordLessonCompletionResult = {
  alreadyCompleted: boolean;
  partsAwarded: number;
  wonderAwarded: number;
  depth: DiaryReflectionDepth;
  partsTotal: number;
  currentWonder: number;
  storedWonder: number;
  clusterCompleted: boolean;
  clusterModuleId: number | null;
};

type LessonCompletionEconomyResponse = Omit<RecordLessonCompletionResult, "depth">;

export async function recordLessonCompletion(
  uid: string,
  input: RecordLessonCompletionInput,
): Promise<RecordLessonCompletionResult> {
  const lessonId = input.lessonId?.trim();
  if (!lessonId) {
    throw new HttpsError("invalid-argument", "lessonId is required");
  }

  const source = input.source ?? "lesson";
  const answers = input.answers ?? [];
  const depth = input.depth ?? inferDiaryDepth(answers, source);
  const now = Date.now();

  const userRef = db.collection("users").doc(uid);
  const lessonProgressRef = userRef.collection("lessonProgress").doc(lessonId);
  const idempotencyKey = lessonCompleteKey(lessonId);
  const transactionId = `tx_lesson_${lessonId}`;

  const preLessonProgress = await loadLessonProgress(uid, {});
  const alreadyCompleted = isLessonCompleted(preLessonProgress, lessonId);

  if (alreadyCompleted) {
    const userSnap = await userRef.get();
    const userData = (userSnap.data() ?? {}) as Record<string, unknown>;
    const inventory = (userData.inventory as { parts?: number } | undefined) ?? {};
    const account = wonderAccountFromDoc(uid, userData);
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

  const partsBreakdown = computePartsAwardForLessonCompletion({
    lessonId,
    lessonProgress: preLessonProgress,
    now,
  });

  const rule = DIARY_WONDER_BY_DEPTH[depth];
  const wonderAwarded = wonderAmountForRule(
    rule,
    `${uid}:${lessonId}:${answers.join("|")}:${depth}`,
  );

  const result = await db.runTransaction(async (tx) => {
    const idemRead = await readIdempotencyInTransaction<LessonCompletionEconomyResponse>(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return idemRead.response;
    }

    const userSnap = await tx.get(userRef);
    const lessonSnap = await tx.get(lessonProgressRef);
    const userData = (userSnap.data() ?? {}) as Record<string, unknown>;

    const lessonData = lessonSnap.data() as
      | { completed?: boolean; completedAt?: Timestamp | null }
      | undefined;
    if (lessonData?.completed === true) {
      const inventory = (userData.inventory as { parts?: number } | undefined) ?? {};
      const account = wonderAccountFromDoc(uid, userData);
      return {
        alreadyCompleted: true,
        partsAwarded: 0,
        wonderAwarded: 0,
        partsTotal: inventory.parts ?? 0,
        currentWonder: account.currentWonder,
        storedWonder: account.storedWonder,
        clusterCompleted: false,
        clusterModuleId: null as number | null,
      };
    }

    const economyCommit = await commitEconomyAction<LessonCompletionEconomyResponse>({
      tx,
      userRef,
      uid,
      idempotencyKey,
      actionType: "lesson_complete",
      touchReflection: false,
      idempotencyMiss: { hit: false },
      build: ({ account, userData: freshUserData }) => {
        const inventory = (freshUserData.inventory as { parts?: number } | undefined) ?? {};
        const partsBefore = inventory.parts ?? 0;
        const partsTotal = partsBefore + partsBreakdown.total;

        const { transaction } = applyWonderEarnInMemory(account, {
          source: rule.source,
          amount: wonderAwarded,
          transactionId,
          metadata: { lessonId, depth },
        });

        const entry = buildEconomyLedgerEntry({
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
          completedAt: Timestamp.fromMillis(now),
          lastOpenedAt: Timestamp.fromMillis(now),
        },
        { merge: true },
      );

      const diaryDocId = idempotencyDocId(`lesson_diary:${lessonId}`);
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
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    return economyCommit.result;
  });

  return {
    ...result,
    depth,
  };
}
