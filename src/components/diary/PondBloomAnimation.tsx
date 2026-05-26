import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/src/constants/theme";

type PondBloomAnimationProps = {
  active: boolean;
};

/**
 * Closure reward: seed drops, ripples spread, a flower blooms.
 */
export function PondBloomAnimation({ active }: PondBloomAnimationProps) {
  const seedY = useSharedValue(-28);
  const seedOpacity = useSharedValue(0);
  const ripple = useSharedValue(0);
  const ripple2 = useSharedValue(0);
  const flower = useSharedValue(0);

  useEffect(() => {
    if (!active) return;

    seedY.value = -28;
    seedOpacity.value = 0;
    ripple.value = 0;
    ripple2.value = 0;
    flower.value = 0;

    seedOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    seedY.value = withDelay(400, withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) }));
    ripple.value = withDelay(
      1050,
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 }),
      ),
    );
    ripple2.value = withDelay(
      1250,
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 }),
      ),
    );
    flower.value = withDelay(
      1100,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.2)) }),
    );
  }, [active, flower, ripple, ripple2, seedOpacity, seedY]);

  const seedStyle = useAnimatedStyle(() => ({
    opacity: seedOpacity.value,
    transform: [{ translateY: seedY.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: (1 - ripple.value) * 0.55,
    transform: [{ scale: 0.35 + ripple.value * 1.5 }],
  }));

  const ripple2Style = useAnimatedStyle(() => ({
    opacity: (1 - ripple2.value) * 0.4,
    transform: [{ scale: 0.3 + ripple2.value * 1.7 }],
  }));

  const flowerStyle = useAnimatedStyle(() => ({
    opacity: flower.value,
    transform: [{ scale: 0.4 + flower.value * 0.6 }, { translateY: (1 - flower.value) * 8 }],
  }));

  return (
    <View style={styles.container} accessibilityLabel="Seed planted in the pond">
      <Animated.View style={[styles.ripple, rippleStyle]} />
      <Animated.View style={[styles.ripple, ripple2Style]} />

      <View style={styles.pondCenter}>
        <Animated.View style={[styles.seed, seedStyle]} />
      </View>

      <Animated.View style={[styles.flower, flowerStyle]}>
        <View style={[styles.petal, styles.petalTop]} />
        <View style={[styles.petal, styles.petalLeft]} />
        <View style={[styles.petal, styles.petalRight]} />
        <View style={styles.flowerCenter} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  pondCenter: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  ripple: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: "rgba(122, 92, 69, 0.3)",
    backgroundColor: "rgba(222, 234, 242, 0.2)",
  },
  seed: {
    width: 10,
    height: 14,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  flower: {
    position: "absolute",
    right: 18,
    top: 24,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  petal: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(111, 125, 104, 0.8)",
  },
  petalTop: {
    top: 0,
  },
  petalLeft: {
    left: 2,
    bottom: 4,
    backgroundColor: "rgba(122, 92, 69, 0.55)",
  },
  petalRight: {
    right: 2,
    bottom: 4,
    backgroundColor: "rgba(122, 92, 69, 0.55)",
  },
  flowerCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primarySoft,
  },
});
