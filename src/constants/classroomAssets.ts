import type { ImageSourcePropType } from "react-native";

import type { SanctuaryTimeOfDay } from "@/src/constants/sanctuaryAssets";

export const CLASSROOM_ARTBOARD_WIDTH = 576;
export const CLASSROOM_ARTBOARD_HEIGHT = 1024;

export const CLASSROOM_MODULE_COUNT = 5;

export type ClassroomView = "open" | "menu" | "chapters";

export type NormRect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

/** Hit targets on the open screen and module menu artboards. */
export const classroomHitRects = {
  /** Tap-to-open book on classroom-landing.png (576×1024). */
  openTap: { left: 0.219, top: 0.61, width: 0.6, height: 0.2 },
  /** Floating book on the forest menu screens. */
  menuBook: { left: 0.22, top: 0.18, width: 0.56, height: 0.42 },
  /** Bottom dial area for slide-to-select gestures. */
  moduleDial: { left: 0.04, top: 0.72, width: 0.92, height: 0.22 },
  /** Lesson rows on chapter artboards (253–257). */
  chapterLessonRows: [
    { left: 0.08, top: 0.18, width: 0.84, height: 0.09 },
    { left: 0.08, top: 0.3, width: 0.84, height: 0.09 },
    { left: 0.08, top: 0.42, width: 0.84, height: 0.09 },
    { left: 0.08, top: 0.54, width: 0.84, height: 0.09 },
    { left: 0.08, top: 0.66, width: 0.84, height: 0.09 },
    { left: 0.08, top: 0.78, width: 0.84, height: 0.09 },
  ],
} as const satisfies {
  openTap: NormRect;
  menuBook: NormRect;
  moduleDial: NormRect;
  chapterLessonRows: readonly NormRect[];
};

const menuFrames = {
  morning: {
    1: require("@/assets/images/classroom/classroom-233.png"),
    2: require("@/assets/images/classroom/classroom-234.png"),
    3: require("@/assets/images/classroom/classroom-235.png"),
    4: require("@/assets/images/classroom/classroom-236.png"),
    5: require("@/assets/images/classroom/classroom-237.png"),
  },
  afternoon: {
    1: require("@/assets/images/classroom/classroom-238.png"),
    2: require("@/assets/images/classroom/classroom-239.png"),
    3: require("@/assets/images/classroom/classroom-240.png"),
    4: require("@/assets/images/classroom/classroom-241.png"),
    5: require("@/assets/images/classroom/classroom-242.png"),
  },
  lateAfternoon: {
    1: require("@/assets/images/classroom/classroom-243.png"),
    2: require("@/assets/images/classroom/classroom-244.png"),
    3: require("@/assets/images/classroom/classroom-245.png"),
    4: require("@/assets/images/classroom/classroom-246.png"),
    5: require("@/assets/images/classroom/classroom-247.png"),
  },
  /** Night reuses the late-afternoon menu art (243–247). */
  night: {
    1: require("@/assets/images/classroom/classroom-243.png"),
    2: require("@/assets/images/classroom/classroom-244.png"),
    3: require("@/assets/images/classroom/classroom-245.png"),
    4: require("@/assets/images/classroom/classroom-246.png"),
    5: require("@/assets/images/classroom/classroom-247.png"),
  },
} as const satisfies Record<SanctuaryTimeOfDay, Record<1 | 2 | 3 | 4 | 5, ImageSourcePropType>>;

export const classroomAssets = {
  open: require("@/assets/images/classroom/classroom-landing.png"),
  menu: menuFrames,
  chapters: {
    1: require("@/assets/Classroom:chapters/253.png"),
    2: require("@/assets/Classroom:chapters/254.png"),
    3: require("@/assets/Classroom:chapters/255.png"),
    4: require("@/assets/Classroom:chapters/256.png"),
    5: require("@/assets/Classroom:chapters/257.png"),
  },
} as const;

export function getClassroomMenuFrame(
  timeOfDay: SanctuaryTimeOfDay,
  module: number,
): ImageSourcePropType {
  const clamped = Math.max(1, Math.min(CLASSROOM_MODULE_COUNT, module)) as 1 | 2 | 3 | 4 | 5;
  return classroomAssets.menu[timeOfDay][clamped];
}

export function getClassroomChapterFrame(module: number): ImageSourcePropType {
  const clamped = Math.max(1, Math.min(CLASSROOM_MODULE_COUNT, module)) as 1 | 2 | 3 | 4 | 5;
  return classroomAssets.chapters[clamped];
}

export function normRectToStyle(
  rect: NormRect,
  artboardWidth: number,
  artboardHeight: number,
): { left: number; top: number; width: number; height: number } {
  return {
    left: rect.left * artboardWidth,
    top: rect.top * artboardHeight,
    width: rect.width * artboardWidth,
    height: rect.height * artboardHeight,
  };
}
