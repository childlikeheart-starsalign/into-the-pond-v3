import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ArrivalPondRipple } from "@/src/components/diary/ArrivalPondRipple";
import { DiaryPromptMultiselect } from "@/src/components/diary/DiaryPromptMultiselect";
import { DiaryShortText } from "@/src/components/diary/DiaryShortText";
import { DiarySingleSelect } from "@/src/components/diary/DiarySingleSelect";
import { PondBloomAnimation } from "@/src/components/diary/PondBloomAnimation";
import { ReflectionChipRow } from "@/src/components/diary/ReflectionChipRow";
import { TypewriterReveal } from "@/src/components/diary/TypewriterReveal";
import { colors, fontFamilies, layout, spacing } from "@/src/constants/theme";
import { suggestIntentionTrigger } from "@/src/features/diary/intentionAutofill";
import { formatProgressEcho, loadProgressEcho } from "@/src/features/diary/progressEchoStorage";
import {
  loadRitualDraft,
  saveRitualDraft,
  hasRitualProgress,
} from "@/src/features/diary/ritualDraftStorage";
import type {
  SelfCheckResponses,
  SelfCheckRitual,
  SelfCheckRitualStep,
} from "@/src/features/diary/types";
import { useRitualAmbientSound } from "@/src/hooks/useRitualAmbientSound";

const STEP_ORDER: SelfCheckRitualStep[] = [
  "arrival",
  "reframe",
  "moment-what",
  "moment-feeling",
  "moment-pause",
  "moment-different",
  "support",
  "intention",
  "closure",
];

const REFRAME_DISSOLVE_MS = 750;

function emptyResponses(): SelfCheckResponses {
  return {
    reframeAssumption: null,
    momentWhat: null,
    momentFeeling: null,
    momentPause: null,
    momentDifferent: "",
    supportNeeds: [],
    supportDetail: "",
    intentionTrigger: "",
    intentionAction: "",
  };
}

type DiaryRitualFlowProps = {
  ritual: SelfCheckRitual;
  onComplete: (responses: SelfCheckResponses) => void | Promise<void>;
  onExit: () => void;
  completing?: boolean;
};

