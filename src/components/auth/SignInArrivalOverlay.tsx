import { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import {
  AuthWaitingVideo,
  type AuthWaitingVideoHandle,
} from "@/src/components/auth/AuthWaitingVideo";
import { SPLASH_FRAME_BG } from "@/src/constants/splashFrame";
import { useCurtainLiftOptional } from "@/src/contexts/CurtainLiftContext";
import { useSignInArrival } from "@/src/contexts/SignInArrivalContext";

export function SignInArrivalOverlay() {
  const { phase, active, initError } = useSignInArrival();
  const curtainLift = useCurtainLiftOptional();
  const legacyOpacity = useRef(new Animated.Value(1)).current;
  const staticVideoOpacity = useRef(new Animated.Value(1)).current;
  const staticCurtainOpacity = useRef(new Animated.Value(1)).current;

  const useCurtainLiftLayers = phase === "curtainLift" && (curtainLift?.active ?? false);
  const useLayeredVideo = phase === "video" || useCurtainLiftLayers;

  const accessibilityLabel = useMemo(() => {
    if (initError) return "Could not prepare your sanctuary";
    if (phase === "artboard") return "Signing in";
    return "Preparing your Sanctuary";
  }, [initError, phase]);

  const attachVideoRef = useCallback(
    (handle: AuthWaitingVideoHandle | null) => {
      if (useCurtainLiftLayers && curtainLift) {
        curtainLift.setVideoRef(handle);
      }
    },
    [curtainLift, useCurtainLiftLayers],
  );

  useEffect(() => {
    if (phase === "fadeOut") {
      Animated.timing(legacyOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
      return;
    }
    legacyOpacity.setValue(1);
  }, [legacyOpacity, phase]);

  if (!active) {
    return null;
  }

  const pointerEvents =
    phase === "fadeOut" || (useCurtainLiftLayers && curtainLift?.phase === "reveal")
      ? "none"
      : "auto";

  if (useLayeredVideo) {
    const videoOpacity = useCurtainLiftLayers ? curtainLift!.videoOpacity : staticVideoOpacity;
    const curtainOpacity = useCurtainLiftLayers
      ? curtainLift!.curtainOpacity
      : staticCurtainOpacity;

    return (
      <View
        style={styles.root}
        pointerEvents={pointerEvents}
        accessibilityLiveRegion="polite"
        accessibilityLabel={accessibilityLabel}
      >
        <Animated.View
          style={[
            styles.curtainPanel,
            { backgroundColor: SPLASH_FRAME_BG, opacity: curtainOpacity },
          ]}
        >
          <Animated.View style={[styles.layer, { opacity: videoOpacity }]}>
            <AuthWaitingVideo ref={attachVideoRef} accessibilityLabel={accessibilityLabel} />
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[styles.root, { opacity: legacyOpacity }]}
      pointerEvents={pointerEvents}
      accessibilityLiveRegion="polite"
      accessibilityLabel={accessibilityLabel}
    >
      <AuthWaitingVideo accessibilityLabel={accessibilityLabel} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
  },
  curtainPanel: {
    ...StyleSheet.absoluteFillObject,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
