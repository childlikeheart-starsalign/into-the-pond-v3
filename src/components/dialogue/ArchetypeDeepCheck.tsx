import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import type { DeepCheckAxisPair } from "@/shared/childProfile/archetypeDeepCheck";
import { DEEP_CHECK_SCENARIO_COUNT } from "@/shared/childProfile/archetypeDeepCheck";
import {
  DEEP_CHECK_SCENARIOS,
  DEEP_CHECK_SLIDER_A,
  DEEP_CHECK_SLIDER_B,
} from "@/src/constants/archetypeDiagnostics";
import { STORY_QUICK_CHECK_CARD } from "@/src/constants/storyAssets";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { playPaperClick } from "@/src/services/audio/playPaperClick";

type Props = {
  onComplete: (answers: DeepCheckAxisPair[]) => void;
};

const INK_WARM = "#2B241D";
/** Five discrete placements mapped to 0–100. */
const AXIS_STEPS = [0, 25, 50, 75, 100] as const;

function AxisStepper({
  question,
  minLabel,
  maxLabel,
  value,
  onChange,
}: {
  question: string;
  minLabel: string;
  maxLabel: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <View style={styles.axisBlock}>
      <Text style={styles.axisQuestion}>{question}</Text>
      <View style={styles.track} accessibilityRole="adjustable" accessibilityLabel={question}>
        {AXIS_STEPS.map((step) => {
          const selected = step === value;
          return (
            <Pressable
              key={step}
              accessibilityRole="button"
              accessibilityLabel={`${question}: ${step}`}
              accessibilityState={{ selected }}
              style={[styles.step, selected && styles.stepSelected]}
              onPress={() => {
                playPaperClick();
                onChange(step);
              }}
            >
              <View style={[styles.stepDot, selected && styles.stepDotSelected]} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.axisLabels}>
        <Text style={styles.axisLabel}>{minLabel}</Text>
        <Text style={[styles.axisLabel, styles.axisLabelRight]}>{maxLabel}</Text>
      </View>
    </View>
  );
}

/**
 * Deep Check quiz — Quick Check plate + leaf trail; two bipolar steppers per scenario.
 */
export function ArchetypeDeepCheck({ onComplete }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<DeepCheckAxisPair[]>([]);
  const [expression, setExpression] = useState(50);
  const [driver, setDriver] = useState(50);
  const slide = useRef(new Animated.Value(0)).current;
  const locked = useRef(false);

  const scenario = DEEP_CHECK_SCENARIOS[index];
  const plateWidth = Math.min(screenWidth * 0.92, 440);
  const contentPadH = Math.round(plateWidth * 0.115);
  const contentPadV = Math.round(plateWidth * 0.09);

  const advance = useCallback(() => {
    if (locked.current || !scenario) return;
    locked.current = true;
    playPaperClick();
    const pair: DeepCheckAxisPair = { expression, driver };
    const nextAnswers = [...answers.slice(0, index), pair];
    setAnswers(nextAnswers);

    Animated.timing(slide, {
      toValue: -28,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      slide.setValue(24);
      if (index >= DEEP_CHECK_SCENARIO_COUNT - 1) {
        onComplete(nextAnswers);
        locked.current = false;
        return;
      }
      setExpression(50);
      setDriver(50);
      setIndex((i) => i + 1);
      Animated.timing(slide, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        locked.current = false;
      });
    });
  }, [answers, driver, expression, index, onComplete, scenario, slide]);

  if (!scenario) return null;

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View
        style={styles.leafTrail}
        accessibilityLabel={`Question ${index + 1} of ${DEEP_CHECK_SCENARIO_COUNT}`}
        accessibilityRole="progressbar"
      >
        {DEEP_CHECK_SCENARIOS.map((q, i) => {
          const filled = i <= index;
          return (
            <View key={q.id} style={styles.leafSlot}>
              {filled ? (
                <MaterialCommunityIcons name="leaf" size={15} color={colors.primarySoft} />
              ) : (
                <View style={styles.emptyMark} />
              )}
            </View>
          );
        })}
      </View>

      <Animated.View style={[styles.plateMotion, { transform: [{ translateX: slide }] }]}>
        <ImageBackground
          source={STORY_QUICK_CHECK_CARD}
          style={[styles.plate, { width: plateWidth }]}
          imageStyle={styles.plateImage}
          resizeMode="stretch"
        >
          <View
            style={[
              styles.plateInner,
              {
                paddingHorizontal: contentPadH,
                paddingTop: contentPadV,
                paddingBottom: Math.round(contentPadV * 1.15),
              },
            ]}
          >
            <Text style={styles.scenario}>{scenario.scenario}</Text>

            <AxisStepper
              question={DEEP_CHECK_SLIDER_A.question}
              minLabel={DEEP_CHECK_SLIDER_A.minLabel}
              maxLabel={DEEP_CHECK_SLIDER_A.maxLabel}
              value={expression}
              onChange={setExpression}
            />
            <AxisStepper
              question={DEEP_CHECK_SLIDER_B.question}
              minLabel={DEEP_CHECK_SLIDER_B.minLabel}
              maxLabel={DEEP_CHECK_SLIDER_B.maxLabel}
              value={driver}
              onChange={setDriver}
            />

            <Pressable
              style={({ pressed }) => [styles.continueBtn, pressed && styles.continuePressed]}
              onPress={advance}
              accessibilityRole="button"
              accessibilityLabel={
                index >= DEEP_CHECK_SCENARIO_COUNT - 1 ? "Finish Deep Check" : "Continue"
              }
            >
              <MaterialCommunityIcons
                name="leaf"
                size={14}
                color={colors.primary}
                style={styles.continueLeaf}
              />
              <Text style={styles.continueLabel}>
                {index >= DEEP_CHECK_SCENARIO_COUNT - 1 ? "See their page" : "Continue"}
              </Text>
            </Pressable>
          </View>
        </ImageBackground>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.inner,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  leafTrail: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  leafSlot: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239, 228, 218, 0.7)",
    backgroundColor: "transparent",
  },
  plateMotion: {
    alignItems: "center",
    marginLeft: 3,
  },
  plate: {
    maxWidth: 440,
    borderRadius: 4,
    overflow: "visible",
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  plateImage: {
    borderRadius: 2,
  },
  plateInner: {
    gap: spacing.inner,
  },
  scenario: {
    marginTop: 34,
    fontFamily: fontFamilies.headingRegular,
    letterSpacing: -0.02 * 17,
    fontSize: 17,
    lineHeight: 24,
    color: INK_WARM,
    textAlign: "left",
  },
  axisBlock: {
    gap: 8,
  },
  axisQuestion: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  track: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  step: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  stepSelected: {
    opacity: 1,
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  stepDotSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  axisLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  axisLabel: {
    flex: 1,
    fontFamily: fontFamilies.body,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  axisLabelRight: {
    textAlign: "right",
  },
  continueBtn: {
    marginTop: 4,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.tapGap,
  },
  continuePressed: {
    opacity: 0.72,
  },
  continueLeaf: {
    opacity: 0.68,
    transform: [{ rotate: "-18deg" }],
  },
  continueLabel: {
    fontFamily: fontFamilies.handwritten,
    fontSize: 17.5,
    lineHeight: 23.9,
    color: colors.primary,
  },
});
