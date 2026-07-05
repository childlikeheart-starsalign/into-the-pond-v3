import type { ImageSourcePropType, ImageStyle } from "react-native";

import { SANCTUARY_TAB_BAR_STRIP_HEIGHT_RATIO } from "@/src/constants/sanctuaryNavLayout";
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

/**
 * Vertical crop on classroom-landing.png — hides top profile/menu chrome and
 * bottom parchment tab strip when the open screen is framed in Portrait916Frame.
 */
export const CLASSROOM_OPEN_CONTENT_CROP = {
  top: 0.16,
  bottom: SANCTUARY_TAB_BAR_STRIP_HEIGHT_RATIO,
} as const;

/** Nudge open landing art upward inside the 9:16 frame (fraction of frame height). */
export const CLASSROOM_OPEN_VERTICAL_SHIFT = 0.13;

/** Nudge open landing art left inside the 9:16 frame (fraction of frame width). */
export const CLASSROOM_OPEN_HORIZONTAL_SHIFT = 0.04;

/** Uniform zoom for open landing art inside the 9:16 frame (1 = 100%). */
export const CLASSROOM_OPEN_SCALE = 1.09;

/**
 * Nudge forest menu art upward inside the 9:16 frame (fraction of frame height).
 * Balances top/bottom letterbox with Gate/Sanctuary; hit targets move with the scene.
 */
export const CLASSROOM_MENU_SCENE_TOP_SHIFT = 0.032;

export function classroomOpenVisibleHeightFraction(
  crop: typeof CLASSROOM_OPEN_CONTENT_CROP = CLASSROOM_OPEN_CONTENT_CROP,
): number {
  return 1 - crop.top - crop.bottom;
}

function classroomOpenScaleRect(rect: NormRect, scale: number): NormRect {
  if (scale === 1) return rect;
  return {
    left: 0.5 + (rect.left - 0.5) * scale,
    top: 0.5 + (rect.top - 0.5) * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}

/** Remap a full-artboard hit rect into the cropped open-scene coordinate space. */
export function classroomOpenRectInCrop(
  rect: NormRect,
  crop: typeof CLASSROOM_OPEN_CONTENT_CROP = CLASSROOM_OPEN_CONTENT_CROP,
  verticalShift: number = CLASSROOM_OPEN_VERTICAL_SHIFT,
  horizontalShift: number = CLASSROOM_OPEN_HORIZONTAL_SHIFT,
  scale: number = CLASSROOM_OPEN_SCALE,
): NormRect {
  const visibleH = classroomOpenVisibleHeightFraction(crop);
  return classroomOpenScaleRect(
    {
      left: rect.left - horizontalShift,
      top: (rect.top - crop.top) / visibleH - verticalShift,
      width: rect.width,
      height: rect.height / visibleH,
    },
    scale,
  );
}

/** Percent-based layout for vertically cropping classroom-landing.png at runtime. */
export function classroomOpenCroppedImageStyle(
  crop: typeof CLASSROOM_OPEN_CONTENT_CROP = CLASSROOM_OPEN_CONTENT_CROP,
  verticalShift: number = CLASSROOM_OPEN_VERTICAL_SHIFT,
  horizontalShift: number = CLASSROOM_OPEN_HORIZONTAL_SHIFT,
  scale: number = CLASSROOM_OPEN_SCALE,
): Pick<ImageStyle, "width" | "height" | "top" | "left"> {
  const visibleH = classroomOpenVisibleHeightFraction(crop);
  const baseTopPct = (-crop.top / visibleH) * 100;
  const baseHeightPct = 100 / visibleH;
  const widthPct = 100 * scale;
  const heightPct = baseHeightPct * scale;
  return {
    width: `${widthPct.toFixed(4)}%`,
    height: `${heightPct.toFixed(4)}%`,
    left: `${(-horizontalShift * 100 - (widthPct - 100) / 2).toFixed(4)}%`,
    top: `${(baseTopPct - verticalShift * 100 - (heightPct - baseHeightPct) / 2).toFixed(4)}%`,
  };
}

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
