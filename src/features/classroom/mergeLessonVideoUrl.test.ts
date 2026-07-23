import assert from "node:assert/strict";
import test from "node:test";

import { isPlayableLessonVideoUrl } from "@/src/features/classroom/lessonVideoUrlValidation";
import { mergeLessonVideoUrl } from "@/src/features/classroom/mergeLessonVideoUrl";
import { SAMPLE_VIDEO_URI } from "@/src/features/classroom/lessonCatalog";
import type { LessonItem } from "@/src/features/classroom/types";

const baseLesson: LessonItem = {
  id: "1.1",
  moduleId: "1",
  title: "Why Reasoning Fails During Emotional Flooding",
  isPremium: false,
  videoUrl: "https://example.com/placeholder.mp4",
};

test("isPlayableLessonVideoUrl accepts generic https URLs", () => {
  assert.equal(isPlayableLessonVideoUrl("https://example.com/video.mp4"), true);
});

test("isPlayableLessonVideoUrl rejects empty and non-https URLs", () => {
  assert.equal(isPlayableLessonVideoUrl(""), false);
  assert.equal(isPlayableLessonVideoUrl("   "), false);
  assert.equal(isPlayableLessonVideoUrl("http://example.com/video.mp4"), false);
  assert.equal(isPlayableLessonVideoUrl(null), false);
});

test("isPlayableLessonVideoUrl requires token for Firebase Storage URLs", () => {
  assert.equal(
    isPlayableLessonVideoUrl(
      "https://firebasestorage.googleapis.com/v0/b/test/o/lesson.mp4?alt=media",
    ),
    false,
  );
  assert.equal(
    isPlayableLessonVideoUrl(
      "https://firebasestorage.googleapis.com/v0/b/test/o/lesson.mp4?alt=media&token=PASTE_TOKEN_HERE",
    ),
    false,
  );
  assert.equal(
    isPlayableLessonVideoUrl(
      "https://firebasestorage.googleapis.com/v0/b/test/o/lesson.mp4?alt=media&token=real-token",
    ),
    true,
  );
});

test("isPlayableLessonVideoUrl rejects catalog placeholder clip", () => {
  assert.equal(isPlayableLessonVideoUrl(SAMPLE_VIDEO_URI), false);
});

test("mergeLessonVideoUrl keeps catalog lesson when sync map has no URL", () => {
  const merged = mergeLessonVideoUrl(baseLesson, new Map());
  assert.equal(merged.videoUrl, baseLesson.videoUrl);
});

test("mergeLessonVideoUrl prefers synced Firestore URL", () => {
  const synced = new Map([
    ["1.1", "https://firebasestorage.googleapis.com/v0/b/test/o/lesson.mp4?alt=media&token=abc"],
  ]);
  const merged = mergeLessonVideoUrl(baseLesson, synced);
  assert.equal(merged.videoUrl, synced.get("1.1"));
  assert.equal(merged.title, baseLesson.title);
});

test("mergeLessonVideoUrl ignores invalid synced Firebase Storage URLs", () => {
  const synced = new Map([
    ["1.1", "https://firebasestorage.googleapis.com/v0/b/test/o/lesson.mp4"],
  ]);
  const merged = mergeLessonVideoUrl(baseLesson, synced);
  assert.equal(merged.videoUrl, baseLesson.videoUrl);
});

test("mergeLessonVideoUrl ignores placeholder token synced URLs", () => {
  const synced = new Map([
    [
      "1.1",
      "https://firebasestorage.googleapis.com/v0/b/test/o/lesson.mp4?alt=media&token=PASTE_TOKEN_HERE",
    ],
  ]);
  const merged = mergeLessonVideoUrl(baseLesson, synced);
  assert.equal(merged.videoUrl, baseLesson.videoUrl);
});
