import { StyleSheet } from "react-native";

import { spacing } from "@/src/constants/theme";
import {
  CURRENT_ACCESS_ILLUSTRATION_DOWN_SHIFT_RATIO,
  CURRENT_ACCESS_TEXT_DOWN_SHIFT_RATIO,
  PRICING_CARD_HORIZONTAL_INSET,
  PRICING_CARD_ILLUSTRATION_WIDTH_RATIO,
  PRICING_CARD_SPACING,
  PRICING_CARD_TEXT_LEFT_SHIFT_RATIO,
  PRICING_CARD_TEXT_UP_SHIFT_RATIO,
} from "@/src/features/gate/pricingCardFlexLayout";

/** Shared flex layout for gate card copy — matches PricingCard placement. */
export const gateCardFlexStyles = StyleSheet.create({
  cardBody: {
    flex: 1,
    flexDirection: "column",
    overflow: "hidden",
    paddingHorizontal: PRICING_CARD_HORIZONTAL_INSET,
    paddingTop: spacing.tapGap,
    paddingBottom: spacing.tapGap,
  },
  contentArea: {
    flex: 1,
    minHeight: 0,
  },
  topSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.inner,
  },
  illustrationSlot: {
    width: `${PRICING_CARD_ILLUSTRATION_WIDTH_RATIO * 100}%`,
    aspectRatio: 0.9,
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  headerBlock: {
    flex: 1,
    minWidth: 0,
  },
  textShiftLeft: {
    marginLeft: `${-PRICING_CARD_TEXT_LEFT_SHIFT_RATIO * 100}%`,
  },
  textShiftUp: {
    marginTop: `${-PRICING_CARD_TEXT_UP_SHIFT_RATIO * 100}%`,
  },
  currentAccessTextShiftDown: {
    marginTop: `${CURRENT_ACCESS_TEXT_DOWN_SHIFT_RATIO * 100}%`,
  },
  currentAccessIllustrationShiftDown: {
    marginTop: `${CURRENT_ACCESS_ILLUSTRATION_DOWN_SHIFT_RATIO * 100}%`,
  },
  stackedTextGap: {
    marginTop: PRICING_CARD_SPACING.titleToDescription,
  },
  featureList: {
    marginTop: PRICING_CARD_SPACING.descriptionToFeatures,
    gap: PRICING_CARD_SPACING.featureToFeature,
  },
});
