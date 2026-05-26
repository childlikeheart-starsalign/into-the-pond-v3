import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";

type DiaryPromptTextProps = {
  question: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

export function DiaryPromptText({
  question,
  value,
  error,
  onChange,
  onBlur,
}: DiaryPromptTextProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.question}>{question}</Text>
      <TextInput
        accessibilityLabel={question}
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        multiline
        textAlignVertical="top"
        placeholder="Write your reflection..."
        placeholderTextColor={colors.textSecondary}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  question: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 16,
    fontSize: 20,
    color: colors.textPrimary,
  },
  input: {
    minHeight: 132,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.inner,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
    backgroundColor: "#FAF7F2",
  },
  inputError: {
    borderColor: "#B86A6A",
  },
  error: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    color: "#B86A6A",
  },
});
