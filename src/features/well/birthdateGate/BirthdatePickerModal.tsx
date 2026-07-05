import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";

export type BirthdatePickerOption = {
  value: number;
  label: string;
};

type BirthdatePickerModalProps = {
  visible: boolean;
  options: BirthdatePickerOption[];
  onSelect: (value: number) => void;
  onClose: () => void;
};

export function BirthdatePickerModal({
  visible,
  options,
  onSelect,
  onClose,
}: BirthdatePickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView style={styles.list}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => onSelect(option.value)}
              >
                <Text style={styles.optionText}>{option.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable accessibilityRole="button" style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(31, 26, 23, 0.25)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "60%",
    paddingBottom: spacing.section,
  },
  list: {
    paddingVertical: spacing.inner,
  },
  option: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.section,
  },
  optionPressed: {
    backgroundColor: colors.primarySoft,
  },
  optionText: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  cancel: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
