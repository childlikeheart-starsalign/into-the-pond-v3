import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { narrativeContent } from "@/src/constants/narrative/narrativeContent";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import {
  childBirthYearRange,
  validateChildBirthMonthYear,
} from "@/src/features/onboarding/validateChildBirthDate";
import { WellBirthdateGateView } from "@/src/features/well/birthdateGate";
import { computeAgeBand, parseBirthDate } from "@/shared/sanctuary/well/computeAgeBand";
import { playPaperClick } from "@/src/services/audio/playPaperClick";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type ChildBirthDateStepProps = {
  onSubmit: (month: number, year: number) => Promise<void>;
  variant?: "onboarding" | "well_gate";
  onClose?: () => void;
};

type PickerKind = "month" | "year" | null;

export function ChildBirthDateStep({
  onSubmit,
  variant = "onboarding",
  onClose,
}: ChildBirthDateStepProps) {
  if (variant === "well_gate") {
    return <WellBirthdateGateView onSubmit={onSubmit} onClose={onClose} />;
  }

  return <OnboardingBirthDateStep onSubmit={onSubmit} />;
}

function OnboardingBirthDateStep({
  onSubmit,
}: {
  onSubmit: (month: number, year: number) => Promise<void>;
}) {
  const copy = narrativeContent.childBirthDate;
  const { minYear, maxYear } = useMemo(() => childBirthYearRange(), []);
  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i),
    [minYear, maxYear],
  );

  const [month, setMonth] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const previewBand = useMemo(() => {
    if (month == null || year == null) return null;
    const validation = validateChildBirthMonthYear(month, year);
    if (!validation.ok) return null;
    const birthDate = parseBirthDate(validation.isoDate);
    if (!birthDate) return null;
    return computeAgeBand(birthDate) === "4-6" ? "ages 4–6" : "ages 6–12";
  }, [month, year]);

  const handleContinue = async () => {
    if (month == null || year == null || submitting) return;
    setError(null);
    const validation = validateChildBirthMonthYear(month, year);
    if (!validation.ok) {
      if (validation.error === "too_young" || validation.error === "too_old") {
        setError(copy.errorTooYoung);
      } else {
        setError(copy.errorInvalid);
      }
      return;
    }

    playPaperClick();
    setSubmitting(true);
    try {
      await onSubmit(month, year);
    } catch (err) {
      if (err instanceof Error && err.message === "sync_failed") {
        setError(copy.errorSyncFailed);
      } else {
        setError(copy.errorInvalid);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const pickerOptions =
    picker === "month"
      ? MONTH_LABELS.map((label, index) => ({ value: index + 1, label }))
      : picker === "year"
        ? years.map((y) => ({ value: y, label: String(y) }))
        : [];

  return (
    <Portrait916Frame>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headline}>{copy.headline}</Text>
            <Text style={styles.subtext}>{copy.subtext}</Text>
          </View>

          <View style={styles.fields}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.fieldBtn, pressed && styles.fieldBtnPressed]}
              onPress={() => {
                playPaperClick();
                setPicker("month");
              }}
            >
              <Text style={styles.fieldLabel}>Month</Text>
              <Text style={styles.fieldValue}>
                {month != null ? MONTH_LABELS[month - 1] : "Select month"}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.fieldBtn, pressed && styles.fieldBtnPressed]}
              onPress={() => {
                playPaperClick();
                setPicker("year");
              }}
            >
              <Text style={styles.fieldLabel}>Year</Text>
              <Text style={styles.fieldValue}>{year != null ? String(year) : "Select year"}</Text>
            </Pressable>
          </View>

          {previewBand ? (
            <Text style={styles.preview}>Questions will be tailored for {previewBand}.</Text>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label={copy.continueLabel}
            accessibilityLabel="Continue with child's birth date"
            accessibilityHint={
              month == null || year == null ? "Select month and year first" : undefined
            }
            disabled={month == null || year == null || submitting}
            busy={submitting}
            onPress={() => void handleContinue()}
          />

          <Text style={styles.reassurance}>{copy.reassurance}</Text>
        </ScrollView>

        <Modal
          visible={picker != null}
          transparent
          animationType="slide"
          onRequestClose={() => setPicker(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <ScrollView style={styles.modalList}>
                {pickerOptions.map((option) => (
                  <Pressable
                    key={`${picker}-${option.value}`}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.modalOption,
                      pressed && styles.modalOptionPressed,
                    ]}
                    onPress={() => {
                      playPaperClick();
                      if (picker === "month") setMonth(option.value);
                      if (picker === "year") setYear(option.value);
                      setPicker(null);
                      setError(null);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{option.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                accessibilityRole="button"
                style={styles.modalCancel}
                onPress={() => setPicker(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Portrait916Frame>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: spacing.inner,
    paddingTop: spacing.section,
    paddingBottom: spacing.section * 2,
    gap: spacing.section,
  },
  header: {
    gap: spacing.inner,
  },
  headline: {
    fontFamily: fontFamilies.heading,
    fontSize: 28,
    letterSpacing: -0.02 * 28,
    color: colors.textPrimary,
  },
  subtext: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  fields: {
    gap: spacing.inner,
  },
  fieldBtn: {
    minHeight: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.cardPadding,
    gap: 4,
  },
  fieldBtnPressed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  fieldLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  fieldValue: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: colors.textPrimary,
  },
  preview: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  error: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  continueBtn: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.inner,
  },
  continueBtnDisabled: {
    opacity: 0.45,
  },
  continueBtnPressed: {
    backgroundColor: colors.primaryHover,
  },
  continueBtnText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: colors.surface,
  },
  reassurance: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    opacity: 0.7,
    paddingHorizontal: spacing.inner,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(31, 26, 23, 0.25)",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "60%",
    paddingBottom: spacing.section,
  },
  modalList: {
    paddingVertical: spacing.inner,
  },
  modalOption: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.section,
  },
  modalOptionPressed: {
    backgroundColor: colors.primarySoft,
  },
  modalOptionText: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalCancel: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalCancelText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
