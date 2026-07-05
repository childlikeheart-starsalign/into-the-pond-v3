import type { ViewStyle } from "react-native";

/**
 * Normalized layout regions measured from assets/Fishing/fishing_cast_overlay.png (576×1024).
 * All values are fractions of the 9:16 artboard used by sanctuary/fishing overlays.
 */

export type NormalizedBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Circle on the artboard; diameter is a fraction of artboard width. */
export type NormalizedCircle = {
  centerX: number;
  centerY: number;
  diameter: number;
};

export const FISHING_REF_SIZE = {
  width: 576,
  height: 1024,
} as const;

/** Measured panel regions on fishing_cast_overlay.png. */
export const FISHING_LAYOUT: {
  previewCard: NormalizedBox;
  previewPanel: NormalizedBox;
  baitPanel: NormalizedBox;
  rodGrid: NormalizedBox;
  previewClose: NormalizedBox;
  castButton: NormalizedCircle;
} = {
  previewCard: { left: 0.08, top: 0.24, width: 0.84, height: 0.2 },
  previewPanel: { left: 0.12, top: 0.28, width: 0.76, height: 0.1 },
  previewClose: { left: 0.71, top: 0.17, width: 0.085, height: 0.042 },
  castButton: { centerX: 0.5, centerY: 0.338, diameter: 0.16 },
  baitPanel: { left: 0.115, top: 0.428, width: 0.47, height: 0.078 },
  rodGrid: { left: 0.04, top: 0.52, width: 0.92, height: 0.42 },
};

/** Parchment nav region at the bottom of the 9:16 artboard. */
export const FISHING_BOTTOM_NAV_INSET = 0.12;

/** Whole overlay art + hit targets: 15% smaller than artboard. */
export const FISHING_OVERLAY_SCALE = 0.85;

/** Shift overlay group upward (device px). */
export const FISHING_OVERLAY_TOP_OFFSET_PX = -25;

export const FISHING_SLOT_LAYOUT: {
  previewRod: NormalizedBox;
  previewBait: NormalizedBox;
  baitSlots: readonly NormalizedBox[];
  rodSlots: readonly NormalizedBox[];
  rodArtArea: NormalizedBox;
  rodLabelArea: NormalizedBox;
} = {
  previewRod: { left: 0.08, top: 0.07, width: 0.55, height: 0.9 },
  previewBait: { left: 0.57, top: 0.45, width: 0.22, height: 0.75 },
  baitSlots: [
    { left: -0.16, top: -0.2, width: 0.22, height: 0.92 },
    { left: 0.15, top: -0.05, width: 0.22, height: 0.92 },
    { left: 0.39, top: -0.05, width: 0.22, height: 0.92 },
  ],
  rodSlots: [
    { left: 0.01, top: 0.02, width: 0.18, height: 0.46 },
    { left: 0.21, top: 0.02, width: 0.18, height: 0.46 },
    { left: 0.41, top: 0.02, width: 0.18, height: 0.46 },
    { left: 0.61, top: 0.02, width: 0.18, height: 0.46 },
    { left: 0.81, top: 0.02, width: 0.18, height: 0.46 },
    { left: 0.01, top: 0.52, width: 0.18, height: 0.46 },
    { left: 0.21, top: 0.52, width: 0.18, height: 0.46 },
    { left: 0.41, top: 0.52, width: 0.18, height: 0.46 },
    { left: 0.61, top: 0.52, width: 0.18, height: 0.46 },
    { left: 0.81, top: 0.52, width: 0.18, height: 0.46 },
  ],
  rodArtArea: { left: 0, top: 0, width: 1, height: 1 },
  rodLabelArea: { left: 0, top: 0.8, width: 1, height: 0.18 },
};

/** Per-slot horizontal nudge (device px) for bait tap/lock alignment with hook art. */
export const FISHING_BAIT_SLOT_LEFT_OFFSET_PX = [
  0, // bait_basic
  -12, // bait_mid
  -6, // bait_premium
] as const;

/** Per-slot vertical nudge (device px) for bait tap/lock alignment with hook art. */
export const FISHING_BAIT_SLOT_TOP_OFFSET_PX = [
  0, // bait_basic
  -8, // bait_mid
  -8, // bait_premium
] as const;

/** Device-px nudge for Close hit rect after normalized layout. */
export const FISHING_CLOSE_OFFSET_PX = { left: -8, top: -6 } as const;

/** Close hit rect size as a fraction of previewClose (top-left anchor unchanged). */
export const FISHING_PREVIEW_CLOSE_SIZE_SCALE = 0.75;

/** Device-px downward nudge for Cast circle center. */
export const FISHING_CAST_CENTER_Y_OFFSET_PX = 4;

/** Vertical nudge (device px) for preview rod/bait overlays in the journal card. */
export const FISHING_PREVIEW_TOP_OFFSET_PX = -80;

/** Scale factor for preview rod slot rect inside the journal card. */
export const FISHING_PREVIEW_ROD_SLOT_SCALE = 1.625;

/** Scale factor for preview bait slot rect inside the journal card. */
export const FISHING_PREVIEW_BAIT_SLOT_SCALE = 1.495;

export function scaleNormalizedBoxFromCenter(box: NormalizedBox, scale: number): NormalizedBox {
  return {
    left: box.left + (box.width * (1 - scale)) / 2,
    top: box.top + (box.height * (1 - scale)) / 2,
    width: box.width * scale,
    height: box.height * scale,
  };
}

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

/** Map a panel-relative normalized slot onto the artboard as a frame-normalized box. */
export function panelSlotToFrameBox(panel: NormalizedBox, slot: NormalizedBox): NormalizedBox {
  return {
    left: panel.left + panel.width * slot.left,
    top: panel.top + panel.height * slot.top,
    width: panel.width * slot.width,
    height: panel.height * slot.height,
  };
}

export function frameRectToStyle(rect: FrameRect): ViewStyle {
  return {
    position: "absolute",
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function withTopOffsetPx(style: ViewStyle, offsetPx: number): ViewStyle {
  return {
    ...style,
    top: (typeof style.top === "number" ? style.top : 0) + offsetPx,
  };
}

/** Position a panel-relative slot inside a container on the live frame. */
export function panelSlotToContainerStyle(
  container: FrameRect,
  frame: FrameRect,
  panel: NormalizedBox,
  slot: NormalizedBox,
  topOffsetPx = 0,
): ViewStyle {
  const abs = refBox(frame, panelSlotToFrameBox(panel, slot));
  return {
    position: "absolute",
    left: abs.left - container.left,
    top: abs.top - container.top + topOffsetPx,
    width: abs.width,
    height: abs.height,
  };
}

/** Frame-absolute preview slot (rod/bait) — avoids previewCard overflow clipping. */
export function previewSlotToFrameStyle(
  frame: FrameRect,
  slot: NormalizedBox,
  scale: number,
  topOffsetPx = 0,
): ViewStyle {
  const scaled = scaleNormalizedBoxFromCenter(slot, scale);
  const abs = refBox(frame, panelSlotToFrameBox(FISHING_LAYOUT.previewPanel, scaled));
  return withTopOffsetPx(frameRectToStyle(abs), topOffsetPx);
}

export function scaleFrameRectFromTopLeft(rect: FrameRect, scale: number): FrameRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width * scale,
    height: rect.height * scale,
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
