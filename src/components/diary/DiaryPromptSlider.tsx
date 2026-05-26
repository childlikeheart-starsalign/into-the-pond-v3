import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";

type DiaryPromptSliderProps = {
  question: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
};

export function DiaryPromptSlider({ question, min, max, value, onChange }: DiaryPromptSliderProps) {
  const values = Array.from({ length: max - min + 1 }, (_, index) => min + index);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.question}>{question}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.track} accessibilityRole="adjustable" accessibilityLabel={question}>
        {values.map((item) => {
          const selected = item === value;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`${question}: ${item}`}
              accessibilityState={{ selected }}
              style={[styles.step, selected && styles.stepSelected]}
              onPress={() => onChange(item)}
            >
              <Text style={[styles.stepText, selected && styles.stepTextSelected]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>{min}</Text>
        <Text style={styles.label}>{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: spacing.inner,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.inner,
  },
  question: {
    flex: 1,
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 16,
    fontSize: 20,
    color: colors.textPrimary,
  },
  value: {
    minWidth: 48,
    textAlign: "center",
    fontFamily: fontFamilies.bodySemi,
    fontSize: 18,
    color: colors.primary,
  },
  track: {
    flexDirection: "row",
    gap: spacing.tapGap,
  },
  step: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF7F2",
  },
  stepSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  stepText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: colors.textSecondary,
  },
  stepTextSelected: {
    color: colors.primary,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
