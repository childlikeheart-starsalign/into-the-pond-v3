import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";

type DiarySingleSelectProps = {
  options: string[];
  selected: string | null;
  onChange: (value: string) => void;
};

export function DiarySingleSelect({ options, selected, onChange }: DiarySingleSelectProps) {
  return (
    <View style={styles.list}>
      {options.map((option) => {
        const isSelected = selected === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityLabel={option}
            accessibilityState={{ selected: isSelected }}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.tapGap,
  },
  option: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.inner,
    paddingVertical: 14,
    backgroundColor: "#FAF7F2",
    justifyContent: "center",
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionText: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  optionTextSelected: {
    fontFamily: fontFamilies.bodySemi,
    color: colors.primary,
  },
});
