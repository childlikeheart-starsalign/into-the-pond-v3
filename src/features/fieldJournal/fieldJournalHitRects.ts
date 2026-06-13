import type { ViewStyle } from "react-native";

import type { FitRect } from "@/src/features/fieldJournal/fitContainRect";
import {
  FIELD_JOURNAL_REFERENCE_HEIGHT,
  FIELD_JOURNAL_REFERENCE_WIDTH,
} from "@/src/features/fieldJournal/fieldJournalLayout";

/** Normalized hit rects on the spread artboard (0–1 within the image). */
export type FieldJournalHitRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type FieldJournalChapterTabId = "stillwater" | "deep-current" | "charged-depths";

/**
 * Fabric chapter strips on the right edge (576×1024 reference art).
 * Measured from stillwater spread PNGs — full protruding tab width.
 */
const CHAPTER_STRIP_PX = {
  left: 467,
  width: 109,
} as const;

const CHAPTER_TAB_VERTICAL: Record<
  FieldJournalChapterTabId,
  { top: number; height: number; label: string }
> = {
  stillwater: { label: "Stillwater Creatures", top: 0.188, height: 0.197 },
  "deep-current": { label: "Deep Current Organisms", top: 0.392, height: 0.169 },
  "charged-depths": { label: "The Charged Depths", top: 0.566, height: 0.2 },
};

/** Invisible hit rect aligned to a fabric chapter strip in the spread art. */
export function chapterStripHitRect(
  chapterId: FieldJournalChapterTabId,
  imageWidthPx: number,
): FieldJournalHitRect & { label: string } {
  const scale = imageWidthPx / FIELD_JOURNAL_REFERENCE_WIDTH;
  const leftPx = CHAPTER_STRIP_PX.left * scale;
  const widthPx = CHAPTER_STRIP_PX.width * scale;
  const vertical = CHAPTER_TAB_VERTICAL[chapterId];

  return {
    label: vertical.label,
    left: leftPx / imageWidthPx,
    width: widthPx / imageWidthPx,
    top: vertical.top,
    height: vertical.height,
  };
}

export const FIELD_JOURNAL_CHAPTER_TAB_IDS: FieldJournalChapterTabId[] = [
  "stillwater",
  "deep-current",
  "charged-depths",
];

/** Map image-normalized rect → absolute position within the reader frame. */
export function imageNormalizedToFrameStyle(
  rect: FieldJournalHitRect,
  imageRect: FitRect,
): ViewStyle {
  return {
    position: "absolute",
    left: imageRect.x + rect.left * imageRect.width,
    top: imageRect.y + rect.top * imageRect.height,
    width: rect.width * imageRect.width,
    height: rect.height * imageRect.height,
  };
}
