import { StyleSheet, type TextStyle, type ViewStyle } from "react-native";

import { colors, fontFamilies } from "@/src/constants/theme";

/** Hard line caps for gate card template slots. */
export const GATE_CARD_LINE_LIMITS = {
  title: 2,
  description: 3,
  feature: 1,
  /** Pricing card feature list — allows multi-line bullets. */
  featureList: 3,
  price: 1,
} as const;

/** Typography constrained to layout frames — sizes from theme, not per-card tuning. */
export const gateCardText = StyleSheet.create({
  title: {
    fontFamily: fontFamilies.gateTitle,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: colors.textPrimary,
  } satisfies TextStyle,
  subtitle: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 15,
    lineHeight: 18,
    color: colors.primary,
  } satisfies TextStyle,
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  } satisfies TextStyle,
  /** Feature list copy on pricing cards — 10% smaller than body. */
  featureList: {
    flex: 1,
    fontFamily: fontFamilies.body,
    fontSize: 12.6,
    lineHeight: 18,
    color: colors.textSecondary,
  } satisfies TextStyle,
  feature: {
    flex: 1,
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  } satisfies TextStyle,
  meta: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 13,
    lineHeight: 16,
    color: colors.secondary,
  } satisfies TextStyle,
  price: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
    textAlign: "center",
  } satisfies TextStyle,
  cta: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 14,
    lineHeight: 18,
    color: colors.surface,
    textAlign: "center",
  } satisfies TextStyle,
  ctaPrice: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primarySoft,
    textAlign: "center",
  } satisfies TextStyle,
  fill: {
    flex: 1,
    width: "100%",
    height: "100%",
  } satisfies ViewStyle,
  fillTop: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "flex-start",
  } satisfies ViewStyle,
  fillCenter: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
  } satisfies ViewStyle,
  /** Single-line price slot inside pricingFrame. */
  priceBlock: {
    height: 18,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  } satisfies ViewStyle,
  priceStack: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-start",
    gap: 8,
  } satisfies ViewStyle,
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  } satisfies ViewStyle,
  featureIcon: {
    width: 24,
    height: 24,
  } satisfies ViewStyle,
  /** Inline with featureList copy — matches 18px line height for tight row spacing. */
  featureListIcon: {
    width: 18,
    height: 18,
  } satisfies ViewStyle,
  ctaPriceBlock: {
    height: 16,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  } satisfies ViewStyle,
});
