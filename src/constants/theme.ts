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
};

export const fontFamilies = {
  heading: "PlayfairDisplay_700Bold",
  headingRegular: "PlayfairDisplay_400Regular",
  /** Gate screen + pricing card titles */
  gateTitle: "CormorantGaramond_700Bold",
  gateTitleRegular: "CormorantGaramond_400Regular",
  handwritten: "CrustaceansSignatureDemo",
  body: "Inter_400Regular",
  bodySemi: "Inter_600SemiBold",
};

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
