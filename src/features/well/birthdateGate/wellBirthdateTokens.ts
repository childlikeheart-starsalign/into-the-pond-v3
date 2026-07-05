/** Design tokens for Well birthdate gate — Screen 2/3 sanctuary palette. */
export const pondColor = {
  cream: "#FAF7F2",
  parchment: "#F7F1E6",
  ink: "#2C1810",
  /** @deprecated use ink */
  warmInk: "#2C1810",
  body: "#5B514A",
  sage: "#7A9070",
  moss: "#94A485",
  bark: "#7A5C48",
  woodDark: "#7A5C45",
  woodLight: "#9A775F",
  /** @deprecated use woodDark */
  brown: "#7A5C45",
  divider: "rgba(61, 52, 40, 0.18)",
  inkRule: "rgba(44, 24, 16, 0.35)",
} as const;

export const wellBirthdateLayout = {
  /** Reference mock typography proportions (473×1024 target). */
  headlineSize: 34,
  speakAccentSize: 40,
  subtextSize: 13.6,
  lineSpacing: 4,
  fieldLabelSize: 13,
  /** Selected month/year — same typography as labels, 10% smaller than prior 18px. */
  fieldValueSize: 16.2,
  cardRadius: 16,
  cardPadding: 10,
  cardGap: 28,
  continueHeight: 52,
  topSpacer: 8,
  horizontalPadding: 16,
  /** Scale card art 30% larger than full content width. */
  cardScale: 1.3,
  wellGhostOpacity: 0.92,
  topoOpacity: 0.04,
  /** Inner double-border frame on well_birthdate_card art (fractions). */
  cardInnerFrame: {
    left: 0.177,
    top: 0.158,
    right: 0.821,
    bottom: 0.905,
  },
  /** Minimum inset from inner frame to live text (px). */
  cardTextMargin: 20,
  /** Decorative divider baked into card art (card-height fraction, bottom edge). */
  cardArtDividerBottom: 0.76,
  /** Space below divider before Continue pill (px at 682px card width). */
  cardContinueGapBelowDivider: 32,
  /**
   * Shared 9:16 stage anchor — card bottom edge + scene mist gradient end
   * (fraction of stage height, 0–1).
   */
  frameBlendAnchorY: 1,
  /** Extra px below stage bottom for shared card + scene veil anchor. */
  frameBlendAnchorOffsetPx: 15,
  /** Scene art nudge upward (px at 682px reference stage width). */
  sceneShiftUp: 40,
  sceneShiftReferenceWidth: 682,
} as const;

/** Card layer bottom inset — tied to frame blend anchor + offset. */
export function getWellBirthdateCardBottomInset(stageHeight: number): number {
  if (stageHeight <= 0) return 0;
  return (
    stageHeight * (1 - wellBirthdateLayout.frameBlendAnchorY) -
    wellBirthdateLayout.frameBlendAnchorOffsetPx
  );
}

/** Scene veil stops tied to {@link wellBirthdateLayout.frameBlendAnchorY}. */
export function getWellBirthdateSceneGradientLocations(
  stageHeight: number,
): readonly [number, number, number] {
  if (stageHeight <= 0) {
    const anchor = wellBirthdateLayout.frameBlendAnchorY;
    const mid = Math.max(0.28, anchor - 0.38);
    return [0, mid, anchor];
  }

  const extend = wellBirthdateLayout.frameBlendAnchorOffsetPx;
  const anchorPx = stageHeight * wellBirthdateLayout.frameBlendAnchorY + extend;
  const gradientHeight = stageHeight + extend;
  const mid = Math.max(0.28, (anchorPx - 0.38 * stageHeight) / gradientHeight);
  const end = anchorPx / gradientHeight;
  return [0, mid, end];
}

/** Scene shift in px for the current stage width. */
export function getWellBirthdateSceneShiftPx(stageWidth: number): number {
  if (stageWidth <= 0) return wellBirthdateLayout.sceneShiftUp;
  return (
    wellBirthdateLayout.sceneShiftUp * (stageWidth / wellBirthdateLayout.sceneShiftReferenceWidth)
  );
}

/** Top-weighted veil — keep headline readable, let well art show through below. */
export const wellBirthdateGradient = {
  top: "rgba(250, 247, 242, 0.82)",
  mid: "rgba(250, 247, 242, 0.35)",
  bottom: "rgba(250, 247, 242, 0.08)",
} as const;

/** Fractional layout for botanical edge overlays (left, top, width, height). */
export const botanicalOverlayLayout = {
  ivy: { left: 0.58, top: 0, width: 0.42, height: 0.2 },
  wildflowerLeft: { left: -0.04, top: 0.78, width: 0.32, height: 0.2 },
  wildflowerRight: { left: 0.72, top: 0.76, width: 0.32, height: 0.22 },
  overlayOpacity: 0.88,
} as const;
