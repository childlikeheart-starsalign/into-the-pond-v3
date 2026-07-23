import { SAMPLE_VIDEO_URI } from "@/src/features/classroom/lessonCatalog";

const LESSON_STORAGE_VERSIONS: Record<string, readonly string[]> = {
  "1.1": ["v2"],
  "1.2": ["v3"],
  "1.3": ["v3"],
};

export const DEFAULT_LESSON_STORAGE_VERSIONS = ["v2", "v1"] as const;

export function isCatalogPlaceholderVideoUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  return trimmed === SAMPLE_VIDEO_URI;
}

/** True when expo-av can attempt HTTP playback without client-side Storage SDK resolution. */
export function isPlayableLessonVideoUrl(url: string | null | undefined): url is string {
  const trimmed = url?.trim();
  if (!trimmed || !trimmed.startsWith("https://")) {
    return false;
  }

  if (isCatalogPlaceholderVideoUrl(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    const normalizedHostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
    if (normalizedHostname !== "firebasestorage.googleapis.com") {
      return true;
    }
    return (
      parsed.searchParams.has("token") && parsed.searchParams.get("token") !== "PASTE_TOKEN_HERE"
    );
  } catch {
    return false;
  }
}

export function storageVersionsForLesson(lessonId: string): readonly string[] {
  return LESSON_STORAGE_VERSIONS[lessonId] ?? DEFAULT_LESSON_STORAGE_VERSIONS;
}

export function lessonStorageObjectPath(lessonId: string, version: string): string {
  return `curriculum/lessons/${lessonId}/${version}/lesson.mp4`;
}

export type LessonPlaybackSource = "synced" | "firestore" | "storage-sdk" | "catalog-fallback";

/** Pure resolution priority for unit tests and resolver. */
export function pickLessonPlaybackUrl(input: {
  mergedUrl: string | null | undefined;
  firestoreUrl: string | null | undefined;
  storageUrl: string | null | undefined;
  placeholderUrl: string;
}): { url: string; source: LessonPlaybackSource } {
  if (isPlayableLessonVideoUrl(input.mergedUrl)) {
    return { url: input.mergedUrl, source: "synced" };
  }
  if (isPlayableLessonVideoUrl(input.firestoreUrl)) {
    return { url: input.firestoreUrl, source: "firestore" };
  }
  if (isPlayableLessonVideoUrl(input.storageUrl)) {
    return { url: input.storageUrl, source: "storage-sdk" };
  }
  return { url: input.placeholderUrl, source: "catalog-fallback" };
}
