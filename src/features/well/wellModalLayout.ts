import type { ViewStyle } from "react-native";

import { minTapTargetRect as fishingMinTapTargetRect } from "@/src/features/fishing/fishingModalLayout";
import { WELL_CARD_ASPECT } from "@/src/features/well/WellCardShell";

export type NormalizedBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const WELL_ARTBOARD = {
  width: 1080,
  height: 1920,
} as const;

export const WELL_CARD_CONTENT_INSETS = {
  left: 0.14,
  top: 0.18,
  width: 0.72,
  height: 0.62,
} as const;

export const WELL_LAYOUT = {
  closeButton: { left: 0.82, top: 0.04, width: 0.12, height: 0.05 },
  establishingTapZone: { left: 0, top: 0, width: 1, height: 1 },
  focusFlipCard: { left: 0.08, top: 0.34, width: 0.84, height: 0.46 },
  rerollLink: { left: 0.12, top: 0.82, width: 0.76, height: 0.04 },
  deferLink: { left: 0.12, top: 0.88, width: 0.76, height: 0.04 },
} as const satisfies Record<string, NormalizedBox>;

/** Visual boost applied to Today's Focus flip card (1 = artboard fit). */
export const WELL_FOCUS_CARD_DISPLAY_SCALE = 1.632;

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

/** Scale factor so the flip card fits inside {@link WELL_LAYOUT.focusFlipCard}. */
export function getWellFocusCardScale(stageWidth: number, stageHeight: number): number {
  if (stageWidth <= 0 || stageHeight <= 0) return 1;

  const slotWidth = WELL_LAYOUT.focusFlipCard.width * stageWidth;
  const slotHeight = WELL_LAYOUT.focusFlipCard.height * stageHeight;
  const naturalHeight = slotWidth / WELL_CARD_ASPECT;

  if (naturalHeight <= 0) return WELL_FOCUS_CARD_DISPLAY_SCALE;
  const fitScale = Math.min(1, slotHeight / naturalHeight);
  return fitScale * WELL_FOCUS_CARD_DISPLAY_SCALE;
}

/** Pixel width for the flip card — layout size, not transform scale (keeps text sharp). */
export function getWellFocusCardLayoutWidth(stageWidth: number, stageHeight: number): number {
  if (stageWidth <= 0) return 0;
  const slotWidth = WELL_LAYOUT.focusFlipCard.width * stageWidth;
  return slotWidth * getWellFocusCardScale(stageWidth, stageHeight);
}

/** Minimum open water between scaled card bottom and reroll link. */
export const WELL_FOOTER_GAP_BELOW_CARD = 24;
export const WELL_FOOTER_DEFER_GAP = 8;
export const WELL_FOOTER_LINK_HEIGHT = 44;

export function getWellFooterLinkLayout(stageWidth: number, stageHeight: number) {
  if (stageWidth <= 0 || stageHeight <= 0) {
    return null;
  }

  const cardScale = getWellFocusCardScale(stageWidth, stageHeight);
  const slot = WELL_LAYOUT.focusFlipCard;
  const slotTop = slot.top * stageHeight;
  const slotHeight = slot.height * stageHeight;
  const slotWidth = slot.width * stageWidth;
  const scaledCardHeight = (slotWidth / WELL_CARD_ASPECT) * cardScale;
  const cardVisualBottom = slotTop + slotHeight / 2 + scaledCardHeight / 2;

  const minRerollTop = cardVisualBottom + WELL_FOOTER_GAP_BELOW_CARD;
  const layoutRerollTop = WELL_LAYOUT.rerollLink.top * stageHeight;
  const rerollTop = Math.max(minRerollTop, layoutRerollTop);
  const deferTop = rerollTop + WELL_FOOTER_LINK_HEIGHT + WELL_FOOTER_DEFER_GAP;

  return {
    reroll: {
      left: 0,
      top: rerollTop,
      width: stageWidth,
      height: WELL_FOOTER_LINK_HEIGHT,
    },
    defer: {
      left: 0,
      top: deferTop,
      width: stageWidth,
      height: WELL_FOOTER_LINK_HEIGHT,
    },
  };
}

export function minTapTargetRect(
  rect: { left: number; top: number; width: number; height: number },
  minSize = 48,
) {
  // Shared with fishing modal layout — re-export to avoid drift.
  return fishingMinTapTargetRect(rect, minSize);
}
