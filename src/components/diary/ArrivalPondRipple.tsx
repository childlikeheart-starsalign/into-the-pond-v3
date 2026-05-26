import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/src/constants/theme";

type ArrivalPondRippleProps = {
  active?: boolean;
};

export function ArrivalPondRipple({ active = true }: ArrivalPondRippleProps) {
  const rippleA = useSharedValue(0);
  const rippleB = useSharedValue(0);

  useEffect(() => {
    if (!active) return;
    rippleA.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
    rippleB.value = withDelay(
      1100,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
  }, [active, rippleA, rippleB]);

  const rippleStyleA = useAnimatedStyle(() => ({
    opacity: (1 - rippleA.value) * 0.45,
    transform: [{ scale: 0.55 + rippleA.value * 0.95 }],
  }));

  const rippleStyleB = useAnimatedStyle(() => ({
    opacity: (1 - rippleB.value) * 0.35,
    transform: [{ scale: 0.5 + rippleB.value * 1.05 }],
  }));

  return (
    <View style={styles.container} accessibilityLabel="Soft pond ripple">
      <Animated.View style={[styles.ripple, rippleStyleA]} />
      <Animated.View style={[styles.ripple, styles.rippleOffset, rippleStyleB]} />
      <View style={styles.pondCore} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 104,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
  },
  ripple: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(122, 92, 69, 0.22)",
    backgroundColor: "rgba(222, 234, 242, 0.28)",
  },
  rippleOffset: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  pondCore: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(111, 125, 104, 0.5)",
  },
});
