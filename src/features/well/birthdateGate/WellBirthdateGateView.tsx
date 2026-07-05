import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { narrativeContent } from "@/src/constants/narrative/narrativeContent";
import {
  childBirthYearRange,
  validateChildBirthMonthYear,
} from "@/src/features/onboarding/validateChildBirthDate";
import {
  BirthdatePickerModal,
  type BirthdatePickerOption,
} from "@/src/features/well/birthdateGate/BirthdatePickerModal";
import { WellBirthdateBackground } from "@/src/features/well/birthdateGate/WellBirthdateBackground";
import { WellBirthdateCard } from "@/src/features/well/birthdateGate/WellBirthdateCard";
import {
  getWellBirthdateCardBottomInset,
  wellBirthdateLayout,
} from "@/src/features/well/birthdateGate/wellBirthdateTokens";
import { WellTopBar } from "@/src/features/well/WellTopBar";
import { computeAgeBand, parseBirthDate } from "@/shared/sanctuary/well/computeAgeBand";

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

type PickerKind = "month" | "year" | null;

type StageSize = { width: number; height: number };

type WellBirthdateGateViewProps = {
  onSubmit: (month: number, year: number) => Promise<void>;
  onClose?: () => void;
};

export function WellBirthdateGateView({ onSubmit, onClose }: WellBirthdateGateViewProps) {
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
  const [stage, setStage] = useState<StageSize>({ width: 0, height: 0 });

  const cardBottomInset = useMemo(
    () => getWellBirthdateCardBottomInset(stage.height),
    [stage.height],
  );

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        opacity.value = withTiming(1, { duration: 200 });
        return;
      }
      opacity.value = withDelay(
        400,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
      );
      translateY.value = withDelay(
        400,
        withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
      );
    });
  }, [opacity, translateY]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const previewBand = useMemo(() => {
    if (month == null || year == null) return null;
    const validation = validateChildBirthMonthYear(month, year);
    if (!validation.ok) return null;
    const birthDate = parseBirthDate(validation.isoDate);
    if (!birthDate) return null;
    return computeAgeBand(birthDate) === "4-6" ? "ages 4–6" : "ages 6–12";
  }, [month, year]);

  const canContinue = month != null && year != null && !submitting;

  const pickerOptions: BirthdatePickerOption[] =
    picker === "month"
      ? MONTH_LABELS.map((label, index) => ({ value: index + 1, label }))
      : picker === "year"
        ? years.map((y) => ({ value: y, label: String(y) }))
        : [];

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

  const previewText = previewBand ? `Questions will be tailored for ${previewBand}.` : null;

  const handleStageLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setStage({ width, height });
  };

  return (
    <WellBirthdateBackground>
      <View style={styles.safe} onLayout={handleStageLayout}>
        {onClose ? <WellTopBar onClose={onClose} /> : null}

        <Animated.View
          style={[
            styles.cardLayer,
            {
              bottom: cardBottomInset,
              paddingHorizontal: wellBirthdateLayout.horizontalPadding,
            },
            contentStyle,
          ]}
        >
          <WellBirthdateCard
            monthLabel={month != null ? MONTH_LABELS[month - 1] : "Select month"}
            yearLabel={year != null ? String(year) : "Select year"}
            monthPlaceholder="Select month"
            yearPlaceholder="Select year"
            continueLabel={copy.continueLabel}
            canContinue={canContinue}
            previewText={previewText}
            errorText={error}
            onPressMonth={() => setPicker("month")}
            onPressYear={() => setPicker("year")}
            onContinue={() => void handleContinue()}
          />
        </Animated.View>

        <BirthdatePickerModal
          visible={picker != null}
          options={pickerOptions}
          onSelect={(value) => {
            if (picker === "month") setMonth(value);
            if (picker === "year") setYear(value);
            setPicker(null);
            setError(null);
          }}
          onClose={() => setPicker(null)}
        />
      </View>
    </WellBirthdateBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  cardLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
