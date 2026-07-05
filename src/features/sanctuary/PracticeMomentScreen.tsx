import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, layout, spacing } from "@/src/constants/theme";
import type { PracticeKind } from "@/src/domain/sanctuary";
import { PRACTICE_OPTIONS } from "@/src/features/sanctuary/practiceCatalog";
import { getLocalDateString } from "@/src/features/well/localDate";
import { firebaseAuth } from "@/src/services/firebase/client";
import { completePractice } from "@/src/services/firebase/serverActions";

type PracticeMomentScreenProps = {
  onClose: () => void;
  onCompleted?: (payload: { kind: PracticeKind; wonderAwarded: number }) => void;
};

export function PracticeMomentScreen({ onClose, onCompleted }: PracticeMomentScreenProps) {
  const uid = firebaseAuth.currentUser?.uid ?? null;
  const [submitting, setSubmitting] = useState<PracticeKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = useCallback(
    async (kind: PracticeKind) => {
      if (!uid || submitting) return;
      setSubmitting(kind);
      setError(null);
      try {
        const result = await completePractice(uid, { kind, localDate: getLocalDateString() });
        if (result.success && typeof result.wonderAwarded === "number") {
          onCompleted?.({ kind, wonderAwarded: result.wonderAwarded });
        }
        onClose();
      } catch {
        setError("That didn't save — you're still doing the work. Try again when you're ready.");
      } finally {
        setSubmitting(null);
      }
    },
    [uid, submitting, onCompleted, onClose],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={layout.screenTitle}>What went a little better today?</Text>
          <Text style={layout.subtitle}>
            Tap anything that sounds like your day. Partial counts. Showing up counts.
          </Text>

          <View style={styles.options}>
            {PRACTICE_OPTIONS.map((option) => (
              <Pressable
                key={option.kind}
                accessibilityRole="button"
                accessibilityLabel={`${option.headline}. ${option.moment}`}
                disabled={!uid || submitting != null}
                style={[styles.option, submitting === option.kind && styles.optionActive]}
                onPress={() => void handleSelect(option.kind)}
              >
                <Text style={styles.optionLabel}>{option.headline}</Text>
                <Text style={styles.optionHelper}>{option.moment}</Text>
                <Text style={styles.optionSkillNote}>{option.skillNote}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable accessibilityRole="button" style={layout.btnSecondary} onPress={onClose}>
            <Text style={layout.btnSecondaryText}>Skip for now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.inner,
    paddingTop: spacing.section,
    paddingBottom: spacing.inner,
    gap: spacing.inner,
  },
  options: {
    gap: spacing.inner,
  },
  option: {
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  optionActive: {
    opacity: 0.7,
  },
  optionLabel: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    letterSpacing: -0.36,
    color: colors.textPrimary,
  },
  optionHelper: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  optionSkillNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
    opacity: 0.75,
  },
  footer: {
    paddingHorizontal: spacing.inner,
    paddingTop: spacing.inner,
    paddingBottom: spacing.inner,
    gap: spacing.inner,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  error: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#B86A6A",
  },
});
