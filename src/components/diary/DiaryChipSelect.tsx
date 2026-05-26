import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";

type DiaryChipSelectProps = {
  options: string[];
  selected: string | null;
  onChange: (value: string) => void;
};

export function DiaryChipSelect({ options, selected, onChange }: DiaryChipSelectProps) {
  return (
    <View style={styles.chips}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.tapGap,
  },
  chip: {
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
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
