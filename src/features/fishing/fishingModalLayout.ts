import type { ViewStyle } from "react-native";

/**
 * Normalized layout regions measured from assets/Fishing/40.png (1080×1920).
 * All values are fractions of the 9:16 artboard used by sanctuary/fishing overlays.
 */

export type NormalizedBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Circle on the 1080×1920 artboard; diameter is a fraction of artboard width. */
export type NormalizedCircle = {
  centerX: number;
  centerY: number;
  diameter: number;
};

export const FISHING_REF_SIZE = {
  width: 1080,
  height: 1920,
} as const;

/** Measured frosted panel regions on the reference mockup. */
export const FISHING_LAYOUT: {
  previewCard: NormalizedBox;
  baitPanel: NormalizedBox;
  rodGrid: NormalizedBox;
  previewClose: NormalizedBox;
  castButton: NormalizedCircle;
} = {
  previewCard: { left: 0.19, top: 0.325, width: 0.62, height: 0.155 },
  baitPanel: { left: 0.03, top: 0.46, width: 0.355, height: 0.085 },
  rodGrid: { left: 0.03, top: 0.595, width: 0.92, height: 0.26 },
  previewClose: { left: 0.66, top: 0.325, width: 0.068, height: 0.033 },
  castButton: { centerX: 0.502, centerY: 0.412, diameter: 0.111 },
};

/** Parchment nav region at the bottom of the 9:16 artboard. */
export const FISHING_BOTTOM_NAV_INSET = 0.12;

export const FISHING_SLOT_LAYOUT: {
  previewRod: NormalizedBox;
  previewBait: NormalizedBox;
  baitSlots: readonly NormalizedBox[];
  rodSlots: readonly NormalizedBox[];
  rodArtArea: NormalizedBox;
  rodLabelArea: NormalizedBox;
} = {
  previewRod: { left: 0.06, top: -0.41, width: 0.5, height: 0.78 },
  previewBait: { left: 0.61, top: -0.25, width: 0.2, height: 0.59 },
  baitSlots: [
    { left: 0.03, top: 0.04, width: 0.28, height: 0.92 },
    { left: 0.36, top: 0.04, width: 0.28, height: 0.92 },
    { left: 0.69, top: 0.04, width: 0.28, height: 0.92 },
  ],
  rodSlots: [
    { left: 0, top: 0, width: 0.2, height: 0.5 },
    { left: 0.2, top: 0, width: 0.2, height: 0.5 },
    { left: 0.4, top: 0, width: 0.2, height: 0.5 },
    { left: 0.6, top: 0, width: 0.2, height: 0.5 },
    { left: 0.8, top: 0, width: 0.2, height: 0.5 },
    { left: 0, top: 0.5, width: 0.2, height: 0.5 },
    { left: 0.2, top: 0.5, width: 0.2, height: 0.5 },
    { left: 0.4, top: 0.5, width: 0.2, height: 0.5 },
    { left: 0.6, top: 0.5, width: 0.2, height: 0.5 },
    { left: 0.8, top: 0.5, width: 0.2, height: 0.5 },
  ],
  rodArtArea: { left: 0, top: 0, width: 1, height: 1 },
  rodLabelArea: { left: 0, top: 0.8, width: 1, height: 0.18 },
};

export type FrameRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function refBox(frame: FrameRect, box: NormalizedBox) {
  return {
    left: frame.width * box.left,
    top: frame.height * box.top,
    width: frame.width * box.width,
    height: frame.height * box.height,
  };
}

/** Expand a visual rect to at least the mobile minimum tap target, keeping it centered. */
export function minTapTargetRect(
  rect: { left: number; top: number; width: number; height: number },
  minSize = 48,
) {
  const width = Math.max(minSize, rect.width);
  const height = Math.max(minSize, rect.height);
  return {
    left: rect.left + rect.width / 2 - width / 2,
    top: rect.top + rect.height / 2 - height / 2,
    width,
    height,
  };
}

/** Map an artboard-normalized circle onto the live 9:16 frame as a square hit target. */
export function refCircle(frame: FrameRect, circle: NormalizedCircle) {
  const diameter = frame.width * circle.diameter;
  return {
    left: frame.width * circle.centerX - diameter / 2,
    top: frame.height * circle.centerY - diameter / 2,
    width: diameter,
    height: diameter,
    borderRadius: diameter / 2,
  };
}

export function normRectToStyle(
  rect: NormalizedBox,
  artboardWidth: number,
  artboardHeight: number,
): ViewStyle {
  return {
    position: "absolute",
    left: rect.left * artboardWidth,
    top: rect.top * artboardHeight,
    width: rect.width * artboardWidth,
    height: rect.height * artboardHeight,
  };
}
