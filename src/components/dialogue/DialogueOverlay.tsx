import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JournalFolio } from "@/components/story/JournalFolio";
import { StoryBackground } from "@/components/story/StoryBackground";
import { DIALOGUE_BACKGROUNDS } from "@/src/constants/dialogueBackgrounds";
import { dialogueSpeakerLabel } from "@/src/constants/dialogueSpeakerLabels";
import {
  resolveStoryPortrait,
  STORY_BACKGROUNDS,
  STORY_PAPER_INPUT_CARD,
  STORY_PAPER_INPUT_CARD_SIZE,
} from "@/src/constants/storyAssets";
import { useStoryDialogueLayoutTokens } from "@/src/constants/storyDialogueStyles";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import {
  applyDialogueDynamicFields,
  getDialogueScene,
  type DialogueDynamicField,
  type DialogueLine,
  type DialogueUiType,
} from "@/src/data/dialogues";
import { playPaperClick } from "@/src/services/audio/playPaperClick";

export type DialogueOverlaySubmitPayload = {
  uiType: DialogueUiType;
  value: string | string[];
};

type DialogueOverlayProps = {
  sceneId: string;
  onComplete: () => void;
  dynamicFieldValues?: Partial<Record<DialogueDynamicField, string>>;
  /** Called when a special UI line completes (text_input, birthdate, quick_check). */
  onUiSubmit?: (payload: DialogueOverlaySubmitPayload) => void | Promise<void>;
  /** Optional custom renderer for complex UI types (birthdate / quick_check). */
  renderSpecialUi?: (args: {
    uiType: DialogueUiType;
    line: DialogueLine;
    advance: () => void;
  }) => ReactNode;
  /** Extra content above the folio (e.g. progress cue, subheading). */
  headerSlot?: ReactNode;
  /**
   * Content stacked under the folio in the lower zone (e.g. result quote + CTA).
   * When set, plate tap-advance is disabled so the footer owns progression.
   */
  footerSlot?: ReactNode;
  /** When false, hide JournalFolio "Turn the page" hint. Defaults to true. */
  showTurnHint?: boolean;
  /** When true, skip typewriter (reduced motion). */
  reducedMotion?: boolean;
};

/**
 * Open Folio dialogue host — JournalFolio + sanctuary/kitchen plate.
 * Preserves Part 2 interactive slots (text_input / birthdate / quick_check).
 */
