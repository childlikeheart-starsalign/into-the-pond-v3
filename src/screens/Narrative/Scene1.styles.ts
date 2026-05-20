import { StyleSheet } from "react-native";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(250,247,242,0.72)",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.inner,
    paddingBottom: spacing.section + 16,
    paddingTop: spacing.section,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: spacing.inner,
  },
  title: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 24,
    fontSize: 28,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 26,
    color: colors.textSecondary,
  },
  cta: {
    minHeight: 52,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: "#FFFFFF",
  },
  skipBtn: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    paddingBottom: spacing.inner,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 18,
  },
});
