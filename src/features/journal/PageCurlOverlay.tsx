/**
 * Transparent gesture layer over a static journal page.
 * Three gradient layers simulate a page peel; the image underneath never moves.
 */

import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const COMMIT_RATIO = 0.3;
const VELOCITY_THRESHOLD = 600;
const MAX_DRAG_RATIO = 0.7;
const SPRING = { damping: 30, stiffness: 260, mass: 1.1 };
const PAGE_BACK_COLOR = "#EDE4C8";

type PageCurlOverlayProps = {
  width: number;
  height: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onCommitStart?: () => void;
  canGoLeft?: boolean;
  canGoRight?: boolean;
  disabled?: boolean;
  reduceMotion?: boolean;
};

export function PageCurlOverlay({
  width,
  height,
  onSwipeLeft,
  onSwipeRight,
  onCommitStart,
  canGoLeft = true,
  canGoRight = true,
  disabled = false,
  reduceMotion = false,
}: PageCurlOverlayProps) {
  const progress = useSharedValue(0);
  const commitThreshold = width * COMMIT_RATIO;
  const maxDrag = width * MAX_DRAG_RATIO;

  const shadowStyle = useAnimatedStyle(() => {
    const p = Math.abs(progress.value);
    return {
      opacity: interpolate(p, [0, 0.05, 1], [0, 1, 1], Extrapolation.CLAMP),
      width: interpolate(p, [0, 1], [0, width * 0.65], Extrapolation.CLAMP),
    };
  });

  const peelStyle = useAnimatedStyle(() => {
    const p = Math.abs(progress.value);
    const size = interpolate(p, [0, 1], [0, width * 0.42], Extrapolation.CLAMP);
    return {
      width: size,
      height: size,
      opacity: interpolate(p, [0, 0.08, 1], [0, 1, 1], Extrapolation.CLAMP),
    };
  });

  const highlightStyle = useAnimatedStyle(() => {
    const p = Math.abs(progress.value);
    return {
      opacity: interpolate(p, [0, 0.1, 0.6, 1], [0, 0.7, 0.9, 0.5], Extrapolation.CLAMP),
      height: interpolate(p, [0, 1], [0, height * 0.45], Extrapolation.CLAMP),
      right: interpolate(p, [0, 1], [0, width * 0.38], Extrapolation.CLAMP),
    };
  });

  const finishCommit = useCallback(
    (direction: "left" | "right") => {
      if (direction === "left") {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    },
    [onSwipeLeft, onSwipeRight],
  );

  const commitAndReset = useCallback(
    (direction: "left" | "right") => {
      onCommitStart?.();

      if (reduceMotion) {
        progress.value = 0;
        finishCommit(direction);
        return;
      }

      progress.value = withTiming(direction === "left" ? 1 : -1, { duration: 180 }, () => {
        progress.value = withTiming(0, { duration: 0 });
        runOnJS(finishCommit)(direction);
      });
    },
    [finishCommit, onCommitStart, progress, reduceMotion],
  );

  const snapBack = useCallback(() => {
    progress.value = withSpring(0, SPRING);
  }, [progress]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .minDistance(6)
        .maxPointers(1)
        .onUpdate((event) => {
          "worklet";
          if (event.translationX < 0 && canGoLeft) {
            progress.value = interpolate(
              Math.abs(event.translationX),
              [0, maxDrag],
              [0, 1],
              Extrapolation.CLAMP,
            );
          } else if (event.translationX > 0 && canGoRight) {
            progress.value = -interpolate(
              Math.abs(event.translationX),
              [0, maxDrag],
              [0, 1],
              Extrapolation.CLAMP,
            );
          }
        })
        .onEnd((event) => {
          "worklet";
          const isLeftCommit =
            canGoLeft &&
            event.translationX < 0 &&
            (Math.abs(event.translationX) > commitThreshold ||
              event.velocityX < -VELOCITY_THRESHOLD);

          const isRightCommit =
            canGoRight &&
            event.translationX > 0 &&
            (event.translationX > commitThreshold || event.velocityX > VELOCITY_THRESHOLD);

          if (isLeftCommit) {
            runOnJS(commitAndReset)("left");
          } else if (isRightCommit) {
            runOnJS(commitAndReset)("right");
          } else {
            runOnJS(snapBack)();
          }
        }),
    [canGoLeft, canGoRight, commitAndReset, commitThreshold, disabled, maxDrag, progress, snapBack],
  );

  return (
    <GestureDetector gesture={pan}>
      <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="box-only">
        <Animated.View style={[styles.shadowContainer, { height }, shadowStyle]}>
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.38)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={[styles.peelContainer, peelStyle]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: PAGE_BACK_COLOR }]} />
          <LinearGradient
            colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={[styles.highlightContainer, highlightStyle]}>
          <LinearGradient
            colors={["rgba(255,245,220,0)", "rgba(255,245,220,0.85)", "rgba(255,245,220,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "transparent",
    zIndex: 2,
  },
  shadowContainer: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  peelContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    transform: [{ rotate: "45deg" }],
    overflow: "hidden",
    borderRadius: 4,
  },
  highlightContainer: {
    position: "absolute",
    bottom: 0,
    width: 18,
  },
});
