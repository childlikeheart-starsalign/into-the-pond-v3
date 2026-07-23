import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  AccessibilityInfo,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { DisplayArchetypeName } from "@/shared/childProfile/archetypeQuickCheck";
import { BOTH_CAN_BE_TRUE, getCaptionEntry } from "@/shared/childProfile/archetypeCaptionBank";
import { ArchetypeResultCardBack } from "@/src/components/dialogue/ArchetypeResultCardBack";
import { ArchetypeResultCardFront } from "@/src/components/dialogue/ArchetypeResultCardFront";
import type { MapTrailPoint } from "@/src/constants/archetypeMapCopy";
import { STORY_LONG_CARD } from "@/src/constants/storyAssets";
import { storyFolioColors } from "@/src/constants/storyDialogueStyles";
import {
  computeStoryPlateDimensions,
  storyPlateLayoutStyles,
  storyPlateTextStyles,
} from "@/src/constants/storyPlateTypography";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import {
  backFaceOpacity,
  backFaceRotateY,
  CARD_FLIP_DURATION_MS,
  CARD_FLIP_EASING,
  frontFaceOpacity,
  frontFaceRotateY,
} from "@/src/features/well/cardFlipAnimation";
import { useCardFlipGesture } from "@/src/features/well/cardFlipGesture";

type Props = {
  displayName: DisplayArchetypeName;
  axisA: number;
  axisB: number;
  showAgeBandNote?: boolean;
  showDisclaimer?: boolean;
  disclaimer?: string | null;
  /** Optional folio eyebrow (e.g. "Peeking into {name}'s page"). */
  eyebrow?: string | null;
  /** When set with onContinue, shows leaf primary CTA under the flipping plate. */
  ctaLabel?: string;
  ctaAccessibilityLabel?: string;
  onContinue?: () => void;
  secondaryCtaLabel?: string;
  onSecondaryPress?: () => void;
  /** Back-face only: intro + leaf CTA for Deep Check. */
  deepCheckIntro?: string;
  deepCheckCtaLabel?: string;
  onDeepCheckPress?: () => void;
  /** Retention / reference note under the Deep Check CTA. */
  deepCheckRetentionNote?: string | null;
  /** Prior map-trail points for the garden map (oldest first). */
  trail?: MapTrailPoint[];
  /** Current check ISO for map corner margin. */
  observedAt?: string | null;
  /** Source of the current (newest) marker. */
  currentSource?: "quick" | "deep" | null;
};

type CardDisplayMode = "front" | "back" | "animating";

/**
 * Folio parchment flip result card: front = map + Spirit; back = psychology + needs.
 * Each face owns a full long-card plate so the whole page flips 180° (Well pattern).
 */
