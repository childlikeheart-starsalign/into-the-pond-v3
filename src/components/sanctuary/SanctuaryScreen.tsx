import React, { useMemo } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";

import { Portrait916Frame } from "@/src/components/layout/Portrait916Frame";
import { SanctuaryAvatar } from "@/src/components/sanctuary/SanctuaryAvatar";
import { SanctuaryCultivationLayer } from "@/src/components/sanctuary/SanctuaryCultivationLayer";
import { SanctuaryNavBar } from "@/src/components/sanctuary/SanctuaryNavBar";
import {
  getSanctuaryAvatarPoseAssets,
  getSanctuaryBackground,
  type SanctuaryTimeOfDay,
} from "@/src/constants/sanctuaryAssets";
import { colors, handwrittenPrompt } from "@/src/constants/theme";
import type { SanctuaryCultivation } from "@/src/features/sanctuary/cultivationTypes";

type SanctuaryScreenProps = {
  timeOfDay?: SanctuaryTimeOfDay;
  cultivation?: SanctuaryCultivation;
  arrivalBloomId?: string | null;
  onBloomArrivalComplete?: (bloomId: string) => void;
  /** Invisible tap targets for pond, Well, and Craft landmarks on the artboard. */
  onPondPress?: () => void;
  onWellPress?: () => void;
  onCraftPress?: () => void;
  isCasting?: boolean;
  wellDisabled?: boolean;
  craftDisabled?: boolean;
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
  isCasting = false,
  wellDisabled = false,
  craftDisabled = false,
  onDevCycleTimeOfDay,
}: SanctuaryScreenProps) {
  const backgroundSource = useMemo(() => getSanctuaryBackground(timeOfDay), [timeOfDay]);
  const avatarPoses = useMemo(() => getSanctuaryAvatarPoseAssets(), []);

  return (
    <Portrait916Frame mode="contain">
      <ImageBackground
        source={backgroundSource}
        style={styles.background}
        resizeMode="cover"
        accessibilityLabel={`Garden sanctuary, ${timeOfDay}`}
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

          <SanctuaryAvatar poses={avatarPoses} />

          {onPondPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open fishing"
              style={styles.pondTarget}
              onPress={onPondPress}
            />
          ) : null}

          {isCasting ? (
            <View pointerEvents="none" style={styles.castingLabelWrap}>
              <Text style={styles.castingLabel}>casting...</Text>
            </View>
          ) : null}

          {onWellPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Well of Questions"
              style={styles.wellTarget}
              onPress={onWellPress}
              disabled={wellDisabled}
            />
          ) : null}

          {onCraftPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Craft Bench"
              style={styles.craftTarget}
              onPress={onCraftPress}
              disabled={craftDisabled}
            />
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
  pondTarget: {
    position: "absolute",
    left: "28%",
    bottom: "14%",
    width: "44%",
    minHeight: 96,
    zIndex: 1,
  },
  castingLabelWrap: {
    position: "absolute",
    left: "28%",
    bottom: "14%",
    width: "44%",
    minHeight: 96,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  castingLabel: {
    ...handwrittenPrompt,
    color: colors.surface,
  },
  wellTarget: {
    position: "absolute",
    left: "8%",
    bottom: "22%",
    width: "28%",
    minHeight: 52,
    zIndex: 1,
  },
  craftTarget: {
    position: "absolute",
    right: "8%",
    bottom: "22%",
    width: "28%",
    minHeight: 52,
    zIndex: 1,
  },
});
