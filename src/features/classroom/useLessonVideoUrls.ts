import { Q } from "@nozbe/watermelondb";
import { useEffect, useState } from "react";

import { database } from "@/src/db";
import { LocalLesson } from "@/src/db/models/LocalLesson";
import { isPlayableLessonVideoUrl } from "@/src/features/classroom/lessonVideoUrlValidation";

/** Observes WatermelonDB `local_lessons` and returns lessonId → videoUrl map from Firestore sync. */
export function useLessonVideoUrls(): ReadonlyMap<string, string> {
  const [videoUrls, setVideoUrls] = useState<ReadonlyMap<string, string>>(() => new Map());

  useEffect(() => {
    const table = database.get<LocalLesson>("local_lessons");
    const subscription = table
      .query(Q.sortBy("lesson_order", Q.asc))
      .observe()
      .subscribe((lessons) => {
        const next = new Map<string, string>();
        for (const lesson of lessons) {
          if (isPlayableLessonVideoUrl(lesson.videoUrl)) {
            next.set(lesson.lessonId, lesson.videoUrl);
          }
        }
        setVideoUrls(next);
      });

    return () => subscription.unsubscribe();
  }, []);

  return videoUrls;
}
