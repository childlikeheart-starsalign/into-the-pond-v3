import assert from "node:assert/strict";
import test from "node:test";

import { SAMPLE_VIDEO_URI } from "@/src/features/classroom/lessonCatalog";
import {
  isCatalogPlaceholderVideoUrl,
  isPlayableLessonVideoUrl,
  pickLessonPlaybackUrl,
} from "@/src/features/classroom/lessonVideoUrlValidation";

const firestoreUrl =
  "https://firebasestorage.googleapis.com/v0/b/test/o/lesson.mp4?alt=media&token=abc";

test("isCatalogPlaceholderVideoUrl matches catalog sample clip", () => {
  assert.equal(isCatalogPlaceholderVideoUrl(SAMPLE_VIDEO_URI), true);
  assert.equal(isCatalogPlaceholderVideoUrl(firestoreUrl), false);
});

test("isPlayableLessonVideoUrl rejects catalog placeholder", () => {
  assert.equal(isPlayableLessonVideoUrl(SAMPLE_VIDEO_URI), false);
});

test("pickLessonPlaybackUrl prefers synced URL over firestore and placeholder", () => {
  const picked = pickLessonPlaybackUrl({
    mergedUrl: firestoreUrl,
    firestoreUrl: "https://example.com/other.mp4",
    storageUrl: null,
    placeholderUrl: SAMPLE_VIDEO_URI,
  });
  assert.equal(picked.url, firestoreUrl);
  assert.equal(picked.source, "synced");
});

test("pickLessonPlaybackUrl skips placeholder merged URL and uses firestore", () => {
  const picked = pickLessonPlaybackUrl({
    mergedUrl: SAMPLE_VIDEO_URI,
    firestoreUrl,
    storageUrl: null,
    placeholderUrl: SAMPLE_VIDEO_URI,
  });
  assert.equal(picked.url, firestoreUrl);
  assert.equal(picked.source, "firestore");
});

test("pickLessonPlaybackUrl uses storage SDK when merged and firestore missing", () => {
  const storageUrl =
    "https://firebasestorage.googleapis.com/v0/b/test/o/storage.mp4?alt=media&token=xyz";
  const picked = pickLessonPlaybackUrl({
    mergedUrl: SAMPLE_VIDEO_URI,
    firestoreUrl: null,
    storageUrl,
    placeholderUrl: SAMPLE_VIDEO_URI,
  });
  assert.equal(picked.url, storageUrl);
  assert.equal(picked.source, "storage-sdk");
});

test("pickLessonPlaybackUrl falls back to catalog placeholder last", () => {
  const picked = pickLessonPlaybackUrl({
    mergedUrl: SAMPLE_VIDEO_URI,
    firestoreUrl: null,
    storageUrl: null,
    placeholderUrl: SAMPLE_VIDEO_URI,
  });
  assert.equal(picked.url, SAMPLE_VIDEO_URI);
  assert.equal(picked.source, "catalog-fallback");
});
