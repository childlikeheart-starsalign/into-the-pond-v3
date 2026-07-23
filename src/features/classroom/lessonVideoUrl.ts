import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";

import { SAMPLE_VIDEO_URI } from "@/src/features/classroom/lessonCatalog";
import {
  isPlayableLessonVideoUrl,
  lessonStorageObjectPath,
  pickLessonPlaybackUrl,
  storageVersionsForLesson,
} from "@/src/features/classroom/lessonVideoUrlValidation";
import type { LessonItem } from "@/src/features/classroom/types";
import { firebaseStorage, firestore } from "@/src/services/firebase/client";

export {
  isCatalogPlaceholderVideoUrl,
  isPlayableLessonVideoUrl,
  lessonStorageObjectPath,
  pickLessonPlaybackUrl,
} from "@/src/features/classroom/lessonVideoUrlValidation";

async function resolveFromStorage(lessonId: string): Promise<string | null> {
  for (const version of storageVersionsForLesson(lessonId)) {
    try {
      const objectPath = lessonStorageObjectPath(lessonId, version);
      return await getDownloadURL(ref(firebaseStorage, objectPath));
    } catch {
      /* try next version */
    }
  }
  return null;
}

/** Read latest videoUrl from Firestore (bypasses stale WatermelonDB cache). */
export async function fetchLessonVideoUrlFromFirestore(lessonId: string): Promise<string | null> {
  if (!lessonId) return null;

  try {
    const snap = await getDoc(doc(firestore, "lessons", lessonId));
    if (!snap.exists()) return null;

    const videoUrl = snap.data()?.videoUrl;
    return isPlayableLessonVideoUrl(videoUrl) ? videoUrl.trim() : null;
  } catch (error) {
    if (__DEV__) {
      console.warn("[Classroom] failed to fetch lesson videoUrl from Firestore", lessonId, error);
    }
    return null;
  }
}

/** Resolve playback URL: synced/merged → fresh Firestore → Storage SDK → catalog placeholder. */
export async function resolveLessonPlaybackUrl(lesson: LessonItem): Promise<LessonItem> {
  if (isPlayableLessonVideoUrl(lesson.videoUrl)) {
    if (__DEV__) {
      console.log("[Classroom] lesson", lesson.id, "playbackUrl", lesson.videoUrl, "(synced)");
    }
    return lesson;
  }

  const firestoreUrl = await fetchLessonVideoUrlFromFirestore(lesson.id);
  const storageUrl = firestoreUrl ? null : await resolveFromStorage(lesson.id);

  const { url, source } = pickLessonPlaybackUrl({
    mergedUrl: lesson.videoUrl,
    firestoreUrl,
    storageUrl,
    placeholderUrl: SAMPLE_VIDEO_URI,
  });

  if (__DEV__) {
    console.log("[Classroom] lesson", lesson.id, "playbackUrl", url, `(${source})`);
  }

  return { ...lesson, videoUrl: url };
}
