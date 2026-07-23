import { StyleSheet } from "react-native";

import { STORY_LONG_CARD_SIZE } from "@/src/constants/storyAssets";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";

/** Warm folio ink — matches ArchetypeResultPlate / JournalFolio. */
export const storyPlateInk = "#2B241D";

/** Shared long-card parchment typography for prologue plates. */
export const storyPlateTextStyles = StyleSheet.create({
  title: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 23,
    lineHeight: 28.5,
    letterSpacing: -0.02 * 23,
    color: storyPlateInk,
  },
  quote: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 14.3,
    lineHeight: 22.1,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  reflection: {
    fontFamily: fontFamilies.body,
    fontSize: 11.5,
    lineHeight: 17.5,
    color: colors.textSecondary,
  },
  disclaimer: {
    fontFamily: fontFamilies.body,
    fontSize: 9.7,
    lineHeight: 14.3,
    color: colors.textSecondary,
    fontStyle: "italic",
    opacity: 0.78,
  },
  sectionLabel: {
    fontFamily: fontFamilies.handwritten,
    fontSize: 19.3,
    lineHeight: 24.8,
    letterSpacing: 0,
    color: colors.primary,
    opacity: 0.82,
  },
  ctaLabel: {
    fontFamily: fontFamilies.handwritten,
    fontSize: 17.5,
    lineHeight: 23.9,
    color: colors.primary,
    textAlign: "center",
  },
  ctaLeaf: {
    opacity: 0.68,
    transform: [{ rotate: "-18deg" }],
  },
  secondaryLink: {
    fontFamily: fontFamilies.body,
    fontSize: 11.5,
    lineHeight: 17.5,
    color: colors.secondary,
    textDecorationLine: "underline",
    textAlign: "center",
  },
});

/** Shared long-card plate layout tokens. */
export const storyPlateLayoutStyles = StyleSheet.create({
  inner: {
    flex: 1,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  reflectionSection: {
    gap: spacing.tapGap,
  },
  supportingBlock: {
    gap: spacing.tapGap,
  },
  cta: {
    position: "absolute",
    left: 0,
    right: 0,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.tapGap,
  },
  ctaPressed: {
    opacity: 0.72,
  },
  secondaryLinkWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.inner,
  },
});

export function computeStoryPlateMedallionSize(plateWidth: number): number {
  return Math.round(Math.min(Math.max(62, plateWidth * 0.19), 74));
}

export function computeStoryPlateDimensions(screenWidth: number, screenHeight: number) {
  const plateWidth = Math.min(screenWidth * 1.012, 474);
  const aspectHeight = Math.round(
    plateWidth * (STORY_LONG_CARD_SIZE.height / STORY_LONG_CARD_SIZE.width),
  );
  const plateHeight = Math.min(aspectHeight, Math.round(screenHeight * 0.742));
  const padH = Math.round(plateWidth * 0.165);
  const padV = Math.round(plateWidth * 0.095);
  const bottomMargin = Math.round(plateHeight * 0.15);
  const medallionSize = computeStoryPlateMedallionSize(plateWidth);

  return { plateWidth, plateHeight, padH, padV, bottomMargin, medallionSize };
}
