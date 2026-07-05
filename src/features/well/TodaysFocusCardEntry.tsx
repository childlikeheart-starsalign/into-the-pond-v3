import { useEffect } from "react";
import { AccessibilityInfo, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

type TodaysFocusCardEntryProps = {
  children: React.ReactNode;
  animateKey: string;
  /** When false, card stays hidden until scene closeup is ready. */
  entryReady?: boolean;
};

export function TodaysFocusCardEntry({
  children,
  animateKey,
  entryReady = true,
}: TodaysFocusCardEntryProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    if (!entryReady) {
      opacity.value = 0;
      translateY.value = 12;
      return;
    }

    opacity.value = 0;
    translateY.value = 12;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        opacity.value = withTiming(1, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
        return;
      }
      opacity.value = withDelay(
        400,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
      );
      translateY.value = withDelay(
        400,
        withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
      );
    });
  }, [animateKey, entryReady, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.wrap, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
});
