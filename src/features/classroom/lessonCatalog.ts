import type { LessonItem } from "@/src/features/classroom/types";

/** Placeholder MP4 until curriculum CDN URLs are wired. */
const SAMPLE_VIDEO_URI =
  "https://storage.googleapis.com/exoplayer-test-media-1/mp4/android-screens-10s.mp4";

function lesson(
  moduleId: number,
  lessonNum: number,
  title: string,
  isPremium: boolean,
): LessonItem {
  const id = `${moduleId}.${lessonNum}`;
  return {
    id,
    moduleId: String(moduleId),
    title,
    isPremium,
    videoUrl: SAMPLE_VIDEO_URI,
  };
}

/** Six rows per chapter artboard (253–257), preloaded — no fetch on tap. */
export const LESSONS_BY_MODULE: Record<number, LessonItem[]> = {
  1: [
    lesson(1, 1, "Why Reasoning Fails During Emotional Flooding", false),
    lesson(1, 2, "The Infant & Child Brain Reality", false),
    lesson(1, 3, "The Co-Regulation Loop", false),
    lesson(1, 4, "Regulating the Parent", true),
    lesson(1, 5, "High-Stress Scenarios", true),
    lesson(1, 6, "The Daily Integration System", true),
  ],
  2: [
    lesson(2, 1, "Why Control Backfires", true),
    lesson(2, 2, "The Cooperation Model", true),
    lesson(2, 3, "Connection Before Instruction", true),
    lesson(2, 4, 'Handling "No" Without Escalation', true),
    lesson(2, 5, "Boundaries Without Threat", true),
    lesson(2, 6, "Daily Integration", true),
  ],
  3: [
    lesson(3, 1, "Self-Directed Motivation Foundations", true),
    lesson(3, 2, "Intrinsic vs Extrinsic Rewards", true),
    lesson(3, 3, "Autonomy Supports", true),
    lesson(3, 4, "Competence Building", true),
    lesson(3, 5, "Relatedness in Learning", true),
    lesson(3, 6, "Integration Practice", true),
  ],
  4: [
    lesson(4, 1, "Resilience Foundations", true),
    lesson(4, 2, "Stress Inoculation", true),
    lesson(4, 3, "Recovery Rituals", true),
    lesson(4, 4, "Support Networks", true),
    lesson(4, 5, "Setback Reframing", true),
    lesson(4, 6, "Daily Resilience Practice", true),
  ],
  5: [
    lesson(5, 1, "Identity & Self-Direction", true),
    lesson(5, 2, "Values Clarification", true),
    lesson(5, 3, "Purpose Mapping", true),
    lesson(5, 4, "Agency in Choices", true),
    lesson(5, 5, "Long-Term Vision", true),
    lesson(5, 6, "Integration & Commitment", true),
  ],
};

/** Resolve chapter row tap (0-based index) to preloaded lesson. */
export function getLessonForChapterRow(module: number, rowIndex: number): LessonItem | null {
  const lessons = LESSONS_BY_MODULE[module];
  if (!lessons || rowIndex < 0 || rowIndex >= lessons.length) return null;
  return lessons[rowIndex] ?? null;
}
