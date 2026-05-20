import { LocalLesson } from "@/src/db/models/LocalLesson";
import { SubscriptionStatus } from "@/src/services/firebase/types";

import { canAccessLesson } from "@/src/services/classroom/gating";

export type LessonAccessRow = {
  lessonId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  isPlaceholder: boolean;
  requiresPaywall: boolean;
};

export function buildLessonAccessRows(
  lessons: LocalLesson[],
  completedLessons: Record<string, boolean>,
  subscriptionStatus: SubscriptionStatus,
) {
  return lessons
    .slice()
    .sort((a, b) => a.lessonOrder - b.lessonOrder)
    .map<LessonAccessRow>((lesson, index, ordered) => {
      const requiresPaywall = !canAccessLesson(lesson.lessonId, subscriptionStatus);
      const isCompleted = !!completedLessons[lesson.lessonId];
      const previousLesson = ordered[index - 1];
      const progressionUnlocked = index === 0 || !!completedLessons[previousLesson.lessonId];
      const isUnlocked = !lesson.isPlaceholder && !requiresPaywall && progressionUnlocked;

      return {
        lessonId: lesson.lessonId,
        isUnlocked,
        isCompleted,
        isPlaceholder: lesson.isPlaceholder,
        requiresPaywall,
      };
    });
}
