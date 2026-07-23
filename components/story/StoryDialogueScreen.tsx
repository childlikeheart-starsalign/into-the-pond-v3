import { useCallback, useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
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
import { useStoryDialogueLayoutTokens } from "@/src/constants/storyDialogueStyles";
import { colors } from "@/src/constants/theme";
import { playPaperClick } from "@/src/services/audio/playPaperClick";

export type StoryDialoguePage = {
  background: ImageSourcePropType;
  portrait: ImageSourcePropType | null;
  speaker?: string;
  dialogue: string;
};

type StoryDialogueScreenProps = {
  page: StoryDialoguePage;
  onAdvance: () => void;
  reducedMotion?: boolean;
};

/**
 * Open Folio storytelling screen (Concept B).
 * Illustration plate above; journal page rises from below.
 */
export function StoryDialogueScreen({
  page,
  onAdvance,
  reducedMotion: reducedMotionProp,
}: StoryDialogueScreenProps) {
  const insets = useSafeAreaInsets();
  const tokens = useStoryDialogueLayoutTokens();
  const [typingDone, setTypingDone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(Boolean(reducedMotionProp));

  const folioOpacity = useSharedValue(0);
  const folioTranslateY = useSharedValue(tokens.folioEnterY);
  const portraitOpacity = useSharedValue(0);
  const portraitTranslateY = useSharedValue(6);
  const dialogueOpacity = useSharedValue(0);
  const hintOpacity = useSharedValue(0);

  useEffect(() => {
    setTypingDone(false);

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
      tokens.dialogueRevealDelayMs,
      withTiming(1, { duration: tokens.dialogueFadeMs, easing: ease }),
    );
  }, [
    page.dialogue,
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
      hintOpacity.value = 1;
      return;
    }

    hintOpacity.value = 0;
    if (!typingDone) return;

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
    page.dialogue,
    typingDone,
    hintOpacity,
    reducedMotion,
    tokens.hintPulseMs,
    tokens.hintRevealDelayMs,
  ]);

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

  const handleTap = useCallback(() => {
    if (!typingDone && !reducedMotion) {
      dialogueOpacity.value = withTiming(1, { duration: 120 });
      setTypingDone(true);
      return;
    }
    playPaperClick();
    onAdvance();
  }, [typingDone, reducedMotion, onAdvance, dialogueOpacity]);

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

  const safeFloor = Math.max(insets.bottom, tokens.safeBottomMin);

  return (
    <View style={styles.fill}>
      <StoryBackground source={page.background} />

      <Pressable
        style={styles.overlay}
        onPress={handleTap}
        accessibilityRole="button"
        accessibilityLabel={page.dialogue}
        accessibilityHint="Turns the page"
      >
        {/* Zone A spacer — illustration remains the hero */}
        <View style={styles.plateSpacer} />

        <View style={{ paddingBottom: safeFloor, alignItems: "center" }}>
          <JournalFolio
            portrait={page.portrait}
            speaker={page.speaker}
            dialogue={page.dialogue}
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
            dialogueFontSize={tokens.dialogueFontSize}
            dialogueLineHeight={tokens.dialogueLineHeight}
            speakerFontSize={tokens.speakerFontSize}
            turnHintFontSize={tokens.turnHintFontSize}
            typewriterMs={tokens.typewriterMs}
            dialogueRevealDelayMs={reducedMotion ? 0 : tokens.dialogueRevealDelayMs}
            typingDone={typingDone}
            reducedMotion={reducedMotion}
            onTypingComplete={() => setTypingDone(true)}
            animatedStyle={folioAnimatedStyle}
            portraitAnimatedStyle={portraitAnimatedStyle}
            dialogueAnimatedStyle={dialogueAnimatedStyle}
            hintAnimatedStyle={hintAnimatedStyle}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  plateSpacer: {
    flex: 1,
  },
});
