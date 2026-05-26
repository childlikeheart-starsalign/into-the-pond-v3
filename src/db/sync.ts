import { Q } from "@nozbe/watermelondb";
import {
  doc,
  onSnapshot,
  QuerySnapshot,
  collection,
  orderBy,
  query,
  DocumentData,
} from "firebase/firestore";

import { database } from "@/src/db";
import { LocalCompletedLesson } from "@/src/db/models/LocalCompletedLesson";
import { LocalCreature } from "@/src/db/models/LocalCreature";
import { LocalDiaryEntry } from "@/src/db/models/LocalDiaryEntry";
import { LocalInventory } from "@/src/db/models/LocalInventory";
import { LocalLessonAccess } from "@/src/db/models/LocalLessonAccess";
import { LocalLesson } from "@/src/db/models/LocalLesson";
import { LocalUserProfile } from "@/src/db/models/LocalUserProfile";
import { LocalWellQuestion } from "@/src/db/models/LocalWellQuestion";
import { buildLessonAccessRows } from "@/src/services/classroom/lessonAccess";
import { firestore } from "@/src/services/firebase/client";
import {
  CreatureDoc,
  DEFAULT_USER_DOC,
  DiaryEntryDoc,
  LessonDoc,
  SubscriptionStatus,
  UserDoc,
} from "@/src/services/firebase/types";

async function getCompletedLessonsMap(uid: string) {
  const table = database.get<LocalCompletedLesson>("local_completed_lessons");
  const rows = await table.query(Q.where("uid", uid)).fetch();
  const out: Record<string, boolean> = {};
  for (const row of rows) {
    out[row.lessonId] = row.isCompleted;
  }
  return out;
}

async function getSubscriptionStatus(uid: string): Promise<SubscriptionStatus> {
  const table = database.get<LocalUserProfile>("local_user_profile");
  const rows = await table.query(Q.where("uid", uid)).fetch();
  return (rows[0]?.subscriptionStatus as SubscriptionStatus | undefined) ?? "free";
}

export async function rebuildLessonAccessCache(uid: string) {
  const lessonsTable = database.get<LocalLesson>("local_lessons");
  const accessTable = database.get<LocalLessonAccess>("lesson_access");
  const lessons = await lessonsTable.query(Q.sortBy("lesson_order", Q.asc)).fetch();
  const completedMap = await getCompletedLessonsMap(uid);
  const subscriptionStatus = await getSubscriptionStatus(uid);
  const rows = buildLessonAccessRows(lessons, completedMap, subscriptionStatus);

  await database.write(async () => {
    for (const row of rows) {
      const existing = await accessTable
        .query(Q.where("uid", uid), Q.where("lesson_id", row.lessonId))
        .fetch();
      const current = existing[0];
      if (current) {
        await current.update((entry) => {
          entry.isUnlocked = row.isUnlocked;
          entry.isCompleted = row.isCompleted;
          entry.isPlaceholder = row.isPlaceholder;
          entry.requiresPaywall = row.requiresPaywall;
        });
      } else {
        await accessTable.create((entry) => {
          entry.uid = uid;
          entry.lessonId = row.lessonId;
          entry.isUnlocked = row.isUnlocked;
          entry.isCompleted = row.isCompleted;
          entry.isPlaceholder = row.isPlaceholder;
          entry.requiresPaywall = row.requiresPaywall;
        });
      }
    }
  });
}

async function upsertUserProfile(uid: string, data: UserDoc) {
  await database.write(async () => {
    const table = database.get<LocalUserProfile>("local_user_profile");
    const existing = await table.query(Q.where("uid", uid)).fetch();
    const row = existing[0];
    if (row) {
      await row.update((entry) => {
        entry.email = data.email;
        entry.totalWonder = data.totalWonder;
        entry.dailyQuestionCount = data.dailyQuestionCount;
        entry.fishingWonderToday = data.fishingWonderToday;
        entry.activeRod = data.activeRod;
        entry.rodDullnessCount = data.rodDullnessCount;
        entry.isRodDull = data.isRodDull;
        entry.subscriptionProductId = data.subscription?.productId ?? null;
        entry.subscriptionExpiryTs = data.subscription?.expiryDate?.toMillis?.() ?? null;
        entry.subscriptionIsLifetime = data.subscription?.isLifetime ?? false;
        entry.subscriptionStatus = data.subscription?.subscriptionStatus ?? "free";
      });
    } else {
      await table.create((entry) => {
        entry.uid = uid;
        entry.email = data.email;
        entry.totalWonder = data.totalWonder;
        entry.dailyQuestionCount = data.dailyQuestionCount;
        entry.fishingWonderToday = data.fishingWonderToday;
        entry.activeRod = data.activeRod;
        entry.rodDullnessCount = data.rodDullnessCount;
        entry.isRodDull = data.isRodDull;
        entry.subscriptionProductId = data.subscription?.productId ?? null;
        entry.subscriptionExpiryTs = data.subscription?.expiryDate?.toMillis?.() ?? null;
        entry.subscriptionIsLifetime = data.subscription?.isLifetime ?? false;
        entry.subscriptionStatus = data.subscription?.subscriptionStatus ?? "free";
      });
    }
  });
}

