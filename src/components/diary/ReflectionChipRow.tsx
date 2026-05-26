import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";

type ReflectionChipRowProps = {
  options: string[];
  selected: string | null;
  onChange: (value: string) => void;
};

/**
 * Horizontal emotional chips for moment replay — lower friction than a grid.
 */
export function ReflectionChipRow({ options, selected, onChange }: ReflectionChipRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((option) => {
        const isSelected = selected === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityLabel={option}
            accessibilityState={{ selected: isSelected }}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{option}</Text>
          </Pressable>
        );
      })}
      <View style={styles.rowEnd} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.tapGap,
    paddingVertical: 4,
  },
  rowEnd: {
    width: spacing.inner,
  },
  chip: {
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF7F2",
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 15,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
  },
});
