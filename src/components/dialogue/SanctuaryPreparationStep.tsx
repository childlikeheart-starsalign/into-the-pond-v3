import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FolioOrnamentDivider } from "@/components/story/FolioOrnamentDivider";
import { Portrait } from "@/components/story/Portrait";
import { StoryBackground } from "@/components/story/StoryBackground";
import { AuthWaitingVideo } from "@/src/components/auth/AuthWaitingVideo";
import { STORY_BACKGROUNDS, STORY_LONG_CARD } from "@/src/constants/storyAssets";
import { useStoryDialogueLayoutTokens } from "@/src/constants/storyDialogueStyles";
import {
  computeStoryPlateDimensions,
  storyPlateLayoutStyles,
  storyPlateTextStyles,
} from "@/src/constants/storyPlateTypography";
import { colors, spacing } from "@/src/constants/theme";
import { resolvePrepareStorybookIllustration } from "@/src/features/childProfile/prepareStorybookAssets";
import {
  buildStorybookAccessibilityLabel,
  type StorybookMessage,
} from "@/src/features/childProfile/prepareStorybookMessages";

type StorybookPresentation = "fullscreen" | "embedded";

type SanctuaryPreparationStepProps =
  | {
      status: "loading";
    }
  | {
      status: "error";
      message: StorybookMessage;
      onPrimaryPress: () => void;
      onSecondaryPress?: () => void;
      onRetry?: () => void;
      /**
       * fullscreen — full-route meadow + bottom-docked plate (prologue / limit).
       * embedded — plate only on parent dim (switcher unwritten peek).
       */
      presentation?: StorybookPresentation;
    };

function BreathingMedallion({
  message,
  size,
  reducedMotion,
}: {
  message: StorybookMessage;
  size: number;
  reducedMotion: boolean;
}) {
  const source = resolvePrepareStorybookIllustration(message.illustrationKey);
  const breathe = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      breathe.value = 1;
      return;
    }

    breathe.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.98, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [breathe, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  return <Portrait source={source} size={size} animatedStyle={animatedStyle} />;
}

