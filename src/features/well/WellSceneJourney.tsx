import { useCallback, useEffect, useRef } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { WELL_SCENE_CLOSEUP, WELL_SCENE_ESTABLISHING } from "@/src/features/well/wellAssets";

export type WellVisualPhase = "establishing" | "transitioning" | "closeup" | "interactive";

const ESTABLISHING_HOLD_MS = 1200;
const TRANSITION_MS = 800;
const TRANSITION_EASING = Easing.inOut(Easing.cubic);

type WellSceneJourneyProps = {
  phase: WellVisualPhase;
  onPhaseChange: (phase: WellVisualPhase) => void;
  onCloseupReady: () => void;
  frameWidth: number;
  frameHeight: number;
};

export function WellSceneJourney({
  phase,
  onPhaseChange,
  onCloseupReady,
  frameWidth,
  frameHeight,
}: WellSceneJourneyProps) {
  const establishingOpacity = useSharedValue(1);
  const closeupOpacity = useSharedValue(0);
  const closeupScale = useSharedValue(1);
  const establishingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionStartedRef = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const onPhaseChangeRef = useRef(onPhaseChange);
  const onCloseupReadyRef = useRef(onCloseupReady);
  onPhaseChangeRef.current = onPhaseChange;
  onCloseupReadyRef.current = onCloseupReady;

  const finishTransition = useCallback(() => {
    onPhaseChangeRef.current("closeup");
    onCloseupReadyRef.current();
    onPhaseChangeRef.current("interactive");
  }, []);

  const beginTransition = useCallback(() => {
    if (phaseRef.current !== "establishing" || transitionStartedRef.current) return;
    transitionStartedRef.current = true;

    if (establishingTimerRef.current) {
      clearTimeout(establishingTimerRef.current);
      establishingTimerRef.current = null;
    }

    onPhaseChangeRef.current("transitioning");

    const timingConfig = { duration: TRANSITION_MS, easing: TRANSITION_EASING };
    establishingOpacity.value = withTiming(0, timingConfig);
    closeupScale.value = withTiming(1.06, timingConfig);
    closeupOpacity.value = withTiming(1, timingConfig, (finished) => {
      if (finished) {
        runOnJS(finishTransition)();
      }
    });
  }, [closeupOpacity, closeupScale, establishingOpacity, finishTransition]);

  useEffect(() => {
    if (phase !== "establishing") return;
    establishingTimerRef.current = setTimeout(beginTransition, ESTABLISHING_HOLD_MS);
    return () => {
      if (establishingTimerRef.current) {
        clearTimeout(establishingTimerRef.current);
        establishingTimerRef.current = null;
      }
    };
  }, [beginTransition, phase]);

  const establishingStyle = useAnimatedStyle(() => ({ opacity: establishingOpacity.value }));
  const closeupStyle = useAnimatedStyle(() => ({
    opacity: closeupOpacity.value,
    transform: [{ scale: closeupScale.value }],
  }));

  return (
    <View style={{ width: frameWidth, height: frameHeight }}>
      <Animated.View style={[StyleSheet.absoluteFill, establishingStyle]}>
        <Image
          source={WELL_SCENE_ESTABLISHING}
          style={{ width: frameWidth, height: frameHeight }}
          resizeMode="cover"
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, closeupStyle]}>
        <Image
          source={WELL_SCENE_CLOSEUP}
          style={{ width: frameWidth, height: frameHeight }}
          resizeMode="cover"
        />
      </Animated.View>
      {phase === "establishing" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue to well"
          onPress={beginTransition}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  );
}
