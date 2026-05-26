import { useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";

type DiaryShortTextProps = {
  value: string;
  maxLength: number;
  placeholder?: string;
  onChange: (value: string) => void;
};

export function DiaryShortText({ value, maxLength, placeholder, onChange }: DiaryShortTextProps) {
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={styles.wrap}>
      <View style={styles.notebook}>
        <View style={styles.marginLine} />
        <View style={styles.ruleOne} />
        <View style={styles.ruleTwo} />
        <View style={styles.ruleThree} />
        <TextInput
          ref={inputRef}
          accessibilityLabel="Short reflection"
          style={styles.input}
          value={value}
          onChangeText={(text) => onChange(text.slice(0, maxLength))}
          multiline
          maxLength={maxLength}
          textAlignVertical="top"
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.hint}>Saved as you write</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Focus field for voice dictation"
          style={styles.voiceButton}
          onPress={() => inputRef.current?.focus()}
        >
          <Text style={styles.voiceLabel}>Speak</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.tapGap,
  },
  notebook: {
    minHeight: 112,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F3EBE0",
    overflow: "hidden",
  },
  marginLine: {
    position: "absolute",
    left: 28,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(184, 106, 106, 0.22)",
  },
  ruleOne: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 36,
    height: 1,
    backgroundColor: "rgba(122, 92, 69, 0.08)",
  },
  ruleTwo: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 60,
    height: 1,
    backgroundColor: "rgba(122, 92, 69, 0.08)",
  },
  ruleThree: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 84,
    height: 1,
    backgroundColor: "rgba(122, 92, 69, 0.08)",
  },
  input: {
    minHeight: 112,
    paddingTop: spacing.inner,
    paddingBottom: spacing.inner,
    paddingLeft: 40,
    paddingRight: spacing.inner,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
    backgroundColor: "transparent",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hint: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  voiceButton: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  voiceLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