async function upsertInventory(uid: string, data: UserDoc) {
  await database.write(async () => {
    const table = database.get<LocalInventory>("local_inventory");
    const existing = await table.query(Q.where("uid", uid)).fetch();
    const row = existing[0];
    const inventory = data.inventory ?? DEFAULT_USER_DOC.inventory;
    if (row) {
      await row.update((entry) => {
        entry.parts = inventory.parts;
        entry.featherBait = inventory.baits.feather_bait;
        entry.scaleBait = inventory.baits.scale_bait;
        entry.glimmerdustBait = inventory.baits.glimmerdust_bait;
        entry.randomBait = inventory.baits.random_bait;
        entry.feather = inventory.baitMaterials.feather;
        entry.scale = inventory.baitMaterials.scale;
        entry.glimmerdust = inventory.baitMaterials.glimmerdust;
      });
    } else {
      await table.create((entry) => {
        entry.uid = uid;
        entry.parts = inventory.parts;
        entry.featherBait = inventory.baits.feather_bait;
        entry.scaleBait = inventory.baits.scale_bait;
        entry.glimmerdustBait = inventory.baits.glimmerdust_bait;
        entry.randomBait = inventory.baits.random_bait;
        entry.feather = inventory.baitMaterials.feather;
        entry.scale = inventory.baitMaterials.scale;
        entry.glimmerdust = inventory.baitMaterials.glimmerdust;
      });
    }
  });
}

async function upsertCompletedLessons(uid: string, completed: Record<string, boolean>) {
  await database.write(async () => {
    const table = database.get<LocalCompletedLesson>("local_completed_lessons");
    for (const [lessonId, isCompleted] of Object.entries(completed)) {
      const existing = await table
        .query(Q.where("uid", uid), Q.where("lesson_id", lessonId))
        .fetch();
      const row = existing[0];
      if (row) {
        await row.update((entry) => {
          entry.isCompleted = isCompleted;
        });
      } else {
        await table.create((entry) => {
          entry.uid = uid;
          entry.lessonId = lessonId;
          entry.isCompleted = isCompleted;
        });
      }
    }
  });
}

export function subscribeAndCacheUserProfile(uid: string) {
  return onSnapshot(doc(firestore, "users", uid), async (snapshot) => {
    const data = snapshot.data() as UserDoc | undefined;
    if (!data) return;
    await upsertUserProfile(uid, data);
    await upsertInventory(uid, data);
    await upsertCompletedLessons(uid, data.completedLessons ?? {});
    await rebuildLessonAccessCache(uid);
  });
}

async function upsertWellQuestions(uid: string, snapshot: QuerySnapshot<DocumentData>) {
  await database.write(async () => {
    const table = database.get<LocalWellQuestion>("local_well_questions");
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as {
        questionText: string;
        answerText?: string;
        createdAt?: { toMillis(): number };
        answeredAt?: { toMillis(): number };
      };
      const existing = await table
        .query(Q.where("uid", uid), Q.where("question_id", docSnap.id))
        .fetch();
      const row = existing[0];
      const createdAtMs = data.createdAt?.toMillis?.() ?? Date.now();
      if (row) {
        await row.update((entry) => {
          entry.questionText = data.questionText;
          entry.answerText = data.answerText ?? null;
          entry.answeredAtMs = data.answeredAt?.toMillis?.() ?? null;
        });
      } else {
        await table.create((entry) => {
          entry.uid = uid;
          entry.questionId = docSnap.id;
          entry.questionText = data.questionText;
          entry.answerText = data.answerText ?? null;
          entry.createdAt = new Date(createdAtMs);
          entry.answeredAtMs = data.answeredAt?.toMillis?.() ?? null;
        });
      }
    }
  });
}