export function DiaryRitualFlow({
  ritual,
  onComplete,
  onExit,
  completing = false,
}: DiaryRitualFlowProps) {
  const insets = useSafeAreaInsets();
  const reframeOpacity = useRef(new Animated.Value(1)).current;
  const [stepIndex, setStepIndex] = useState(0);
  const [responses, setResponses] = useState<SelfCheckResponses>(emptyResponses);
  const [arrivalLine, setArrivalLine] = useState(0);
  const [arrivalLineDone, setArrivalLineDone] = useState(false);
  const [closureBeat, setClosureBeat] = useState(0);
  const [progressEcho, setProgressEcho] = useState<string | null>(null);
  const [reframeDissolving, setReframeDissolving] = useState(false);
  const [triggerTouched, setTriggerTouched] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const step = STEP_ORDER[stepIndex] ?? "closure";

  useRitualAmbientSound({
    enabled: step === "arrival" || step === "closure",
    volume: step === "closure" ? 0.12 : 0.18,
  });

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    void loadProgressEcho().then((echo) => {
      if (echo) setProgressEcho(formatProgressEcho(echo));
    });
    void loadRitualDraft(ritual.lessonId).then((draft) => {
      if (draft) {
        setResponses(draft.responses);
        setStepIndex(Math.min(Math.max(0, draft.stepIndex), STEP_ORDER.length - 1));
      }
      setDraftReady(true);
    });
  }, [ritual.lessonId]);

  useEffect(() => {
    if (step !== "arrival") return;
    setArrivalLine(0);
    setArrivalLineDone(false);
  }, [step]);

  useEffect(() => {
    if (step !== "closure") return;
    setClosureBeat(reduceMotion ? 2 : 0);
  }, [step, reduceMotion]);

  const persistDraft = useCallback(
    (nextResponses: SelfCheckResponses, nextStepIndex: number) => {
      void saveRitualDraft(ritual.lessonId, nextResponses, nextStepIndex);
    },
    [ritual.lessonId],
  );

  useEffect(() => {
    if (!draftReady) return;
    persistDraft(responses, stepIndex);
  }, [draftReady, persistDraft, responses, stepIndex]);

  const patch = useCallback((partial: Partial<SelfCheckResponses>) => {
    setResponses((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleReframeSelect = useCallback(
    (value: string) => {
      if (reframeDissolving) return;
      patch({ reframeAssumption: value });
      setReframeDissolving(true);

      Animated.timing(reframeOpacity, {
        toValue: 0,
        duration: REFRAME_DISSOLVE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setReframeDissolving(false);
        reframeOpacity.setValue(1);
        setStepIndex((index) => Math.min(index + 1, STEP_ORDER.length - 1));
      });
    },
    [patch, reframeDissolving, reframeOpacity],
  );

  const canContinue = useMemo(() => {
    switch (step) {
      case "arrival":
        return arrivalLineDone && arrivalLine >= ritual.arrival.lines.length - 1;
      case "reframe":
        return false;
      case "moment-what":
        return responses.momentWhat !== null;
      case "moment-feeling":
        return responses.momentFeeling !== null;
      case "moment-pause":
        return responses.momentPause !== null;
      case "moment-different":
        return true;
      case "support":
        return responses.supportNeeds.length >= 1;
      case "intention":
        return (
          responses.intentionTrigger.trim().length > 0 &&
          responses.intentionAction.trim().length > 0
        );
      case "closure":
        return closureBeat >= 2;
      default:
        return false;
    }
  }, [step, responses, arrivalLineDone, arrivalLine, ritual, closureBeat]);

  const continueLabel = useMemo(() => {
    if (step === "closure") return ritual.closure.ctaLabel;
    if (step === "arrival") return ritual.arrival.ctaLabel;
    return "Continue";
  }, [step, ritual]);

  const showFooter = step !== "reframe";
  const isPlanting = completing && step === "closure";

  const handleContinue = useCallback(async () => {
    Keyboard.dismiss();

    if (step === "arrival" && !arrivalLineDone) return;
    if (isPlanting) return;

    if (step === "intention") {
      setStepIndex((index) => index + 1);
      return;
    }

    if (step === "closure") {
      try {
        await onComplete(responses);
      } catch (error) {
        console.warn("[DiaryRitualFlow] completion failed", error);
      }
      return;
    }

    setStepIndex((index) => Math.min(index + 1, STEP_ORDER.length - 1));
  }, [step, arrivalLineDone, isPlanting, onComplete, responses]);

  const handleExitPress = useCallback(() => {
    if (!hasRitualProgress(responses)) {
      onExit();
      return;
    }

    Alert.alert(
      "Leave for now?",
      "Your answers are saved on this device. You can come back to finish later.",
      [
        { text: "Keep reflecting", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: onExit },
      ],
    );
  }, [onExit, responses]);

  const handleArrivalLineComplete = useCallback(() => {
    setArrivalLineDone(true);
    if (arrivalLine < ritual.arrival.lines.length - 1) {
      setTimeout(
        () => {
          setArrivalLine((line) => line + 1);
          setArrivalLineDone(false);
        },
        reduceMotion ? 0 : 900,
      );
    }
  }, [arrivalLine, reduceMotion, ritual.arrival.lines.length]);

  useEffect(() => {
    if (step !== "closure" || reduceMotion) return;
    const delay = closureBeat === 0 ? 2000 : 2400;
    const timer = setTimeout(() => {
      setClosureBeat((beat) => Math.min(beat + 1, 2));
    }, delay);
    return () => clearTimeout(timer);
  }, [step, closureBeat, reduceMotion]);

  useEffect(() => {
    if (step !== "intention" || triggerTouched) return;
    const suggested = suggestIntentionTrigger(responses.momentWhat, responses.momentFeeling);
    if (suggested && !responses.intentionTrigger.trim()) {
      patch({ intentionTrigger: suggested });
    }
  }, [
    step,
    responses.momentWhat,
    responses.momentFeeling,
    responses.intentionTrigger,
    triggerTouched,
    patch,
  ]);

  const renderStep = () => {
    switch (step) {
      case "arrival":
        return (
          <View style={styles.arrival}>
            <ArrivalPondRipple active />
            <TypewriterReveal
              key={arrivalLine}
              text={ritual.arrival.lines[arrivalLine] ?? ""}
              instant={reduceMotion}
              onComplete={handleArrivalLineComplete}
            />
          </View>
        );

      case "reframe":
        return (
          <View style={styles.section}>
            {progressEcho ? (
              <View style={styles.echoCard}>
                <Text style={styles.echoText}>{progressEcho}</Text>
              </View>
            ) : null}
            <View style={styles.reframeCard}>
              <Text style={styles.reframeLabel}>{ritual.reframeRecall.cardTitle}</Text>
              <Text style={styles.reframeQuote}>{ritual.reframeRecall.reframe}</Text>
            </View>
            <Text style={styles.prompt}>{ritual.reframeRecall.prompt}</Text>
            <Animated.View style={{ opacity: reframeOpacity }}>
              <DiarySingleSelect
                options={ritual.reframeRecall.options}
                selected={responses.reframeAssumption}
                onChange={handleReframeSelect}
              />
            </Animated.View>
          </View>
        );

      case "moment-what":
      case "moment-feeling":
      case "moment-pause":
      case "moment-different": {
        const subStep =
          step === "moment-what"
            ? ritual.momentReplay.whatHappened
            : step === "moment-feeling"
              ? ritual.momentReplay.bodyFeeling
              : step === "moment-pause"
                ? ritual.momentReplay.pause
                : null;

        return (
          <View style={styles.section}>
            {step === "moment-what" ? (
              <Text style={styles.sectionIntro}>{ritual.momentReplay.intro}</Text>
            ) : null}
            {subStep ? (
              <>
                <Text style={styles.prompt}>{subStep.prompt}</Text>
                {step === "moment-pause" ? (
                  <DiarySingleSelect
                    options={ritual.momentReplay.pause.options}
                    selected={responses.momentPause}
                    onChange={(value) => patch({ momentPause: value })}
                  />
                ) : (
                  <ReflectionChipRow
                    options={subStep.options}
                    selected={
                      step === "moment-what" ? responses.momentWhat : responses.momentFeeling
                    }
                    onChange={(value) =>
                      patch(
                        step === "moment-what" ? { momentWhat: value } : { momentFeeling: value },
                      )
                    }
                  />
                )}
              </>
            ) : (
              <>
                <Text style={styles.prompt}>{ritual.momentReplay.different.prompt}</Text>
                <DiaryShortText
                  value={responses.momentDifferent}
                  maxLength={ritual.momentReplay.different.maxLength}
                  placeholder={ritual.momentReplay.different.placeholder}
                  onChange={(value) => patch({ momentDifferent: value })}
                />
              </>
            )}
          </View>
        );
      }

      case "support":
        return (
          <View style={styles.section}>
            <Text style={styles.prompt}>{ritual.supportNeeded.prompt}</Text>
            <DiaryPromptMultiselect
              question=""
              options={ritual.supportNeeded.options}
              selected={responses.supportNeeds}
              onChange={(value) => patch({ supportNeeds: value })}
              embedded
            />
            <Text style={styles.detailPrompt}>{ritual.supportNeeded.detailPrompt}</Text>
            <TextInput
              accessibilityLabel={ritual.supportNeeded.detailPrompt}
              style={styles.detailInput}
              value={responses.supportDetail}
              onChangeText={(text) => patch({ supportDetail: text })}
              multiline
              textAlignVertical="top"
              placeholder={ritual.supportNeeded.detailPlaceholder}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        );

      case "intention":
        return (
          <View style={styles.section}>
            <Text style={styles.prompt}>{ritual.intention.prompt}</Text>
            <View style={styles.intentionFields}>
              <TextInput
                accessibilityLabel="Moment to notice"
                style={styles.intentionInput}
                value={responses.intentionTrigger}
                onChangeText={(text) => {
                  setTriggerTouched(true);
                  patch({ intentionTrigger: text });
                }}
                placeholder={ritual.intention.triggerPlaceholder}
                placeholderTextColor={colors.textSecondary}
              />
              <TextInput
                accessibilityLabel="Tool to try"
                style={styles.intentionInput}
                value={responses.intentionAction}
                onChangeText={(text) => patch({ intentionAction: text })}
                placeholder={ritual.intention.actionPlaceholder}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <Text style={styles.suggestionLabel}>{ritual.intention.toolsLabel}</Text>
            <View style={styles.suggestions}>
              {ritual.intention.actionSuggestions.map((suggestion) => {
                const selected = responses.intentionAction === suggestion;
                return (
                  <Pressable
                    key={suggestion}
                    accessibilityRole="button"
                    accessibilityLabel={suggestion}
                    accessibilityState={{ selected }}
                    style={[styles.suggestionChip, selected && styles.suggestionChipSelected]}
                    onPress={() => patch({ intentionAction: suggestion })}
                  >
                    <Text
                      style={[styles.suggestionText, selected && styles.suggestionTextSelected]}
                    >
                      {suggestion}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );

      case "closure":
        return (
          <View style={styles.closure}>
            <PondBloomAnimation active />
            {closureBeat >= 0 ? (
              <Text style={styles.closureLine}>{ritual.closure.lines[0]}</Text>
            ) : null}
            {closureBeat >= 1 ? (
              <Text style={[styles.closureLine, styles.closureLineGap]}>
                {ritual.closure.lines[1]}
              </Text>
            ) : null}
            {closureBeat >= 2 ? (
              <Text style={[styles.nextLesson, styles.closureLineGap]}>
                {ritual.closure.nextLessonLabel}
              </Text>
            ) : null}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, spacing.inner) }]}>
        {step !== "closure" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Leave reflection"
            style={styles.exitButton}
            onPress={handleExitPress}
          >
            <Text style={styles.exitText}>Leave</Text>
          </Pressable>
        ) : (
          <View style={styles.exitButton} />
        )}
        <Text style={styles.topTitle}>{ritual.title}</Text>
        <View style={styles.exitButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(showFooter ? 120 : 32, insets.bottom + (showFooter ? 100 : 16)),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      {showFooter ? (
        <View style={[styles.footer, { paddingBottom: Math.max(spacing.inner, insets.bottom) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={continueLabel}
            accessibilityState={{ disabled: !canContinue || isPlanting }}
            style={[
              layout.btnPrimary,
              styles.continueButton,
              (!canContinue || isPlanting) && styles.disabled,
            ]}
            disabled={!canContinue || isPlanting}
            onPress={() => {
              void handleContinue();
            }}
          >
            {isPlanting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={layout.btnPrimaryText}>{continueLabel}</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.inner,
    paddingBottom: spacing.inner,
  },
  exitButton: {
    minWidth: 56,
    minHeight: 48,
    justifyContent: "center",
  },
  exitText: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 16,
    fontSize: 18,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.inner,
    paddingTop: spacing.section,
    flexGrow: 1,
  },
  arrival: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.section,
    minHeight: 360,
    paddingHorizontal: spacing.inner,
  },
  section: {
    gap: spacing.inner,
  },
  sectionIntro: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 18,
    fontSize: 22,
    lineHeight: 30,
    color: colors.textPrimary,
  },
  echoCard: {
    backgroundColor: "#DEEAF2",
    borderRadius: 14,
    padding: spacing.inner,
  },
  echoText: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  reframeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    gap: spacing.inner,
  },
  reframeLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  reframeQuote: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 20,
    fontSize: 22,
    lineHeight: 32,
    color: colors.textPrimary,
  },
  prompt: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 18,
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  detailPrompt: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.inner,
  },
  detailInput: {
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.inner,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    backgroundColor: "#F3EBE0",
  },
  intentionFields: {
    gap: spacing.tapGap,
  },
  intentionInput: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.inner,
    paddingVertical: 12,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: "#FAF7F2",
  },
  suggestionLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.tapGap,
  },
  suggestionChip: {
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF7F2",
  },
  suggestionChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  suggestionText: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 15,
    color: colors.textSecondary,
  },
  suggestionTextSelected: {
    color: colors.primary,
  },
  closure: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.section,
    minHeight: 380,
    paddingHorizontal: spacing.inner,
  },
  closureLine: {
    fontFamily: fontFamilies.heading,
    letterSpacing: -0.02 * 22,
    fontSize: 24,
    lineHeight: 34,
    color: colors.textPrimary,
    textAlign: "center",
  },
  closureLineGap: {
    marginTop: spacing.section,
  },
  nextLesson: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.inner,
    paddingTop: spacing.inner,
    backgroundColor: "rgba(250, 247, 242, 0.96)",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    width: "100%",
  },
  disabled: {
    opacity: 0.45,
  },
});
