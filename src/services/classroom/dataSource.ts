import { Q } from "@nozbe/watermelondb";

import { database } from "@/src/db";
import { LocalCompletedLesson } from "@/src/db/models/LocalCompletedLesson";
import { LocalLessonAccess } from "@/src/db/models/LocalLessonAccess";
import { LocalLesson } from "@/src/db/models/LocalLesson";
import { LocalUserProfile } from "@/src/db/models/LocalUserProfile";
import { buildLessonAccessRows, LessonAccessRow } from "@/src/services/classroom/lessonAccess";
import { SubscriptionStatus } from "@/src/services/firebase/types";

async function fallbackRows(uid: string): Promise<LessonAccessRow[]> {
  const lessons = await database.get<LocalLesson>("local_lessons").query(Q.sortBy("lesson_order", Q.asc)).fetch();
  const completed = await database.get<LocalCompletedLesson>("local_completed_lessons").query(Q.where("uid", uid)).fetch();
  const profile = await database.get<LocalUserProfile>("local_user_profile").query(Q.where("uid", uid)).fetch();
  const completedMap: Record<string, boolean> = {};
  for (const item of completed) {
    completedMap[item.lessonId] = item.isCompleted;
  }
  const subscriptionStatus = (profile[0]?.subscriptionStatus as SubscriptionStatus | undefined) ?? "free";
  return buildLessonAccessRows(lessons, completedMap, subscriptionStatus);
}

export async function getLessonRowsForClassroom(uid: string): Promise<LessonAccessRow[]> {
  const accessRows = await database.get<LocalLessonAccess>("lesson_access").query(Q.where("uid", uid)).fetch();
  if (accessRows.length === 0) {
    return fallbackRows(uid);
  }
  return accessRows
    .slice()
    .sort((a, b) => a.lessonId.localeCompare(b.lessonId, undefined, { numeric: true }))
    .map((row) => ({
      lessonId: row.lessonId,
      isUnlocked: row.isUnlocked,
      isCompleted: row.isCompleted,
      isPlaceholder: row.isPlaceholder,
      requiresPaywall: row.requiresPaywall,
    }));
}

