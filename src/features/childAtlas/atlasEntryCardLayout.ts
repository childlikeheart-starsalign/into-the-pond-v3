import type { ImageStyle, ViewStyle } from "react-native";

export type NormalizedBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Screen-space rect of a category pile at tap time (for focus enter animation). */
export type PileOriginRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const ATLAS_CARD_ASPECT = 278 / 298;

/** Vertical offset for live text — shifted down 15% of artboard height. */
const TEXT_TOP_OFFSET = 0.15;

export const ATLAS_ENTRY_CARD_LAYOUT = {
  question: { left: 0.1, top: 0.28 + TEXT_TOP_OFFSET, width: 0.8, height: 0.24 },
  dividerAfterQuestion: { left: 0.1, top: 0.52 + TEXT_TOP_OFFSET, width: 0.8, height: 0.04 },
  reflection: { left: 0.1, top: 0.56 + TEXT_TOP_OFFSET, width: 0.8, height: 0.18 },
  dividerBeforeDate: { left: 0.1, top: 0.76 + TEXT_TOP_OFFSET, width: 0.8, height: 0.04 },
  metadata: { left: 0.1, top: 0.95, width: 0.8, height: 0.05 },
} as const satisfies Record<string, NormalizedBox>;

export function normRectToStyle(rect: NormalizedBox, width: number, height: number): ViewStyle {
  return {
    position: "absolute",
    left: rect.left * width,
    top: rect.top * height,
    width: rect.width * width,
    height: rect.height * height,
  };
}

export function normRectToImageStyle(
  rect: NormalizedBox,
  width: number,
  height: number,
): ImageStyle {
  return {
    position: "absolute",
    left: rect.left * width,
    top: rect.top * height,
    width: rect.width * width,
    height: rect.height * height,
  };
}
