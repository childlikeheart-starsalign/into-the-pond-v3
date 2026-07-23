import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";

import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";
import { SANCTUARY_STAGE_MODE, usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { SanctuaryAvatar } from "@/src/components/sanctuary/SanctuaryAvatar";
import { SanctuaryFieldNote } from "@/src/components/sanctuary/SanctuaryFieldNote";
import { SanctuaryHeader } from "@/src/components/sanctuary/SanctuaryHeader";
import { SanctuaryHeaderDevPanel } from "@/src/components/sanctuary/SanctuaryHeaderDevPanel";
import { SanctuaryMoodOverlay } from "@/src/components/sanctuary/SanctuaryMoodOverlay";
import { SanctuaryCultivationLayer } from "@/src/components/sanctuary/SanctuaryCultivationLayer";
import {
  getSanctuaryAvatarPoseAssets,
  getSanctuaryBackground,
  type SanctuaryTimeOfDay,
} from "@/src/constants/sanctuaryAssets";
import { colors, fontFamilies, handwrittenPrompt } from "@/src/constants/theme";
import type { SanctuaryCultivation } from "@/src/features/sanctuary/cultivationTypes";
import { SHOW_SANCTUARY_HIT_OVERLAY } from "@/src/features/sanctuary/sanctuaryHitOverlay";
import {
  CRAFT_BENCH_HIT_OFFSET_PX,
  SANCTUARY_LANDMARK_LAYOUT,
  WELL_HIT_OFFSET_PX,
} from "@/src/features/sanctuary/sanctuaryLandmarkLayout";
import { minTapTargetRect, refBox } from "@/src/features/fishing/fishingModalLayout";
import { WellStatusLabel } from "@/src/components/sanctuary/WellStatusLabel";
import type { WellCardStatus } from "@/src/features/well/wellCardStatus";
import type { SanctuarySceneLayer } from "@/src/constants/curtainLift";
import { SPLASH_FRAME_BG } from "@/src/constants/splashFrame";
import { SanctuaryHeaderTuningProvider } from "@/src/features/sanctuary/sanctuaryHeaderTuningContext";

type SanctuaryScreenProps = {
  timeOfDay?: SanctuaryTimeOfDay;
  cultivation?: SanctuaryCultivation;
  arrivalBloomId?: string | null;
  onBloomArrivalComplete?: (bloomId: string) => void;
  /** Curtain lift — fires when each tableau layer has painted. */
  onLayerLoad?: (layer: SanctuarySceneLayer) => void;
  /** Invisible tap targets for pond, Well, and Craft landmarks on the artboard. */
  onPondPress?: () => void;
  onWellPress?: () => void;
  onCraftPress?: () => void;
  onPracticePress?: () => void;
  isCasting?: boolean;
  /** Pond overlay copy while a cast is waiting (first-cast narration or default). */
  castingLabel?: string | null;
  /** Grace-window cancel affordance — quiet text link, no timer. */
  canRecall?: boolean;
  onRecallCast?: () => void;
  /**
   * Cast is past readyAt but claim not finished (retry/paused/offline).
   * Quiet landmark cue — no badge, no modal.
   */
  castWaitingAtPond?: boolean;
  wellDisabled?: boolean;
  wellCardStatus?: WellCardStatus | null;
  craftDisabled?: boolean;
  /** Soft glow on the craft landmark when a rod is complete or ready to equip. */
  craftAttention?: boolean;
  practiceDisabled?: boolean;
  /** Dev-only: cycle time-of-day when tapping top-left corner. */
  onDevCycleTimeOfDay?: () => void;
  /** DEV: long-press time-cycle control opens cast-finish fixture. */
  onDevOpenCastFinishPreview?: () => void;
  /** Journal-margin header — presentational props from route container. */
  month?: string;
  wonderLabel?: string;
  wonderAccessibilityLabel?: string;
  displayName?: string;
  avatarSource?: ImageSourcePropType;
  onPressSettings?: () => void;
  onPressAvatar?: () => void;
  headerDisableAnimations?: boolean;
};

/**
 * Full sanctuary view: time-of-day background, pose-cycling avatar, bottom nav.
 * Rendered inside a centered 9:16 frame for reference-accurate layout.
 */
export function SanctuaryScreen({
  timeOfDay = "afternoon",
  cultivation,
  arrivalBloomId,
  onBloomArrivalComplete,
  onPondPress,
  onWellPress,
  onCraftPress,
  onPracticePress,
  isCasting = false,
  castingLabel = null,
  canRecall = false,
  onRecallCast,
  castWaitingAtPond = false,
  wellDisabled = false,
  wellCardStatus = null,
  craftDisabled = false,
  craftAttention = false,
  practiceDisabled = false,
  onDevCycleTimeOfDay,
  onDevOpenCastFinishPreview,
  onLayerLoad,
  month,
  wonderLabel = "0",
  wonderAccessibilityLabel = "Wonder: 0",
  displayName = "",
  avatarSource,
  onPressSettings,
  onPressAvatar,
  headerDisableAnimations = false,
}: SanctuaryScreenProps) {
  const frame = usePortrait916Layout(SANCTUARY_STAGE_MODE);
  const handoffActive = onLayerLoad != null;
  const backgroundSource = useMemo(() => getSanctuaryBackground(timeOfDay), [timeOfDay]);
  const avatarPoses = useMemo(() => getSanctuaryAvatarPoseAssets(), []);

  const landmarks = useMemo(() => {
    if (frame.width <= 0 || frame.height <= 0) return null;
    const wellBase = refBox(frame, SANCTUARY_LANDMARK_LAYOUT.well);
    const craftBenchBase = refBox(frame, SANCTUARY_LANDMARK_LAYOUT.craftBench);
    const craftGlowBase = refBox(frame, SANCTUARY_LANDMARK_LAYOUT.craftBenchGlow);
    return {
      pond: minTapTargetRect(refBox(frame, SANCTUARY_LANDMARK_LAYOUT.pond), 96),
      well: minTapTargetRect({
        ...wellBase,
        left: wellBase.left + WELL_HIT_OFFSET_PX.left,
        top: wellBase.top + WELL_HIT_OFFSET_PX.top,
      }),
      craftBench: minTapTargetRect({
        ...craftBenchBase,
        left: craftBenchBase.left + CRAFT_BENCH_HIT_OFFSET_PX.left,
        top: craftBenchBase.top + CRAFT_BENCH_HIT_OFFSET_PX.top,
      }),
      craftBenchGlow: {
        ...craftGlowBase,
        left: craftGlowBase.left + CRAFT_BENCH_HIT_OFFSET_PX.left,
        top: craftGlowBase.top + CRAFT_BENCH_HIT_OFFSET_PX.top,
      },
    };
  }, [frame]);

  const showHeader = Boolean(month && displayName && onPressSettings);

  const recallRipple = useRef(new Animated.Value(0)).current;
  const [showRecallRipple, setShowRecallRipple] = useState(false);

  const handleRecall = () => {
    if (!onRecallCast) return;
    setShowRecallRipple(true);
    recallRipple.setValue(1);
    Animated.timing(recallRipple, {
      toValue: 0,
      duration: 520,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setShowRecallRipple(false);
    });
    onRecallCast();
  };

  return (
    <SanctuaryHeaderTuningProvider frameWidth={frame.width}>
      <Portrait916Frame
        mode={SANCTUARY_STAGE_MODE}
        {...(handoffActive ? { backgroundColor: SPLASH_FRAME_BG } : {})}
      >
        <ImageBackground
          source={backgroundSource}
          style={styles.background}
          resizeMode="cover"
          accessibilityLabel={`Garden sanctuary, ${timeOfDay}`}
          onLoadEnd={() => onLayerLoad?.("background")}
        >
          {__DEV__ && onDevCycleTimeOfDay ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cycle sanctuary time of day. Long press to preview cast finish."
              style={styles.devCycle}
              onPress={onDevCycleTimeOfDay}
              onLongPress={onDevOpenCastFinishPreview}
              delayLongPress={400}
            >
              <Text style={styles.devCycleTitle}>DEV</Text>
              <Text style={styles.devCycleHint}>tap · hold</Text>
            </Pressable>
          ) : null}

          <View style={styles.overlay} pointerEvents="box-none">
            {showHeader ? (
              <SanctuaryHeader
                month={month!}
                timeOfDay={timeOfDay}
                wonderLabel={wonderLabel}
                wonderAccessibilityLabel={wonderAccessibilityLabel}
                displayName={displayName!}
                avatarSource={avatarSource}
                onPressSettings={onPressSettings!}
                onPressAvatar={onPressAvatar}
                disableAnimations={headerDisableAnimations}
                layoutWidth={frame.width}
                onArtworkLoad={() => onLayerLoad?.("header")}
              />
            ) : null}

            {cultivation ? (
              <SanctuaryCultivationLayer
                cultivation={cultivation}
                arrivalBloomId={arrivalBloomId}
                onArrivalComplete={onBloomArrivalComplete}
              />
            ) : null}

            <SanctuaryAvatar poses={avatarPoses} onFirstPoseLoad={() => onLayerLoad?.("avatar")} />

            <SanctuaryMoodOverlay timeOfDay={timeOfDay} onLoad={() => onLayerLoad?.("mood")} />

            {SHOW_SANCTUARY_HIT_OVERLAY && landmarks ? (
              <View style={styles.hitOverlayLayer} pointerEvents="none">
                <View style={[styles.hitOverlayBox, landmarks.pond]}>
                  <Text style={styles.hitOverlayLabel}>pond</Text>
                </View>
                <View style={[styles.hitOverlayBox, landmarks.well]}>
                  <Text style={styles.hitOverlayLabel}>well</Text>
                </View>
                <View style={[styles.hitOverlayBox, landmarks.craftBench]}>
                  <Text style={styles.hitOverlayLabel}>craft</Text>
                </View>
              </View>
            ) : null}

            {onPondPress && landmarks ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open fishing"
                style={[styles.landmarkTarget, landmarks.pond]}
                onPress={onPondPress}
              />
            ) : null}

            {isCasting && !castWaitingAtPond && landmarks ? (
              <View style={[styles.castingLabelWrap, landmarks.pond]}>
                {(castingLabel?.length ?? 0) > 24 ? (
                  <View pointerEvents="none">
                    <SanctuaryFieldNote
                      heading="On the water"
                      body={castingLabel ?? "casting..."}
                      scale={0.7}
                      style={styles.castingFieldNote}
                    />
                  </View>
                ) : (
                  <View pointerEvents="none" style={styles.castingLabelPlain}>
                    <Text style={styles.castingLabel}>{castingLabel ?? "casting..."}</Text>
                  </View>
                )}
                {canRecall && onRecallCast ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Recall the line"
                    onPress={handleRecall}
                    hitSlop={12}
                    style={styles.recallLinkHit}
                  >
                    <Text style={styles.recallLink}>Recall the line</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {castWaitingAtPond && landmarks ? (
              <View pointerEvents="none" style={[styles.castingLabelWrap, landmarks.pond]}>
                <View style={[styles.pondWaitingGlow, styles.craftGlow]} />
                <Text style={styles.waitingCue}>Something has been waiting.</Text>
              </View>
            ) : null}

            {showRecallRipple && landmarks ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.recallRipple,
                  landmarks.pond,
                  {
                    opacity: recallRipple.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.45],
                    }),
                    transform: [
                      {
                        scale: recallRipple.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.35, 1.15],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ) : null}

            {onWellPress && landmarks ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open Well of Questions"
                style={[styles.landmarkTarget, landmarks.well]}
                onPress={onWellPress}
                disabled={wellDisabled}
              />
            ) : null}

            {wellCardStatus && landmarks ? (
              <View pointerEvents="none" style={[styles.wellStatusWrap, landmarks.well]}>
                <WellStatusLabel status={wellCardStatus} />
              </View>
            ) : null}

            {craftAttention && landmarks ? (
              <View pointerEvents="none" style={[styles.craftGlow, landmarks.craftBenchGlow]} />
            ) : null}

            {onCraftPress && landmarks ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open Craft Bench"
                style={[styles.landmarkTarget, landmarks.craftBench]}
                onPress={onCraftPress}
                disabled={craftDisabled}
              />
            ) : null}

            {onPracticePress ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notice a moment of growth"
                style={styles.practiceTarget}
                onPress={onPracticePress}
                disabled={practiceDisabled}
              >
                <Text style={styles.practiceLabel}>Notice a moment</Text>
              </Pressable>
            ) : null}
          </View>
        </ImageBackground>
      </Portrait916Frame>
      <SanctuaryHeaderDevPanel />
    </SanctuaryHeaderTuningProvider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  devCycle: {
    position: "absolute",
    top: 8,
    left: 8,
    minWidth: 56,
    minHeight: 48,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 10,
    borderRadius: 10,
    backgroundColor: "rgba(31, 26, 23, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(232, 168, 48, 0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  devCycleTitle: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 11,
    letterSpacing: 0.6,
    color: "#E8A830",
  },
  devCycleHint: {
    fontFamily: fontFamilies.body,
    fontSize: 9,
    color: "rgba(250, 247, 242, 0.85)",
    marginTop: 2,
  },
  landmarkTarget: {
    position: "absolute",
    zIndex: 5, // above avatar (2) and mood host (3; pointerEvents none)
  },
  hitOverlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  hitOverlayBox: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(122, 92, 69, 0.28)",
    borderWidth: 1.5,
    borderColor: "rgba(122, 92, 69, 0.65)",
  },
  hitOverlayLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 11,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  castingLabelWrap: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    paddingHorizontal: 8,
  },
  castingLabelPlain: {
    alignItems: "center",
  },
  castingFieldNote: {
    maxWidth: "92%",
  },
  castingLabel: {
    ...handwrittenPrompt,
    color: colors.surface,
    textAlign: "center",
  },
  recallLinkHit: {
    marginTop: 10,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  recallLink: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(250, 247, 242, 0.78)",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  waitingCue: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(250, 247, 242, 0.88)",
    textAlign: "center",
    marginTop: 4,
  },
  pondWaitingGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  recallRipple: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(232, 221, 211, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(250, 247, 242, 0.35)",
    zIndex: 1,
  },
  /** Stone well beside the cottage — measured on afternoon artboard (9:16). */
  wellStatusWrap: {
    zIndex: 2,
  },
  craftGlow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(239,228,218,0.55)",
    shadowColor: "#EFE4DA",
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 0,
  },
  practiceTarget: {
    position: "absolute",
    left: "36%",
    bottom: "28%",
    minWidth: 96,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(250,247,242,0.88)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  practiceLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.textPrimary,
  },
});
