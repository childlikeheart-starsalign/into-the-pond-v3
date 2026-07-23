import type { LessonItem } from "@/src/features/classroom/types";

import { isPlayableLessonVideoUrl } from "@/src/features/classroom/lessonVideoUrlValidation";

/** Prefer synced Firestore video URL when playable; fall back to catalog placeholder. */
export function mergeLessonVideoUrl(
  lesson: LessonItem,
  syncedVideoUrls: ReadonlyMap<string, string>,
): LessonItem {
  const syncedUrl = syncedVideoUrls.get(lesson.id);
  if (!isPlayableLessonVideoUrl(syncedUrl)) {
    return lesson;
  }
  return {
    ...lesson,
    videoUrl: syncedUrl,
  };
}
