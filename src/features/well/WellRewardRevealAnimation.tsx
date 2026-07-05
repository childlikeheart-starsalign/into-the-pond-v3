import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { fontFamilies, wellColors } from "@/src/constants/theme";
import { WELL_INSIGHT_GLOW } from "@/src/features/well/wellAssets";

type WellRewardRevealAnimationProps = {
  wonderAwarded: number;
  onComplete: () => void;
};

export function WellRewardRevealAnimation({
  wonderAwarded,
  onComplete,
}: WellRewardRevealAnimationProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
      withDelay(1600, withTiming(0, { duration: 400 })),
    );
    scale.value = withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) });
    const timer = setTimeout(onComplete, 2400);
    return () => clearTimeout(timer);
  }, [onComplete, opacity, scale]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
    >
      <Image source={WELL_INSIGHT_GLOW} style={styles.glow} resizeMode="contain" />
      <View style={styles.copyWrap}>
        <Text style={styles.title}>New Insight Found</Text>
        <Text style={styles.wonder}>+{wonderAwarded} Wonder</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(44, 36, 24, 0.12)",
  },
  glow: {
    width: 220,
    height: 220,
    position: "absolute",
  },
  copyWrap: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 22,
    color: wellColors.warmInk,
  },
  wonder: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 15,
    color: wellColors.sage,
  },
});
