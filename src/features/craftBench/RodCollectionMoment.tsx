import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import type { FishingRodId } from "@/shared/sanctuary/types";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { rodCollectionArtFor } from "@/src/features/craftBench/rodCollectionAssets";
import { rodCollectionCopyFor } from "@/src/features/craftBench/rodCollectionCopy";

const TOTAL_MS = 2800;

type RodCollectionMomentProps = {
  visible: boolean;
  rodId: FishingRodId;
  rodName: string;
  /** Screen-space origin (workbench rod center). */
  originX: number;
  originY: number;
  onContinue: () => void;
};

type BotanicalSpec = {
  id: string;
  kind: "petal" | "leaf" | "scrap" | "fleck";
  angle: number;
  distance: number;
  size: number;
  tint: string;
};

const BOTANICALS: BotanicalSpec[] = [
  { id: "p1", kind: "petal", angle: 20, distance: 72, size: 10, tint: "#D4A5A5" },
  { id: "p2", kind: "petal", angle: 145, distance: 84, size: 9, tint: "#E8C4C4" },
  { id: "l1", kind: "leaf", angle: 260, distance: 78, size: 12, tint: "#8FA68F" },
  { id: "l2", kind: "leaf", angle: 310, distance: 66, size: 11, tint: "#A8B89A" },
  { id: "s1", kind: "scrap", angle: 95, distance: 90, size: 14, tint: "#E8DDD3" },
  { id: "s2", kind: "scrap", angle: 200, distance: 88, size: 12, tint: "#F0E6DA" },
  { id: "f1", kind: "fleck", angle: 35, distance: 100, size: 6, tint: "#C9A962" },
  { id: "f2", kind: "fleck", angle: 170, distance: 96, size: 5, tint: "#B8C9A0" },
];

function triggerSoftImpact() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
}

function triggerSuccessHaptic() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function RodCollectionMoment({
  visible,
  rodId,
  rodName,
  originX,
  originY,
  onContinue,
}: RodCollectionMomentProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  const progress = useSharedValue(0);
  const scrim = useSharedValue(0);
  const copyOpacity = useSharedValue(0);

  const centerX = screenWidth / 2;
  const centerY = screenHeight * 0.42;
  const deltaX = originX - centerX;
  const deltaY = originY - centerY;

  const artSource = useMemo(() => rodCollectionArtFor(rodId), [rodId]);
  const emotionalCopy = useMemo(() => rodCollectionCopyFor(rodId), [rodId]);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!visible) {
      progress.value = 0;
      scrim.value = 0;
      copyOpacity.value = 0;
      setShowContinue(false);
      return;
    }

    if (reduceMotion) {
      progress.value = 1;
      scrim.value = 1;
      copyOpacity.value = 1;
      setShowContinue(true);
      void triggerSuccessHaptic();
      return;
    }

    scrim.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    progress.value = withTiming(
      1,
      { duration: TOTAL_MS, easing: Easing.inOut(Easing.cubic) },
      (finished) => {
        if (finished) {
          copyOpacity.value = withTiming(1, { duration: 400 });
          runOnJS(setShowContinue)(true);
          runOnJS(triggerSuccessHaptic)();
        }
      },
    );

    const impactTimer = setTimeout(() => {
      void triggerSoftImpact();
    }, 900);

    return () => clearTimeout(impactTimer);
  }, [copyOpacity, progress, reduceMotion, scrim, visible]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrim.value * 0.38,
  }));

  const rodWrapStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const lift = interpolate(t, [0, 0.35], [0, 1], Extrapolation.CLAMP);
    const scale = interpolate(lift, [0, 1], [0.48, 1], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: deltaX * (1 - lift) },
        { translateY: deltaY * (1 - lift) },
        { scale },
      ],
    };
  });

  const sketchStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const graphite = interpolate(t, [0.2, 0.45, 0.82], [0, 0.92, 0], Extrapolation.CLAMP);
    const wash = interpolate(t, [0.42, 0.78], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: graphite * (1 - wash * 0.85),
    };
  });

  const colorStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const wash = interpolate(t, [0.38, 0.78], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: wash,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const glow = interpolate(t, [0.5, 0.85], [0, 0.55], Extrapolation.CLAMP);
    return { opacity: glow };
  });

  const copyStyle = useAnimatedStyle(() => ({
    opacity: copyOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}
        pointerEvents="none"
      />

      <View style={styles.stage} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.rodWrap,
            {
              left: centerX - screenWidth * 0.36,
              top: centerY - screenHeight * 0.22,
              width: screenWidth * 0.72,
              height: screenHeight * 0.44,
            },
            rodWrapStyle,
          ]}
        >
          <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
          <Animated.View style={[StyleSheet.absoluteFill, sketchStyle]} pointerEvents="none">
            <Image
              source={artSource}
              style={[styles.rodArt, styles.sketchArt]}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, colorStyle]} pointerEvents="none">
            <Image
              source={artSource}
              style={styles.rodArt}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </Animated.View>

          {BOTANICALS.map((item) => (
            <BotanicalFragment key={item.id} spec={item} progress={progress} />
          ))}
        </Animated.View>

        <Animated.View style={[styles.copyBlock, copyStyle]}>
          <Text style={styles.rodTitle}>{rodName}</Text>
          <Text style={styles.emotionalCopy}>{emotionalCopy}</Text>
        </Animated.View>

        {showContinue ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            onPress={onContinue}
            style={styles.continueBtn}
          >
            <Text style={styles.continueLabel}>Continue</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function BotanicalFragment({
  spec,
  progress,
}: {
  spec: BotanicalSpec;
  progress: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const drift = interpolate(t, [0.58, 1], [0, 1], Extrapolation.CLAMP);
    const radians = (spec.angle * Math.PI) / 180;
    const dx = Math.cos(radians) * spec.distance * drift;
    const dy = Math.sin(radians) * spec.distance * drift;
    const opacity = interpolate(drift, [0, 0.25, 1], [0, 0.7, 0], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ translateX: dx }, { translateY: dy }, { rotate: `${spec.angle * 0.4}deg` }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.botanical,
        {
          width: spec.size,
          height: spec.size,
          borderRadius: spec.kind === "fleck" ? spec.size : spec.size / 2,
          backgroundColor: spec.tint,
          opacity: spec.kind === "scrap" ? 0.75 : 0.9,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  scrim: {
    backgroundColor: "#1F1A17",
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: spacing.section + 24,
    paddingHorizontal: spacing.inner,
  },
  rodWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(239, 228, 218, 0.45)",
    borderRadius: 999,
    transform: [{ scale: 0.85 }],
  },
  rodArt: {
    width: "100%",
    height: "100%",
  },
  sketchArt: {
    tintColor: "#5B514A",
    opacity: 0.55,
  },
  botanical: {
    position: "absolute",
    alignSelf: "center",
  },
  copyBlock: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    gap: spacing.inner,
    marginBottom: spacing.section,
  },
  rodTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 26,
    letterSpacing: -0.52,
    color: colors.textPrimary,
    textAlign: "center",
  },
  emotionalCopy: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: "center",
  },
  continueBtn: {
    minHeight: 52,
    minWidth: 200,
    paddingHorizontal: 32,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  continueLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 16,
    color: colors.surface,
  },
});
