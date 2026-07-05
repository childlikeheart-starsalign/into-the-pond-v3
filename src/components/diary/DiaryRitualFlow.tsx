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
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { DiaryPromptMultiselect } from "@/src/components/diary/DiaryPromptMultiselect";
import { DiaryPromptSlider } from "@/src/components/diary/DiaryPromptSlider";
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
import { Sentry } from "@/src/services/sentry/init";

const DEFAULT_STEP_ORDER: SelfCheckRitualStep[] = [
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
    ruleAssumption: null,
    bodyFirst: "",
    regulationLevel: null,
    regulationContext: "",
    gapMoves: [],
    gapOther: "",
    noticingResponse: "",
    compassionStory: "",
    compassionTruth: null,
    smallestNextStep: "",
    tinyWin: null,
    loopBreakStep: null,
    loopBreakWhy: "",
    loopBreakAlreadyDone: "",
    scriptFeelsReal: null,
    scriptInMyVoice: "",
    scriptBodyResponse: "",
    toneVersusWords: "",
    biggestObstacle: "",
    obstacleWorkaround: "",
    trySituation: "",
    tryNotice: "",
    tryRegulate: "",
    tryConnectSupport: "",
    tryMinimumStep: "",
    trySelfCompassion: "",
    whatShiftedMarks: [],
    whatShiftedTakeaway: "",
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

function getMomentTryValue(responses: SelfCheckResponses, fieldId: string): string {
  switch (fieldId) {
    case "trySituation":
      return responses.trySituation;
    case "tryNotice":
      return responses.tryNotice;
    case "tryRegulate":
      return responses.tryRegulate;
    case "tryConnectSupport":
      return responses.tryConnectSupport;
    case "tryMinimumStep":
      return responses.tryMinimumStep;
    case "trySelfCompassion":
      return responses.trySelfCompassion;
    default:
      return "";
  }
}

function patchMomentTryField(
  patch: (partial: Partial<SelfCheckResponses>) => void,
  fieldId: string,
  value: string,
) {
  switch (fieldId) {
    case "trySituation":
      patch({ trySituation: value });
      break;
    case "tryNotice":
      patch({ tryNotice: value });
      break;
    case "tryRegulate":
      patch({ tryRegulate: value });
      break;
    case "tryConnectSupport":
      patch({ tryConnectSupport: value });
      break;
    case "tryMinimumStep":
      patch({ tryMinimumStep: value });
      break;
    case "trySelfCompassion":
      patch({ trySelfCompassion: value });
      break;
    default:
      break;
  }
}

function applyExclusiveMultiselect(
  value: string[],
  previous: string[],
  exclusive?: string,
): string[] {
  if (!exclusive) return value;

  const hadExclusive = previous.includes(exclusive);
  const hasExclusive = value.includes(exclusive);

  if (hasExclusive && !hadExclusive) return [exclusive];
  if (hadExclusive && hasExclusive && value.length > 1) {
    return value.filter((item) => item !== exclusive);
  }
  if (hasExclusive) return [exclusive];
  return value;
}

function renderSectionHeader(sectionLabel: string, helper?: string) {
  return (
    <>
      <Text style={styles.sectionLabel}>{sectionLabel}</Text>
      {helper?.trim() ? <Text style={styles.helperText}>{helper}</Text> : null}
    </>
  );
}

function renderQuotedRecallStep(
  block: { cardTitle: string; reframe: string; prompt: string },
  options: string[],
  selected: string | null,
  onChange: (value: string) => void,
  opacity: Animated.Value,
) {
  return (
    <View style={styles.section}>
      <View style={styles.reframeCard}>
        <Text style={styles.reframeLabel}>{block.cardTitle}</Text>
        <Text style={styles.reframeQuote}>{block.reframe}</Text>
      </View>
      {block.prompt.trim() ? <Text style={styles.prompt}>{block.prompt}</Text> : null}
      <Animated.View style={{ opacity }}>
        <DiarySingleSelect options={options} selected={selected} onChange={onChange} />
      </Animated.View>
    </View>
  );
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
  const ruleOpacity = useRef(new Animated.Value(1)).current;
  const [stepIndex, setStepIndex] = useState(0);
  const [responses, setResponses] = useState<SelfCheckResponses>(emptyResponses);
  const [arrivalLine, setArrivalLine] = useState(0);
  const [arrivalLineDone, setArrivalLineDone] = useState(false);
  const [closureBeat, setClosureBeat] = useState(0);
  const [progressEcho, setProgressEcho] = useState<string | null>(null);
  const [reframeDissolving, setReframeDissolving] = useState(false);
  const [ruleDissolving, setRuleDissolving] = useState(false);
  const [triggerTouched, setTriggerTouched] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const stepOrder = ritual.steps.length > 0 ? ritual.steps : DEFAULT_STEP_ORDER;
  const maxStepIndex = stepOrder.length - 1;
  const step = stepOrder[stepIndex] ?? "closure";

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
        setStepIndex(Math.min(Math.max(0, draft.stepIndex), maxStepIndex));
      }
      setDraftReady(true);
    });
  }, [maxStepIndex, ritual.lessonId]);

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

  const advanceAfterQuotedSelect = useCallback(
    (
      value: string,
      field: "reframeAssumption" | "ruleAssumption",
      dissolving: boolean,
      setDissolving: (next: boolean) => void,
      opacity: Animated.Value,
    ) => {
      if (dissolving) return;
      patch({ [field]: value });
      setDissolving(true);

      Animated.timing(opacity, {
        toValue: 0,
        duration: REFRAME_DISSOLVE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setDissolving(false);
        opacity.setValue(1);
        setStepIndex((index) => Math.min(index + 1, maxStepIndex));
      });
    },
    [maxStepIndex, patch],
  );

  const handleReframeSelect = useCallback(
    (value: string) => {
      advanceAfterQuotedSelect(
        value,
        "reframeAssumption",
        reframeDissolving,
        setReframeDissolving,
        reframeOpacity,
      );
    },
    [advanceAfterQuotedSelect, reframeDissolving, reframeOpacity],
  );

  const handleRuleSelect = useCallback(
    (value: string) => {
      advanceAfterQuotedSelect(
        value,
        "ruleAssumption",
        ruleDissolving,
        setRuleDissolving,
        ruleOpacity,
      );
    },
    [advanceAfterQuotedSelect, ruleDissolving, ruleOpacity],
  );

  const handleSupportChange = useCallback(
    (value: string[]) => {
      patch({
        supportNeeds: applyExclusiveMultiselect(
          value,
          responses.supportNeeds,
          ritual.supportNeeded?.exclusiveOption,
        ),
      });
    },
    [patch, responses.supportNeeds, ritual.supportNeeded?.exclusiveOption],
  );

  const handleWhatShiftedChange = useCallback(
    (value: string[]) => {
      patch({
        whatShiftedMarks: applyExclusiveMultiselect(
          value,
          responses.whatShiftedMarks,
          ritual.whatShifted?.exclusiveOption,
        ),
      });
    },
    [patch, responses.whatShiftedMarks, ritual.whatShifted?.exclusiveOption],
  );

  const scriptVoiceYesOption = ritual.scriptVoice?.options[0] ?? "";
  const showScriptFollowUp =
    responses.scriptFeelsReal !== null && responses.scriptFeelsReal !== scriptVoiceYesOption;

  const showOtherDetail =
    ritual.supportNeeded?.otherOption != null &&
    responses.supportNeeds.includes(ritual.supportNeeded.otherOption);

  const canContinue = useMemo(() => {
    switch (step) {
      case "arrival":
        return arrivalLineDone && arrivalLine >= ritual.arrival.lines.length - 1;
      case "reframe":
        return false;
      case "rule":
        return false;
      case "body-first":
        return responses.bodyFirst.trim().length > 0;
      case "honest-inventory":
        if (responses.regulationLevel === null) return false;
        if (ritual.honestInventory?.followUpOptional) return true;
        return responses.regulationContext.trim().length > 0;
      case "the-gap":
        return responses.gapMoves.length >= 1;
      case "noticing":
        return responses.noticingResponse.trim().length > 0;
      case "compassion":
        return responses.compassionStory.trim().length > 0 && responses.compassionTruth !== null;
      case "next-step":
        return responses.smallestNextStep.trim().length > 0;
      case "tiny-win":
        return responses.tinyWin !== null;
      case "loop-break":
        return (
          responses.loopBreakStep !== null &&
          responses.loopBreakWhy.trim().length > 0 &&
          (ritual.loopBreak?.secondFollowUpPrompt
            ? responses.loopBreakAlreadyDone.trim().length > 0
            : true)
        );
      case "script-voice":
        if (responses.scriptFeelsReal === null) return false;
        if (showScriptFollowUp && responses.scriptInMyVoice.trim().length === 0) return false;
        if (ritual.scriptVoice?.embodimentPrompt) {
          return responses.scriptBodyResponse.trim().length > 0;
        }
        return true;
      case "tone-reflect":
        return responses.toneVersusWords.trim().length > 0;
      case "obstacle-pair":
        return (
          responses.biggestObstacle.trim().length > 0 &&
          responses.obstacleWorkaround.trim().length > 0
        );
      case "moment-try": {
        if (!ritual.momentTry) return false;
        for (const field of ritual.momentTry.fields) {
          if (field.optional) continue;
          if (!getMomentTryValue(responses, field.id).trim()) return false;
        }
        return true;
      }
      case "what-shifted":
        return responses.whatShiftedMarks.length >= 1;
      case "moment-what":
        return responses.momentWhat !== null;
      case "moment-feeling":
        return responses.momentFeeling !== null;
      case "moment-pause":
        return responses.momentPause !== null;
      case "moment-different":
        return true;
      case "support": {
        if (responses.supportNeeds.length < 1) return false;
        const other = ritual.supportNeeded?.otherOption;
        if (other && responses.supportNeeds.includes(other)) {
          return responses.supportDetail.trim().length > 0;
        }
        return true;
      }
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
  }, [step, responses, arrivalLineDone, arrivalLine, ritual, closureBeat, showScriptFollowUp]);

  const continueLabel = useMemo(() => {
    if (step === "closure") return ritual.closure.ctaLabel;
    if (step === "arrival") return ritual.arrival.ctaLabel;
    return "Continue";
  }, [step, ritual]);

  const showFooter = step !== "reframe" && step !== "rule";
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
        Sentry.captureException(error, {
          tags: { area: "diary", flow: "ritual_completion" },
        });
      }
      return;
    }

    setStepIndex((index) => Math.min(index + 1, maxStepIndex));
  }, [step, arrivalLineDone, isPlanting, maxStepIndex, onComplete, responses]);

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
    if (step !== "intention" || triggerTouched || !ritual.intention) return;
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
        if (!ritual.reframeRecall) return null;
        return (
          <View style={styles.section}>
            {progressEcho ? (
              <View style={styles.echoCard}>
                <Text style={styles.echoText}>{progressEcho}</Text>
              </View>
            ) : null}
            {renderQuotedRecallStep(
              ritual.reframeRecall,
              ritual.reframeRecall.options,
              responses.reframeAssumption,
              handleReframeSelect,
              reframeOpacity,
            )}
          </View>
        );

      case "body-first": {
        if (!ritual.bodyFirst) return null;
        const block = ritual.bodyFirst;
        return (
          <View style={styles.section}>
            {renderSectionHeader(block.sectionLabel, block.helper)}
            <Text style={styles.prompt}>{block.prompt}</Text>
            <DiaryShortText
              value={responses.bodyFirst}
              maxLength={block.maxLength ?? 400}
              placeholder={block.placeholder}
              onChange={(value) => patch({ bodyFirst: value })}
            />
          </View>
        );
      }

      case "honest-inventory": {
        if (!ritual.honestInventory) return null;
        const block = ritual.honestInventory;
        const sliderValue = responses.regulationLevel ?? block.min;
        return (
          <View style={styles.section}>
            {renderSectionHeader(block.sectionLabel, block.helper)}
            <DiaryPromptSlider
              question={block.prompt}
              min={block.min}
              max={block.max}
              minLabel={block.minLabel}
              maxLabel={block.maxLabel}
              value={sliderValue}
              embedded
              onChange={(value) => patch({ regulationLevel: value })}
            />
            <Text style={styles.prompt}>{block.followUpPrompt}</Text>
            <DiaryShortText
              value={responses.regulationContext}
              maxLength={400}
              placeholder={block.followUpPlaceholder}
              onChange={(value) => patch({ regulationContext: value })}
            />
          </View>
        );
      }

      case "the-gap": {
        if (!ritual.theGap) return null;
        const block = ritual.theGap;
        return (
          <View style={styles.section}>
            {renderSectionHeader(block.sectionLabel, block.helper)}
            <Text style={styles.prompt}>{block.prompt}</Text>
            <DiaryPromptMultiselect
              question=""
              options={block.options}
              selected={responses.gapMoves}
              onChange={(value) => patch({ gapMoves: value })}
              embedded
            />
            {block.detailPrompt ? (
              <>
                <Text style={styles.detailPrompt}>{block.detailPrompt}</Text>
                <TextInput
                  accessibilityLabel={block.detailPrompt}
                  style={styles.detailInput}
                  value={responses.gapOther}
                  onChangeText={(text) => patch({ gapOther: text })}
                  multiline
                  textAlignVertical="top"
                  placeholder={block.detailPlaceholder}
                  placeholderTextColor={colors.textSecondary}
                />
              </>
            ) : null}
          </View>
        );
      }

      case "noticing": {
        if (!ritual.noticing) return null;
        const block = ritual.noticing;
        return (
          <View style={styles.section}>
            {renderSectionHeader(block.sectionLabel, block.helper)}
            <Text style={styles.prompt}>{block.prompt}</Text>
            <DiaryShortText
              value={responses.noticingResponse}
              maxLength={block.maxLength ?? 500}
              placeholder={block.placeholder}
              onChange={(value) => patch({ noticingResponse: value })}
            />
          </View>
        );
      }

      case "compassion": {
        if (!ritual.compassion) return null;
        const block = ritual.compassion;
        return (
          <View style={styles.section}>
            {renderSectionHeader(block.sectionLabel, block.storyHelper)}
            <Text style={styles.prompt}>{block.storyPrompt}</Text>
            <DiaryShortText
              value={responses.compassionStory}
              maxLength={500}
              placeholder={block.storyPlaceholder}
              onChange={(value) => patch({ compassionStory: value })}
            />
            <Text style={[styles.prompt, styles.promptGap]}>{block.truthPrompt}</Text>
            <DiarySingleSelect
              options={block.options}
              selected={responses.compassionTruth}
              onChange={(value) => patch({ compassionTruth: value })}
            />
          </View>
        );
      }

      case "next-step": {
        if (!ritual.nextStep) return null;
        const block = ritual.nextStep;
        return (
          <View style={styles.section}>
            {renderSectionHeader(block.sectionLabel, block.helper)}
            <Text style={styles.prompt}>{block.prompt}</Text>
            <DiaryShortText
              value={responses.smallestNextStep}
              maxLength={block.maxLength ?? 300}
              placeholder={block.placeholder}
              onChange={(value) => patch({ smallestNextStep: value })}
            />
          </View>
        );
      }

      case "tiny-win": {
        if (!ritual.tinyWin) return null;
        const block = ritual.tinyWin;
        return (
          <View style={styles.section}>
            {renderSectionHeader(block.sectionLabel)}
            <Text style={styles.prompt}>{block.prompt}</Text>
            <DiarySingleSelect
              options={block.options}
              selected={responses.tinyWin}
              onChange={(value) => patch({ tinyWin: value })}
            />
          </View>
        );
      }

      case "loop-break": {
        if (!ritual.loopBreak) return null;
        const block = ritual.loopBreak;
        return (
          <View style={styles.section}>
            {renderSectionHeader(block.sectionLabel, block.helper)}
            <Text style={styles.prompt}>{block.prompt}</Text>
            <DiarySingleSelect
              options={block.options}
              selected={responses.loopBreakStep}
              onChange={(value) => patch({ loopBreakStep: value })}
            />
            <Text style={[styles.prompt, styles.promptGap]}>{block.followUpPrompt}</Text>
            <DiaryShortText
              value={responses.loopBreakWhy}
              maxLength={400}
              placeholder={block.followUpPlaceholder}
              onChange={(value) => patch({ loopBreakWhy: value })}
            />
            {block.secondFollowUpPrompt ? (
              <>
                <Text style={[styles.prompt, styles.promptGap]}>{block.secondFollowUpPrompt}</Text>
                <DiaryShortText
                  value={responses.loopBreakAlreadyDone}
                  maxLength={400}
                  placeholder={block.secondFollowUpPlaceholder}
                  onChange={(value) => patch({ loopBreakAlreadyDone: value })}
                />
              </>
            ) : null}
          </View>
        );
      }

      case "script-voice": {
        if (!ritual.scriptVoice) return null;
        const block = ritual.scriptVoice;
        return (
          <View style={styles.section}>
            {renderSectionHeader(block.sectionLabel, block.helper)}
            <Text style={styles.prompt}>{block.prompt}</Text>
            <DiarySingleSelect
              options={block.options}
              selected={responses.scriptFeelsReal}
              onChange={(value) => patch({ scriptFeelsReal: value })}
            />
            {showScriptFollowUp ? (
              <>
                <Text style={[styles.prompt, styles.promptGap]}>{block.followUpPrompt}</Text>
                <DiaryShortText
                  value={responses.scriptInMyVoice}
                  maxLength={400}
                  placeholder={block.followUpPlaceholder}
                  onChange={(value) => patch({ scriptInMyVoice: value })}
                />
              </>
            ) : null}
            {block.embodimentPrompt && responses.scriptFeelsReal !== null ? (
              <>
                <Text style={[styles.prompt, styles.promptGap]}>{block.embodimentPrompt}</Text>
                <DiaryShortText
                  value={responses.scriptBodyResponse}
                  maxLength={400}
                  placeholder={block.embodimentPlaceholder}
                  onChange={(value) => patch({ scriptBodyResponse: value })}
                />
              </>
            ) : null}
          </View>
        );
      }

      case "tone-reflect": {
        if (!ritual.toneReflect) return null;
        const block = ritual.toneReflect;
        return (
          <View style={styles.section}>
            {renderSectionHeader(block.sectionLabel, block.helper)}
            <Text style={styles.prompt}>{block.prompt}</Text>
            <DiaryShortText
              value={responses.toneVersusWords}
              maxLength={block.maxLength ?? 500}
              placeholder={block.placeholder}
              onChange={(value) => patch({ toneVersusWords: value })}
            />
          </View>
        );
      }

      case "obstacle-pair": {
        if (!ritual.obstaclePair) return null;
        const block = ritual.obstaclePair;
        return (
          <View style={styles.section}>
            {renderSectionHeader(block.sectionLabel, block.helper)}
            <Text style={styles.prompt}>{block.prompt}</Text>
            <Text style={styles.fieldLabel}>{block.firstLabel}</Text>
            <DiaryShortText
              value={responses.biggestObstacle}
              maxLength={block.maxLength ?? 400}
              placeholder={block.firstPlaceholder}
              onChange={(value) => patch({ biggestObstacle: value })}
            />
            <Text style={[styles.prompt, styles.promptGap]}>{block.secondPrompt}</Text>
            <DiaryShortText
              value={responses.obstacleWorkaround}
              maxLength={block.maxLength ?? 400}
              placeholder={block.secondPlaceholder}
              onChange={(value) => patch({ obstacleWorkaround: value })}
            />
          </View>
        );
      }

      case "moment-try": {
        if (!ritual.momentTry) return null;
        const block = ritual.momentTry;
        return (
          <View style={styles.section}>
            {renderSectionHeader(block.sectionLabel, block.helper)}
            <Text style={styles.prompt}>{block.intro}</Text>
            {block.fields.map((field) => (
              <View key={field.id} style={styles.labeledField}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <DiaryShortText
                  value={getMomentTryValue(responses, field.id)}
                  maxLength={block.maxLength ?? 300}
                  placeholder={field.placeholder}
                  onChange={(value) => patchMomentTryField(patch, field.id, value)}
                />
              </View>
            ))}
          </View>
        );
      }

      case "what-shifted": {
        if (!ritual.whatShifted) return null;
        const block = ritual.whatShifted;
        return (
          <View style={styles.section}>
            {renderSectionHeader(block.sectionLabel)}
            <Text style={styles.prompt}>{block.prompt}</Text>
            <DiaryPromptMultiselect
              question=""
              options={block.options}
              selected={responses.whatShiftedMarks}
              onChange={handleWhatShiftedChange}
              embedded
            />
            {block.detailPrompt ? (
              <>
                <Text style={styles.detailPrompt}>{block.detailPrompt}</Text>
                <TextInput
                  accessibilityLabel={block.detailPrompt}
                  style={styles.detailInput}
                  value={responses.whatShiftedTakeaway}
                  onChangeText={(text) => patch({ whatShiftedTakeaway: text })}
                  multiline
                  textAlignVertical="top"
                  placeholder={block.detailPlaceholder}
                  placeholderTextColor={colors.textSecondary}
                />
              </>
            ) : null}
          </View>
        );
      }

      case "rule":
        if (!ritual.ruleRecall) return null;
        return renderQuotedRecallStep(
          ritual.ruleRecall,
          ritual.ruleRecall.options,
          responses.ruleAssumption,
          handleRuleSelect,
          ruleOpacity,
        );

      case "moment-what":
      case "moment-feeling":
      case "moment-pause":
      case "moment-different": {
        if (!ritual.momentReplay) return null;

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
        if (!ritual.supportNeeded) return null;
        return (
          <View style={styles.section}>
            <Text style={styles.prompt}>{ritual.supportNeeded.prompt}</Text>
            <DiaryPromptMultiselect
              question=""
              options={ritual.supportNeeded.options}
              selected={responses.supportNeeds}
              onChange={handleSupportChange}
              embedded
            />
            {showOtherDetail ? (
              <>
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
              </>
            ) : ritual.supportNeeded.otherOption == null ? (
              <>
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
              </>
            ) : null}
          </View>
        );

      case "intention":
        if (!ritual.intention) return null;
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
          <PrimaryButton
            label={continueLabel}
            accessibilityLabel={continueLabel}
            disabled={!canContinue || isPlanting}
            busy={isPlanting}
            style={styles.continueButton}
            onPress={() => {
              void handleContinue();
            }}
          />
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
  sectionLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.textSecondary,
  },
  helperText: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  promptGap: {
    marginTop: spacing.inner,
  },
  fieldLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 15,
    color: colors.textPrimary,
  },
  labeledField: {
    gap: spacing.tapGap,
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