export function subscribeAndCacheWellQuestions(uid: string) {
  const ref = query(
    collection(firestore, "users", uid, "wellQuestions"),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(ref, async (snapshot) => {
    await upsertWellQuestions(uid, snapshot);
  });
}

export function subscribeAndCacheLessons(uid?: string) {
  const ref = query(collection(firestore, "lessons"), orderBy("order", "asc"));
  return onSnapshot(ref, async (snapshot) => {
    await database.write(async () => {
      const table = database.get<LocalLesson>("local_lessons");
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as LessonDoc;
        const existing = await table.query(Q.where("lesson_id", data.lessonId)).fetch();
        const row = existing[0];
        if (row) {
          await row.update((entry) => {
            entry.lessonOrder = data.order;
            entry.module = data.module;
            entry.title = data.title;
            entry.content = data.content;
            entry.videoUrl = data.videoUrl;
            entry.commitmentMessage = data.commitmentMessage;
            entry.diaryPromptsJson = JSON.stringify(data.diaryPrompts ?? []);
            entry.isPlaceholder = !!data.isPlaceholder;
          });
        } else {
          await table.create((entry) => {
            entry.lessonId = data.lessonId;
            entry.lessonOrder = data.order;
            entry.module = data.module;
            entry.title = data.title;
            entry.content = data.content;
            entry.videoUrl = data.videoUrl;
            entry.commitmentMessage = data.commitmentMessage;
            entry.diaryPromptsJson = JSON.stringify(data.diaryPrompts ?? []);
            entry.isPlaceholder = !!data.isPlaceholder;
          });
        }
      }
    });
    if (uid) {
      await rebuildLessonAccessCache(uid);
    }
  });
}

async function upsertDiaryEntries(uid: string, snapshot: QuerySnapshot<DocumentData>) {
  await database.write(async () => {
    const table = database.get<LocalDiaryEntry>("local_diary_entries");
    for (const change of snapshot.docChanges()) {
      const docSnap = change.doc;
      const existing = await table
        .query(Q.where("uid", uid), Q.where("entry_id", docSnap.id))
        .fetch();
      const row = existing[0];

      if (change.type === "removed") {
        if (row) await row.markAsDeleted();
        continue;
      }

      const data = docSnap.data() as DiaryEntryDoc;
      const promptsJson = JSON.stringify(data.prompts ?? []);
      const answersJson = JSON.stringify(data.answers ?? []);
      const createdAtMs = data.createdAt?.toMillis?.() ?? Date.now();

      if (row) {
        await row.update((entry) => {
          entry.lessonId = data.lessonId ?? null;
          entry.source = data.source;
          entry.promptsJson = promptsJson;
          entry.answersJson = answersJson;
          entry.status = data.status;
          entry.wonderAwarded = data.wonderAwarded ?? 0;
          entry.plantStage = data.plantStage ?? 0;
          entry.queueStatus = "synced";
          entry.createdAt = new Date(createdAtMs);
        });
      } else {
        await table.create((entry) => {
          entry.entryId = docSnap.id;
          entry.uid = uid;
          entry.lessonId = data.lessonId ?? null;
          entry.source = data.source;
          entry.promptsJson = promptsJson;
          entry.answersJson = answersJson;
          entry.status = data.status;
          entry.wonderAwarded = data.wonderAwarded ?? 0;
          entry.plantStage = data.plantStage ?? 0;
          entry.queueStatus = "synced";
          entry.createdAt = new Date(createdAtMs);
        });
      }
    }
  });
}

export function subscribeAndCacheDiaryEntries(uid: string) {
  const ref = query(
    collection(firestore, "users", uid, "diaryEntries"),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(ref, async (snapshot) => {
    await upsertDiaryEntries(uid, snapshot);
    await rebuildLessonAccessCache(uid);
  });
}

async function upsertCreatures(uid: string, snapshot: QuerySnapshot<DocumentData>) {
  await database.write(async () => {
    const table = database.get<LocalCreature>("local_creatures");
    for (const change of snapshot.docChanges()) {
      const docSnap = change.doc;
      const existing = await table
        .query(Q.where("uid", uid), Q.where("creature_id", docSnap.id))
        .fetch();
      const row = existing[0];

      if (change.type === "removed") {
        if (row) await row.markAsDeleted();
        continue;
      }

      const data = docSnap.data() as CreatureDoc;
      const caughtAtMs = data.caughtAt?.toMillis?.() ?? Date.now();
      if (row) {
        await row.update((entry) => {
          entry.name = data.name;
          entry.rarity = data.rarity;
          entry.caughtAt = new Date(caughtAtMs);
        });
      } else {
        await table.create((entry) => {
          entry.uid = uid;
          entry.creatureId = docSnap.id;
          entry.name = data.name;
          entry.rarity = data.rarity;
          entry.caughtAt = new Date(caughtAtMs);
        });
      }
    }
  });
}

export function subscribeAndCacheCreatures(uid: string) {
  const ref = query(collection(firestore, "users", uid, "creatures"), orderBy("caughtAt", "desc"));
  return onSnapshot(ref, async (snapshot) => {
    await upsertCreatures(uid, snapshot);
  });
}
