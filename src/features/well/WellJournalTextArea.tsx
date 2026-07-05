import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { fontFamilies, wellColors } from "@/src/constants/theme";
import { REFLECTION_PLACEHOLDER, REFLECTION_SAVE_LABEL } from "@/src/features/well/wellCopy";

type WellJournalTextAreaProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSave: () => Promise<void>;
};

export function WellJournalTextArea({ value, onChangeText, onSave }: WellJournalTextAreaProps) {
  const [saving, setSaving] = useState(false);
  const canSave = value.trim().length >= 10 && !saving;

  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={REFLECTION_PLACEHOLDER}
        placeholderTextColor="rgba(122, 92, 72, 0.55)"
        multiline
        textAlignVertical="top"
        style={styles.input}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={REFLECTION_SAVE_LABEL}
        disabled={!canSave}
        onPress={async () => {
          setSaving(true);
          try {
            await onSave();
          } finally {
            setSaving(false);
          }
        }}
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
      >
        <Text style={styles.saveText}>{REFLECTION_SAVE_LABEL}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    gap: 12,
  },
  input: {
    minHeight: 120,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 24,
    color: wellColors.warmInk,
  },
  saveBtn: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: wellColors.sage,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 15,
    color: "#FFFFFF",
  },
});
