import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useRef, useState, type ComponentProps } from "react";
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

import type { QuickCheckArchetype } from "@/shared/childProfile/archetypeQuickCheck";
import { QUICK_CHECK_QUESTIONS } from "@/src/constants/archetypeDiagnostics";
import {
  STORY_LONG_CARD,
  STORY_PAPER_INPUT_CARD,
  STORY_QUICK_CHECK_CARD,
} from "@/src/constants/storyAssets";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { playPaperClick } from "@/src/services/audio/playPaperClick";

type ArchetypeQuickCheckProps = {
  onComplete: (answers: QuickCheckArchetype[]) => void;
  initialAnswers?: QuickCheckArchetype[];
};

type SpecimenIcon = ComponentProps<typeof MaterialCommunityIcons>["name"];

const INK: Record<QuickCheckArchetype, SpecimenIcon> = {
  storm: "leaf",
  wall: "sprout",
  spark: "flower-outline",
};

const SPECIMEN_LABEL: Record<QuickCheckArchetype, string> = {
  storm: "STORM PATH",
  wall: "STILL PATH",
  spark: "SPARK PATH",
};

const SPECIMEN_ROTATE = ["-0.7deg", "0.5deg", "-0.4deg"] as const;

const INK_WARM = "#2B241D";
const LONG_ANSWER_WORD_THRESHOLD = 15;

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function ArchetypeQuickCheck({ onComplete, initialAnswers = [] }: ArchetypeQuickCheckProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [index, setIndex] = useState(
    Math.min(initialAnswers.length, QUICK_CHECK_QUESTIONS.length - 1),
  );
  const [answers, setAnswers] = useState<QuickCheckArchetype[]>(initialAnswers);
  const [pressedArchetype, setPressedArchetype] = useState<QuickCheckArchetype | null>(null);
  const slide = useRef(new Animated.Value(0)).current;
  const locked = useRef(false);

  const question = QUICK_CHECK_QUESTIONS[index];
  const plateWidth = Math.min(screenWidth * 0.92, 440);
  const contentPadH = Math.round(plateWidth * 0.115);
  const contentPadV = Math.round(plateWidth * 0.09);

  const select = useCallback(
    (archetype: QuickCheckArchetype) => {
      if (locked.current) return;
      locked.current = true;
      playPaperClick();
      const nextAnswers = [...answers.slice(0, index), archetype];
      setAnswers(nextAnswers);

      Animated.timing(slide, {
        toValue: -28,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        slide.setValue(24);
        if (index >= QUICK_CHECK_QUESTIONS.length - 1) {
          onComplete(nextAnswers);
          locked.current = false;
          return;
        }
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
    },
    [answers, index, onComplete, slide],
  );

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View
        style={styles.leafTrail}
        accessibilityLabel={`Question ${index + 1} of ${QUICK_CHECK_QUESTIONS.length}`}
        accessibilityRole="progressbar"
      >
        {QUICK_CHECK_QUESTIONS.map((q, i) => {
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
            <Text style={styles.scenario}>{question.scenario}</Text>
            <View style={styles.options}>
              {question.options.map((option, optionIndex) => {
                const selected = answers[index] === option.archetype;
                const pressed = pressedArchetype === option.archetype;
                const isLong = wordCount(option.label) > LONG_ANSWER_WORD_THRESHOLD;
                return (
                  <Pressable
                    key={option.archetype}
                    style={[
                      styles.specimen,
                      isLong && styles.specimenLong,
                      { transform: [{ rotate: SPECIMEN_ROTATE[optionIndex] ?? "0deg" }] },
                      selected && styles.specimenSelected,
                      pressed && styles.specimenPressed,
                    ]}
                    onPressIn={() => setPressedArchetype(option.archetype)}
                    onPressOut={() => setPressedArchetype(null)}
                    onPress={() => select(option.archetype)}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected }}
                  >
                    <ImageBackground
                      source={isLong ? STORY_LONG_CARD : STORY_PAPER_INPUT_CARD}
                      style={[styles.specimenPaper, isLong && styles.specimenPaperLong]}
                      imageStyle={styles.specimenPaperImage}
                      resizeMode="stretch"
                    >
                      <MaterialCommunityIcons
                        name={INK[option.archetype]}
                        size={16}
                        color={selected ? colors.secondary : colors.primary}
                        style={[styles.specimenLeaf, isLong && styles.specimenLeafLong]}
                      />
                      <Text style={styles.specimenLabel}>{SPECIMEN_LABEL[option.archetype]}</Text>
                      <Text style={styles.specimenValue}>{option.label}</Text>
                    </ImageBackground>
                  </Pressable>
                );
              })}
            </View>
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
    letterSpacing: -0.02 * 18.4,
    fontSize: 18.4,
    lineHeight: 25.2,
    color: INK_WARM,
    textAlign: "left",
  },
  options: {
    marginTop: -6,
    gap: spacing.tapGap,
  },
  specimen: {
    minHeight: 77,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(122, 92, 69, 0.22)",
    backgroundColor: colors.bg,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 1, height: 2 },
    elevation: 2,
    overflow: "visible",
  },
  specimenLong: {
    minHeight: 96,
  },
  specimenPressed: {
    opacity: 0.82,
    top: 2,
  },
  specimenSelected: {
    borderColor: colors.secondary,
  },
  specimenPaper: {
    alignSelf: "stretch",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    paddingRight: 30,
  },
  specimenPaperLong: {
    minHeight: 96,
    paddingVertical: 16,
    paddingBottom: 22,
  },
  specimenPaperImage: {
    borderRadius: 8,
    opacity: 0.98,
  },
  specimenLeaf: {
    position: "absolute",
    top: 10,
    right: 11,
    opacity: 0.72,
  },
  specimenLeafLong: {
    top: 14,
    right: 14,
  },
  specimenLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.2,
    color: colors.primary,
    marginBottom: 4,
  },
  specimenValue: {
    marginTop: 3,
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    flexShrink: 1,
  },
});
