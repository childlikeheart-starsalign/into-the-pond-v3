import { StyleSheet } from "react-native";

/** Workspace warm palette */
export const colors = {
  bg: "#FAF7F2",
  surface: "#FFFFFF",
  textPrimary: "#1F1A17",
  textSecondary: "#5B514A",
  border: "#E8DDD3",
  primary: "#7A5C45",
  primaryHover: "#684D3A",
  primarySoft: "#EFE4DA",
  secondary: "#6F7D68",
  warning: "#9A7A42",
  dangerSoft: "#B86A6A",
};

export const fontFamilies = {
  heading: "PlayfairDisplay_700Bold",
  headingRegular: "PlayfairDisplay_400Regular",
  headingSemi: "PlayfairDisplay_600SemiBold",
  /** Gate screen + pricing card titles */
  gateTitle: "CormorantGaramond_700Bold",
  gateTitleRegular: "CormorantGaramond_400Regular",
  gateTitleSemi: "CormorantGaramond_600SemiBold",
  /** Field-journal italic captions (catch celebration, notes). */
  gateTitleItalic: "CormorantGaramond_400Regular_Italic",
  handwritten: "CrustaceansSignatureDemo",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
  /**
   * Journal margin marks — spec is 29LT Okaso Bold.
   * Interim: Inter SemiBold until Okaso Bold is added under assets/fonts/.
   */
  journalMargin: "Inter_600SemiBold",
};

/** Well of Questions card typography */
export const wellColors = {
  sage: "#7A9070",
  warmInk: "#2C1810",
  warmBark: "#7A5C48",
  leafUnfilled: "rgba(216, 220, 208, 0.4)",
};

/** Child Atlas reader */
export const atlasColors = {
  paper: "#F9F6F0",
  paperDeep: "#F4EFE6",
  ink: "#2C2418",
  inkMuted: "#6B5A4A",
  sepiaContour: "rgba(107, 90, 74, 0.06)",
  cardSurface: "rgba(255, 255, 255, 0.9)",
  shadow: "rgba(44, 36, 24, 0.12)",
  borderInk: "#3D3428",
  /** Atlas entry card — reflection excerpt (Zone B) */
  reflectionInk: "#6A5A4A",
  /** Atlas entry card — section labels + date (Zones A label, C) */
  metaInk: "#8A7A68",
  /** Atlas entry card — question prompt italic */
  promptInk: "#7A5C48",
};

/** Sanctuary well landmark status overlay */
export const wellStatusLabel = {
  fontFamily: fontFamilies.handwritten,
  fontSize: 16,
  color: colors.surface,
} as const;

/** Handwritten overlay prompts such as "casting..." and "Tap to open". */
export const handwrittenPrompt = {
  fontFamily: fontFamilies.handwritten,
  fontSize: 28,
  letterSpacing: 0,
} as const;

export const spacing = {
  section: 24,
  inner: 16,
  cardPadding: 20,
  tapGap: 8,
};

export const layout = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: spacing.inner,
    paddingBottom: 32,
    paddingTop: spacing.section,
    gap: spacing.section,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: spacing.inner,
  },
  screenTitle: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 16,
    fontSize: 22,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  muted: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  btnPrimary: {
    minHeight: 52,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: "#FFFFFF",
  },
  btnSecondary: {
    minHeight: 52,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondaryText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: colors.textPrimary,
  },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.textPrimary,
    textAlignVertical: "top",
  },
});
