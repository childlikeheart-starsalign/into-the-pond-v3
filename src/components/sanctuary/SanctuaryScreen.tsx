import React, { useMemo } from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";
import { SANCTUARY_STAGE_MODE, usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";
import { SanctuaryAvatar } from "@/src/components/sanctuary/SanctuaryAvatar";
import { SanctuaryMoodOverlay } from "@/src/components/sanctuary/SanctuaryMoodOverlay";
import { SanctuaryCultivationLayer } from "@/src/components/sanctuary/SanctuaryCultivationLayer";
import { SanctuaryNavBar } from "@/src/components/sanctuary/SanctuaryNavBar";
import { SanctuaryTabBarStrip } from "@/src/components/sanctuary/SanctuaryTabBarOverlay";
import {
  getSanctuaryAvatarPoseAssets,
  getSanctuaryBackground,
  type SanctuaryTimeOfDay,
} from "@/src/constants/sanctuaryAssets";
import { colors, handwrittenPrompt } from "@/src/constants/theme";
import type { SanctuaryCultivation } from "@/src/features/sanctuary/cultivationTypes";
import { SANCTUARY_LANDMARK_LAYOUT } from "@/src/features/sanctuary/sanctuaryLandmarkLayout";
import { minTapTargetRect, refBox } from "@/src/features/fishing/fishingModalLayout";
import { WellStatusLabel } from "@/src/components/sanctuary/WellStatusLabel";
import type { WellCardStatus } from "@/src/features/well/wellCardStatus";
import type { SanctuarySceneLayer } from "@/src/constants/curtainLift";
import { SPLASH_FRAME_BG } from "@/src/constants/splashFrame";

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
  wellDisabled?: boolean;
  wellCardStatus?: WellCardStatus | null;
  craftDisabled?: boolean;
  /** Soft glow on the craft landmark when a rod is complete or ready to equip. */
  craftAttention?: boolean;
  practiceDisabled?: boolean;
  /** Dev-only: cycle time-of-day when tapping top-left corner. */
  onDevCycleTimeOfDay?: () => void;
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
  wellDisabled = false,
  wellCardStatus = null,
  craftDisabled = false,
  craftAttention = false,
  practiceDisabled = false,
  onDevCycleTimeOfDay,
  onLayerLoad,
}: SanctuaryScreenProps) {
  const frame = usePortrait916Layout(SANCTUARY_STAGE_MODE);
  const { height: windowHeight } = useWindowDimensions();
  const handoffActive = onLayerLoad != null;
  const stripFrameHeight = frame.height > 0 ? frame.height : windowHeight;
  const backgroundSource = useMemo(() => getSanctuaryBackground(timeOfDay), [timeOfDay]);
  const avatarPoses = useMemo(() => getSanctuaryAvatarPoseAssets(), []);

  const landmarks = useMemo(() => {
    if (frame.width <= 0 || frame.height <= 0) return null;
    return {
      pond: minTapTargetRect(refBox(frame, SANCTUARY_LANDMARK_LAYOUT.pond), 96),
      well: minTapTargetRect(refBox(frame, SANCTUARY_LANDMARK_LAYOUT.well)),
      craftBench: minTapTargetRect(refBox(frame, SANCTUARY_LANDMARK_LAYOUT.craftBench)),
      craftBenchGlow: refBox(frame, SANCTUARY_LANDMARK_LAYOUT.craftBenchGlow),
    };
  }, [frame]);

  return (
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
            accessibilityLabel="Cycle sanctuary time of day"
            style={styles.devCycle}
            onPress={onDevCycleTimeOfDay}
          />
        ) : null}

        <View style={styles.overlay} pointerEvents="box-none">
          {cultivation ? (
            <SanctuaryCultivationLayer
              cultivation={cultivation}
              arrivalBloomId={arrivalBloomId}
              onArrivalComplete={onBloomArrivalComplete}
            />
          ) : null}

          <SanctuaryAvatar poses={avatarPoses} onFirstPoseLoad={() => onLayerLoad?.("avatar")} />

          <SanctuaryMoodOverlay timeOfDay={timeOfDay} onLoad={() => onLayerLoad?.("mood")} />

          {onPondPress && landmarks ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open fishing"
              style={[styles.landmarkTarget, landmarks.pond]}
              onPress={onPondPress}
            />
          ) : null}

          {isCasting && landmarks ? (
            <View pointerEvents="none" style={[styles.castingLabelWrap, landmarks.pond]}>
              <Text style={styles.castingLabel}>casting...</Text>
            </View>
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

          {handoffActive || frame.height > 0 ? (
            <View style={styles.navStripLayer} pointerEvents="none">
              <SanctuaryTabBarStrip
                frameHeight={stripFrameHeight}
                onStripLoad={() => onLayerLoad?.("tabStrip")}
              />
            </View>
          ) : null}

          <SanctuaryNavBar />
        </View>
      </ImageBackground>
    </Portrait916Frame>
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
    width: 48,
    minHeight: 48,
    zIndex: 10,
  },
  landmarkTarget: {
    position: "absolute",
    zIndex: 1,
  },
  castingLabelWrap: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  castingLabel: {
    ...handwrittenPrompt,
    color: colors.surface,
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
  navStripLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
});