export function ArchetypeResultFlipCard({
  displayName,
  axisA,
  axisB,
  showAgeBandNote = false,
  showDisclaimer = false,
  disclaimer = null,
  eyebrow = null,
  ctaLabel,
  ctaAccessibilityLabel,
  onContinue,
  secondaryCtaLabel,
  onSecondaryPress,
  deepCheckIntro,
  deepCheckCtaLabel,
  onDeepCheckPress,
  deepCheckRetentionNote = null,
  trail,
  observedAt = null,
  currentSource = null,
}: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { plateWidth, plateHeight, padH, padV } = computeStoryPlateDimensions(
    screenWidth,
    screenHeight,
  );
  const contentWidth = plateWidth - padH * 2;
  const mapSize = Math.min(240, Math.max(160, Math.round(contentWidth)));
  const entry = getCaptionEntry(displayName);
  const hasPrimary = Boolean(ctaLabel && ctaAccessibilityLabel && onContinue);
  const hasSecondary = Boolean(secondaryCtaLabel && onSecondaryPress);
  const hasDeepCheckCta = Boolean(deepCheckCtaLabel && onDeepCheckPress);
  const facePadBottom = Math.round(
    plateHeight * (hasSecondary ? 0.12 : hasDeepCheckCta ? 0.11 : 0.08),
  );
  const secondaryFootInset = Math.max(Math.round(plateHeight * 0.04), 12);

  const [face, setFace] = useState<"front" | "back">("front");
  const isFlipped = face === "back";
  const rotation = useSharedValue(0);
  const reduceMotionSv = useSharedValue(false);
  const displayMode = useSharedValue<CardDisplayMode>("front");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotionSv.value = enabled;
    });
  }, [reduceMotionSv]);

  useEffect(() => {
    displayMode.value = "animating";
    setIsAnimating(true);
    const duration = reduceMotionSv.value ? 0 : CARD_FLIP_DURATION_MS;
    rotation.value = withTiming(
      isFlipped ? 180 : 0,
      { duration, easing: CARD_FLIP_EASING },
      (finished) => {
        if (finished) {
          displayMode.value = isFlipped ? "back" : "front";
          runOnJS(setIsAnimating)(false);
        }
      },
    );
  }, [displayMode, isFlipped, reduceMotionSv, rotation]);

  const frontStyle = useAnimatedStyle(() => ({
    opacity: frontFaceOpacity(rotation.value),
    transform: [{ perspective: 1200 }, { rotateY: frontFaceRotateY(rotation.value) }],
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: backFaceOpacity(rotation.value),
    transform: [{ perspective: 1200 }, { rotateY: backFaceRotateY(rotation.value) }],
  }));

  const handleFlipRequest = useCallback(() => {
    if (isAnimating) return;
    setFace((prev) => (prev === "front" ? "back" : "front"));
  }, [isAnimating]);

  const flipGesture = useCardFlipGesture({
    enabled: !isAnimating,
    onFlipRequest: handleFlipRequest,
  });

  const facePadding = {
    paddingHorizontal: padH,
    paddingTop: padV,
    paddingBottom: facePadBottom,
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 16) }]}
      accessibilityRole="summary"
      accessibilityLabel={`${eyebrow ? `${eyebrow}. ` : ""}${displayName}`}
    >
      <View style={[styles.plateFrame, { width: plateWidth, height: plateHeight }]}>
        <GestureDetector gesture={flipGesture}>
          <View style={[styles.cardStack, { width: plateWidth, height: plateHeight }]}>
            <Animated.View
              style={[styles.face, frontStyle]}
              pointerEvents={isFlipped ? "none" : "auto"}
              collapsable={false}
            >
              <ImageBackground
                source={STORY_LONG_CARD}
                style={[styles.plate, { width: plateWidth, height: plateHeight }]}
                imageStyle={styles.plateImage}
                resizeMode="stretch"
              >
                <View style={[styles.faceInner, facePadding]}>
                  <ArchetypeResultCardFront
                    displayName={displayName}
                    spiritVoice={entry.spiritVoice}
                    axisA={axisA}
                    axisB={axisB}
                    trail={trail}
                    observedAt={observedAt}
                    currentSource={currentSource}
                    eyebrow={eyebrow}
                    mapSize={mapSize}
                  />
                </View>
              </ImageBackground>
            </Animated.View>

            <Animated.View
              style={[styles.face, styles.backFace, backStyle]}
              pointerEvents={isFlipped ? "auto" : "none"}
              collapsable={false}
            >
              <ImageBackground
                source={STORY_LONG_CARD}
                style={[styles.plate, { width: plateWidth, height: plateHeight }]}
                imageStyle={styles.plateImage}
                resizeMode="stretch"
              >
                <View style={[styles.faceInner, facePadding]}>
                  <ArchetypeResultCardBack
                    displayName={displayName}
                    psychologicalInterpretation={entry.psychologicalInterpretation}
                    whatTheyNeed={entry.whatTheyNeed}
                    bothCanBeTrue={BOTH_CAN_BE_TRUE}
                    ageBandNote={showAgeBandNote ? entry.ageBandNoteDeepCheck : null}
                    disclaimer={showDisclaimer ? disclaimer : null}
                    deepCheckIntro={deepCheckIntro}
                    deepCheckCtaLabel={deepCheckCtaLabel}
                    onDeepCheckPress={onDeepCheckPress}
                    deepCheckRetentionNote={deepCheckRetentionNote}
                  />
                </View>
              </ImageBackground>
            </Animated.View>
          </View>
        </GestureDetector>

        {hasSecondary ? (
          <Pressable
            onPress={onSecondaryPress}
            accessibilityRole="button"
            accessibilityLabel={secondaryCtaLabel}
            style={[styles.secondaryOnFoot, { bottom: secondaryFootInset }]}
          >
            <Text style={styles.secondaryCtaLabel}>{secondaryCtaLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      {hasPrimary ? (
        <View style={styles.ctaBelow}>
          <Pressable
            style={({ pressed }) => [
              storyPlateLayoutStyles.cta,
              { position: "relative", bottom: undefined },
              pressed && storyPlateLayoutStyles.ctaPressed,
            ]}
            onPress={onContinue}
            accessibilityRole="button"
            accessibilityLabel={ctaAccessibilityLabel}
          >
            <MaterialCommunityIcons
              name="leaf"
              size={12}
              color={colors.primary}
              style={storyPlateTextStyles.ctaLeaf}
            />
            <Text style={storyPlateTextStyles.ctaLabel}>{ctaLabel}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: spacing.inner,
    marginLeft: 3,
    marginTop: 70,
  },
  plateFrame: {
    position: "relative",
    alignSelf: "center",
  },
  cardStack: {
    alignSelf: "center",
  },
  face: {
    width: "100%",
    height: "100%",
  },
  backFace: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  plate: {
    borderRadius: 0,
    overflow: "hidden",
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
  faceInner: {
    flex: 1,
    width: "100%",
  },
  secondaryOnFoot: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2,
    elevation: 4,
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaBelow: {
    width: "100%",
    alignItems: "center",
    marginTop: spacing.inner,
  },
  secondaryCtaLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: storyFolioColors.paper,
    textDecorationLine: "underline",
    opacity: 0.8,
  },
});