function PreparationStorybookError({
  message,
  onPrimaryPress,
  onSecondaryPress,
  onRetry,
  presentation = "fullscreen",
}: {
  message: StorybookMessage;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
  onRetry?: () => void;
  presentation?: StorybookPresentation;
}) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const tokens = useStoryDialogueLayoutTokens();
  const [reducedMotion, setReducedMotion] = useState(false);
  const paperOpacity = useSharedValue(0);
  const paperTranslateY = useSharedValue(tokens.folioEnterY);
  const embedded = presentation === "embedded";

  const { plateWidth, plateHeight, padH, padV, bottomMargin, medallionSize } =
    computeStoryPlateDimensions(screenWidth, screenHeight);
  const secondaryBottom = bottomMargin + 52;

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      paperOpacity.value = 1;
      paperTranslateY.value = 0;
      return;
    }

    paperOpacity.value = 0;
    paperTranslateY.value = tokens.folioEnterY;
    const ease = Easing.out(Easing.cubic);
    paperOpacity.value = withTiming(1, { duration: tokens.folioEnterMs, easing: ease });
    paperTranslateY.value = withTiming(0, { duration: tokens.folioEnterMs, easing: ease });
  }, [
    message.id,
    paperOpacity,
    paperTranslateY,
    reducedMotion,
    tokens.folioEnterMs,
    tokens.folioEnterY,
  ]);

  const paperAnimatedStyle = useAnimatedStyle(() => ({
    opacity: paperOpacity.value,
    transform: [{ translateY: paperTranslateY.value }],
  }));

  const handlePrimaryPress = () => {
    if (message.allowRetry) {
      onRetry?.();
      return;
    }
    onPrimaryPress();
  };

  const plate = (
    <Animated.View style={[styles.plateWrap, paperAnimatedStyle]}>
      <ImageBackground
        source={STORY_LONG_CARD}
        style={[styles.plate, { width: plateWidth, height: plateHeight }]}
        imageStyle={styles.plateImage}
        resizeMode="stretch"
      >
        <View
          style={[
            storyPlateLayoutStyles.inner,
            {
              paddingHorizontal: padH,
              paddingTop: padV,
              paddingBottom: secondaryBottom + (message.secondaryCta ? 40 : 0),
            },
          ]}
        >
          <View
            accessible
            accessibilityRole="alert"
            accessibilityLabel={buildStorybookAccessibilityLabel(message)}
          >
            <View importantForAccessibility="no-hide-descendants">
              <View
                style={[
                  storyPlateLayoutStyles.titleRow,
                  { marginTop: -Math.round(plateHeight * 0.05) },
                ]}
              >
                <BreathingMedallion
                  message={message}
                  size={medallionSize}
                  reducedMotion={reducedMotion}
                />
              </View>

              <View
                style={{
                  marginTop: Math.round(plateHeight * 0.04),
                  gap: spacing.inner,
                }}
              >
                <Text style={storyPlateTextStyles.title} importantForAccessibility="no">
                  {message.headline}
                </Text>

                <Text style={storyPlateTextStyles.quote} importantForAccessibility="no">
                  {message.lead}
                </Text>

                <View style={storyPlateLayoutStyles.supportingBlock}>
                  {message.supportingCopy.map((paragraph) => (
                    <Text
                      key={paragraph}
                      style={storyPlateTextStyles.reflection}
                      importantForAccessibility="no"
                    >
                      {paragraph}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <FolioOrnamentDivider />
        </View>

        {message.secondaryCta && onSecondaryPress ? (
          <Pressable
            style={[storyPlateLayoutStyles.secondaryLinkWrap, { bottom: secondaryBottom }]}
            onPress={onSecondaryPress}
            accessibilityRole="button"
            accessibilityLabel={message.secondaryCta}
          >
            <Text style={storyPlateTextStyles.secondaryLink}>{message.secondaryCta}</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            storyPlateLayoutStyles.cta,
            { bottom: bottomMargin },
            pressed && storyPlateLayoutStyles.ctaPressed,
          ]}
          onPress={handlePrimaryPress}
          accessibilityRole="button"
          accessibilityLabel={message.primaryCta}
        >
          <MaterialCommunityIcons
            name="leaf"
            size={12}
            color={colors.primary}
            style={storyPlateTextStyles.ctaLeaf}
          />
          <Text style={storyPlateTextStyles.ctaLabel}>{message.primaryCta} →</Text>
        </Pressable>
      </ImageBackground>
    </Animated.View>
  );

  if (embedded) {
    return (
      <View style={[styles.embeddedShell, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {plate}
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <StoryBackground source={STORY_BACKGROUNDS.sanctuary} />

      <View
        style={[
          styles.foreground,
          {
            paddingTop: insets.top + 8,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {plate}
      </View>
    </View>
  );
}

/** Loading reuses AuthWaitingVideo; error uses calm storybook messaging (no raw backend codes). */
export function SanctuaryPreparationStep(props: SanctuaryPreparationStepProps) {
  if (props.status === "loading") {
    return (
      <View style={styles.fill}>
        <AuthWaitingVideo accessibilityLabel="Preparing your sanctuary" />
      </View>
    );
  }

  return (
    <PreparationStorybookError
      message={props.message}
      onPrimaryPress={props.onPrimaryPress}
      onSecondaryPress={props.onSecondaryPress}
      onRetry={props.onRetry}
      presentation={props.presentation}
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  embeddedShell: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  foreground: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.inner,
  },
  plateWrap: {
    alignItems: "center",
    width: "100%",
    marginLeft: 3,
  },
  plate: {
    borderRadius: 0,
    overflow: "visible",
    backgroundColor: "transparent",
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  plateImage: {
    borderRadius: 0,
  },
});