export function DialogueOverlay({
  sceneId,
  onComplete,
  dynamicFieldValues,
  onUiSubmit,
  renderSpecialUi,
  headerSlot,
  footerSlot,
  showTurnHint = true,
  reducedMotion: reducedMotionProp,
}: DialogueOverlayProps) {
  const scene = getDialogueScene(sceneId);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const tokens = useStoryDialogueLayoutTokens();

  const paperCardWidth = Math.min(windowWidth * 0.9, 420);
  const paperCardHeight = Math.round(
    paperCardWidth * (STORY_PAPER_INPUT_CARD_SIZE.height / STORY_PAPER_INPUT_CARD_SIZE.width),
  );
  const [lineIndex, setLineIndex] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [reducedMotion, setReducedMotion] = useState(Boolean(reducedMotionProp));
  const submittingRef = useRef(false);

  const folioOpacity = useSharedValue(0);
  const folioTranslateY = useSharedValue(tokens.folioEnterY);
  const portraitOpacity = useSharedValue(0);
  const portraitTranslateY = useSharedValue(6);
  const dialogueOpacity = useSharedValue(0);
  const hintOpacity = useSharedValue(0);

  useEffect(() => {
    setLineIndex(0);
    setTypingDone(false);
    setInputValue("");
    submittingRef.current = false;
  }, [sceneId]);

  useEffect(() => {
    if (reducedMotionProp != null) {
      setReducedMotion(reducedMotionProp);
      return;
    }
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (enabled) => {
      setReducedMotion(enabled);
    });
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, [reducedMotionProp]);

  const lastIndex = useMemo(() => {
    if (!scene) return 0;
    if (typeof scene.lastLineIndex === "number") {
      return Math.min(scene.lastLineIndex, scene.lines.length - 1);
    }
    return scene.lines.length - 1;
  }, [scene]);

  const line = scene?.lines[lineIndex];
  const displayText = useMemo(() => {
    if (!line) return "";
    return applyDialogueDynamicFields(line.text, dynamicFieldValues ?? {});
  }, [line, dynamicFieldValues]);

  const isArchetypeHeading =
    Boolean(dynamicFieldValues?.displayArchetypeName) &&
    displayText === dynamicFieldValues?.displayArchetypeName;

  const bgSource = scene?.backgroundKey
    ? DIALOGUE_BACKGROUNDS[scene.backgroundKey]
    : STORY_BACKGROUNDS.sanctuary;

  const advance = useCallback(() => {
    if (!scene || !line) return;
    if (lineIndex >= lastIndex) {
      onComplete();
      return;
    }
    setTypingDone(false);
    setLineIndex((i) => i + 1);
  }, [scene, line, lineIndex, lastIndex, onComplete]);

  useEffect(() => {
    setTypingDone(Boolean(line?.uiType) || isArchetypeHeading);

    if (reducedMotion) {
      folioOpacity.value = 1;
      folioTranslateY.value = 0;
      portraitOpacity.value = 1;
      portraitTranslateY.value = 0;
      dialogueOpacity.value = 1;
      return;
    }

    folioOpacity.value = 0;
    folioTranslateY.value = tokens.folioEnterY;
    portraitOpacity.value = 0;
    portraitTranslateY.value = 6;
    dialogueOpacity.value = 0;
    hintOpacity.value = 0;

    const ease = Easing.out(Easing.cubic);
    folioOpacity.value = withTiming(1, { duration: tokens.folioEnterMs, easing: ease });
    folioTranslateY.value = withTiming(0, { duration: tokens.folioEnterMs, easing: ease });
    portraitOpacity.value = withDelay(
      tokens.portraitDelayMs,
      withTiming(1, { duration: tokens.portraitEnterMs, easing: ease }),
    );
    portraitTranslateY.value = withDelay(
      tokens.portraitDelayMs,
      withTiming(0, { duration: tokens.portraitEnterMs, easing: ease }),
    );
    dialogueOpacity.value = withDelay(
      line?.uiType || isArchetypeHeading ? 0 : tokens.dialogueRevealDelayMs,
      withTiming(1, { duration: tokens.dialogueFadeMs, easing: ease }),
    );
  }, [
    displayText,
    line?.uiType,
    isArchetypeHeading,
    reducedMotion,
    folioOpacity,
    folioTranslateY,
    portraitOpacity,
    portraitTranslateY,
    dialogueOpacity,
    hintOpacity,
    tokens.dialogueFadeMs,
    tokens.dialogueRevealDelayMs,
    tokens.folioEnterMs,
    tokens.folioEnterY,
    tokens.portraitDelayMs,
    tokens.portraitEnterMs,
  ]);

  useEffect(() => {
    if (reducedMotion) {
      hintOpacity.value = line?.uiType ? 0 : 1;
      return;
    }

    hintOpacity.value = 0;
    if (!typingDone || line?.uiType) return;

    hintOpacity.value = withDelay(
      tokens.hintRevealDelayMs,
      withSequence(
        withTiming(0.85, { duration: 300 }),
        withRepeat(
          withSequence(
            withTiming(0.55, { duration: tokens.hintPulseMs }),
            withTiming(0.85, { duration: tokens.hintPulseMs }),
          ),
          -1,
          false,
        ),
      ),
    );
  }, [
    displayText,
    typingDone,
    line?.uiType,
    hintOpacity,
    reducedMotion,
    tokens.hintPulseMs,
    tokens.hintRevealDelayMs,
  ]);

  const handleTapAdvance = useCallback(() => {
    if (!line) return;
    if (line.uiType) return;
    if (!typingDone && !reducedMotion) {
      dialogueOpacity.value = withTiming(1, { duration: 120 });
      setTypingDone(true);
      return;
    }
    playPaperClick();
    advance();
  }, [line, typingDone, reducedMotion, advance, dialogueOpacity]);

  const handleTextSubmit = useCallback(async () => {
    if (!line?.uiType || submittingRef.current) return;
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    submittingRef.current = true;
    try {
      await onUiSubmit?.({ uiType: line.uiType, value: trimmed });
      setInputValue("");
      playPaperClick();
      advance();
    } finally {
      submittingRef.current = false;
    }
  }, [line, inputValue, onUiSubmit, advance]);

  const folioAnimatedStyle = useAnimatedStyle(() => ({
    opacity: folioOpacity.value,
    transform: [{ translateY: folioTranslateY.value }],
  }));

  const portraitAnimatedStyle = useAnimatedStyle(() => ({
    opacity: portraitOpacity.value,
    transform: [{ translateY: portraitTranslateY.value }],
  }));

  const dialogueAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dialogueOpacity.value,
  }));

  const hintAnimatedStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
  }));

  if (!scene || !line) {
    return (
      <View style={[styles.fill, styles.fallbackBg]}>
        <Text style={styles.missing}>Missing scene: {sceneId}</Text>
      </View>
    );
  }

  const portraitSource = resolveStoryPortrait(line.portrait);
  const speaker = dialogueSpeakerLabel(line.speaker);
  const special =
    line.uiType && renderSpecialUi ? renderSpecialUi({ uiType: line.uiType, line, advance }) : null;

  const safeFloor = Math.max(insets.bottom, tokens.safeBottomMin);
  const interactive = Boolean(line.uiType);
  const blockPlateAdvance = interactive || Boolean(footerSlot);

  return (
    <View style={styles.fill}>
      <StoryBackground source={bgSource} />

      <View
        style={[styles.overlay, { paddingTop: insets.top + 8 }]}
        accessibilityRole="summary"
        accessibilityLabel={interactive ? (line.placeholder ?? "Continue") : displayText}
      >
        {headerSlot ? <View style={styles.headerSlot}>{headerSlot}</View> : null}

        <Pressable
          style={styles.plateSpacer}
          onPress={handleTapAdvance}
          disabled={blockPlateAdvance}
          accessibilityRole="button"
          accessibilityHint="Turns the page"
        />

        <View style={[styles.lowerZone, { paddingBottom: safeFloor }]}>
          {!interactive ? (
            <View style={styles.folioWrap}>
              <JournalFolio
                portrait={portraitSource}
                speaker={isArchetypeHeading ? undefined : speaker}
                dialogue={displayText}
                width={tokens.folioWidth}
                height={tokens.folioHeight}
                padTop={tokens.folioPadTop}
                padLeft={tokens.folioPadLeft}
                padRight={tokens.folioPadRight}
                padBottom={tokens.folioPadBottom}
                medallionSize={tokens.medallionSize}
                medallionGap={tokens.medallionGap}
                medallionTextGutter={tokens.medallionTextGutter}
                medallionTopInset={tokens.medallionTopInset}
                dialogueFontSize={
                  isArchetypeHeading ? tokens.dialogueFontSize + 4 : tokens.dialogueFontSize
                }
                dialogueLineHeight={
                  isArchetypeHeading ? tokens.dialogueLineHeight + 4 : tokens.dialogueLineHeight
                }
                speakerFontSize={tokens.speakerFontSize}
                turnHintFontSize={tokens.turnHintFontSize}
                typewriterMs={tokens.typewriterMs}
                dialogueRevealDelayMs={
                  reducedMotion || isArchetypeHeading ? 0 : tokens.dialogueRevealDelayMs
                }
                typingDone={typingDone || isArchetypeHeading}
                reducedMotion={reducedMotion || isArchetypeHeading}
                onTypingComplete={() => setTypingDone(true)}
                showTurnHint={showTurnHint && !footerSlot}
                animatedStyle={folioAnimatedStyle}
                portraitAnimatedStyle={portraitAnimatedStyle}
                dialogueAnimatedStyle={dialogueAnimatedStyle}
                hintAnimatedStyle={hintAnimatedStyle}
              />
            </View>
          ) : null}

          {line.uiType === "text_input" && !special ? (
            <ImageBackground
              source={STORY_PAPER_INPUT_CARD}
              style={[styles.paperCard, { width: paperCardWidth, height: paperCardHeight }]}
              imageStyle={styles.paperCardImage}
              resizeMode="stretch"
            >
              <View style={styles.paperCardInner}>
                <TextInput
                  style={styles.input}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder={line.placeholder ?? "Enter a name"}
                  placeholderTextColor={colors.textSecondary}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => void handleTextSubmit()}
                  maxLength={48}
                  accessibilityLabel={line.placeholder ?? "Text input"}
                />
                <Pressable
                  style={[styles.continueBtn, !inputValue.trim() && styles.continueBtnDisabled]}
                  disabled={!inputValue.trim()}
                  onPress={() => void handleTextSubmit()}
                  accessibilityRole="button"
                  accessibilityLabel="Continue"
                >
                  <Text style={styles.continueLabel}>Continue →</Text>
                </Pressable>
              </View>
            </ImageBackground>
          ) : null}

          {special}
          {footerSlot ? <View style={styles.footerSlot}>{footerSlot}</View> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  fallbackBg: { backgroundColor: colors.bg },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  headerSlot: {
    paddingHorizontal: spacing.inner,
    zIndex: 2,
  },
  plateSpacer: {
    flex: 1,
  },
  lowerZone: {
    alignItems: "center",
    gap: spacing.inner,
    paddingHorizontal: spacing.inner,
  },
  folioWrap: {
    alignItems: "center",
    width: "100%",
  },
  footerSlot: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    gap: spacing.inner,
  },
  paperCard: {
    overflow: "hidden",
    borderRadius: 16,
    shadowColor: "#2B241D",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  paperCardImage: {
    borderRadius: 16,
  },
  paperCardInner: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.tapGap,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  input: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(122, 92, 69, 0.22)",
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    paddingHorizontal: 16,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  continueBtn: {
    minHeight: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(122, 92, 69, 0.28)",
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
    paddingHorizontal: 8,
  },
  continueBtnDisabled: {
    opacity: 0.45,
  },
  continueLabel: {
    fontFamily: fontFamilies.handwritten,
    fontSize: 22,
    lineHeight: 28,
    color: colors.primary,
  },
  missing: {
    marginTop: 80,
    textAlign: "center",
    fontFamily: fontFamilies.body,
    color: colors.textSecondary,
  },
});
