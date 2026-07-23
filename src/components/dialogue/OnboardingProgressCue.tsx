import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";

const STEP_LABELS = ["Name", "Nickname", "Birthdate", "Quick Check"] as const;
const CHAPTER_NUMERALS = ["I", "II", "III", "IV"] as const;

type OnboardingProgressCueProps = {
  /** 0-based input step index (0..3). */
  stepIndex: number;
  visible?: boolean;
};

/** Printed storybook chapter marker — progress shown as pressed leaves, not numbers. */
export function OnboardingProgressCue({ stepIndex, visible = true }: OnboardingProgressCueProps) {
  if (!visible) return null;
  const safeIndex = Math.max(0, Math.min(stepIndex, STEP_LABELS.length - 1));

  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityLabel={`Finding your way · ${safeIndex + 1} of ${STEP_LABELS.length}`}
    >
      <Text style={styles.chapter}>CHAPTER {CHAPTER_NUMERALS[safeIndex]}</Text>
      <Text style={styles.title}>Finding Your Way</Text>

      <View style={styles.divider} accessible={false}>
        <View style={styles.rule} />
        <Text style={styles.ornament}>❦</Text>
        <View style={styles.rule} />
      </View>

      <View style={styles.leafTrail} accessibilityElementsHidden>
        {STEP_LABELS.map((label, i) => {
          const filled = i <= safeIndex;
          return (
            <View key={label} style={styles.leafSlot}>
              {filled ? (
                <MaterialCommunityIcons name="leaf" size={16} color={colors.primarySoft} />
              ) : (
                <View style={styles.emptyMark} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.tapGap,
    paddingHorizontal: spacing.inner,
    marginBottom: spacing.section,
    alignSelf: "center",
    maxWidth: 300,
  },
  chapter: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 10,
    letterSpacing: 2.2,
    color: colors.primarySoft,
    textShadowColor: "rgba(43, 36, 29, 0.45)",
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 1 },
  },
  title: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.02 * 21,
    color: colors.bg,
    textShadowColor: "rgba(43, 36, 29, 0.55)",
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.tapGap,
  },
  rule: {
    width: 52,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(239, 228, 218, 0.72)",
  },
  ornament: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 15,
    lineHeight: 18,
    color: colors.primarySoft,
    textShadowColor: "rgba(43, 36, 29, 0.38)",
    textShadowRadius: 2,
  },
  leafTrail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  leafSlot: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239, 228, 218, 0.7)",
    backgroundColor: "transparent",
  },
});
