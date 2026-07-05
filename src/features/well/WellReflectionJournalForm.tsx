import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { fontFamilies } from "@/src/constants/theme";
import {
  HEADLINE_FIELD_LABEL,
  HEADLINE_PLACEHOLDER,
  REFLECTION_CHAR_LIMIT,
  REFLECTION_PLACEHOLDER,
  REFLECTION_SAVE_LABEL,
} from "@/src/features/well/wellCopy";

const INK = "#2C1810";
const BARK = "#7A5C48";
const SAGE = "#7A9070";
const CREAM = "#F5F0E8";
const PLACEHOLDER = "rgba(122, 92, 72, 0.4)";
const LINE_HEIGHT = 22.1; // 13 * 1.7
const MIN_LINES = 4;

type WellReflectionJournalFormProps = {
  draftText: string;
  headline: string;
  onDraftChange: (text: string) => void;
  onHeadlineChange: (text: string) => void;
  onSubmit: () => Promise<void>;
};

export function WellReflectionJournalForm({
  draftText,
  headline,
  onDraftChange,
  onHeadlineChange,
  onSubmit,
}: WellReflectionJournalFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = draftText.trim().length >= 10 && !submitting;
  const showHeadline = draftText.length > 0;
  const showCounter = draftText.length >= REFLECTION_CHAR_LIMIT - 200;

  return (
    <View style={styles.wrap}>
      <TextInput
        value={draftText}
        onChangeText={onDraftChange}
        placeholder={REFLECTION_PLACEHOLDER}
        placeholderTextColor={PLACEHOLDER}
        multiline
        textAlignVertical="top"
        maxLength={REFLECTION_CHAR_LIMIT}
        style={[styles.reflectionInput, draftText.length === 0 && styles.inputItalic]}
      />

      {showHeadline ? (
        <View style={styles.headlineBlock}>
          <Text style={styles.headlineLabel}>{HEADLINE_FIELD_LABEL}</Text>
          <TextInput
            value={headline}
            onChangeText={onHeadlineChange}
            placeholder={HEADLINE_PLACEHOLDER}
            placeholderTextColor={PLACEHOLDER}
            style={[styles.headlineInput, headline.length === 0 && styles.inputItalic]}
            returnKeyType="done"
          />
        </View>
      ) : null}

      {showCounter ? (
        <Text style={styles.counter}>
          {draftText.length}/{REFLECTION_CHAR_LIMIT}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={REFLECTION_SAVE_LABEL}
        disabled={!canSubmit}
        onPress={async () => {
          if (!canSubmit) return;
          setSubmitting(true);
          try {
            await onSubmit();
          } finally {
            setSubmitting(false);
          }
        }}
        style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
      >
        <Text style={styles.submitText}>{REFLECTION_SAVE_LABEL}</Text>
      </Pressable>
    </View>
  );
}

export const REFLECTION_INPUT_MIN_HEIGHT = LINE_HEIGHT * MIN_LINES;

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "space-between",
    gap: 12,
  },
  reflectionInput: {
    minHeight: REFLECTION_INPUT_MIN_HEIGHT,
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: LINE_HEIGHT,
    color: INK,
    padding: 0,
    backgroundColor: "transparent",
  },
  inputItalic: {
    fontStyle: "italic",
    fontSize: 12,
    lineHeight: 20.4,
  },
  headlineBlock: {
    gap: 6,
  },
  headlineLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 10,
    color: SAGE,
  },
  headlineInput: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: INK,
    padding: 0,
    backgroundColor: "transparent",
  },
  counter: {
    fontFamily: fontFamilies.body,
    fontSize: 10,
    color: BARK,
    textAlign: "right",
    opacity: 0.7,
  },
  submitBtn: {
    height: 44,
    borderRadius: 10,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 14,
    fontWeight: "500",
    color: CREAM,
  },
});
