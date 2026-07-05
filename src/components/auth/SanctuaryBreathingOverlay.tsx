import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { SPLASH_FRAME_BG } from "@/src/constants/splashFrame";
import { getSanctuaryFrame } from "@/src/constants/sanctuaryFrames";
import { colors } from "@/src/constants/theme";

const BREATHING_FRAME_IDS = [60, 61, 62, 63] as const;
const CYCLE_MS = 1200;
const FADE_MS = 300;

type SanctuaryBreathingOverlayProps = {
  accessibilityLabel?: string;
  /** When set, outer wrapper uses this animated opacity (bridge layer). */
  opacity?: Animated.Value;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  /** When false, skip internal frame cycling (static first frame). */
  animate?: boolean;
};

/**
 * Interim loading overlay — cycles sanctuary mood frames with a soft crossfade.
 */
export function SanctuaryBreathingOverlay({
  accessibilityLabel = "Loading",
  opacity: outerOpacity,
  backgroundColor = colors.bg,
  style,
  animate = true,
}: SanctuaryBreathingOverlayProps) {
  const frames = BREATHING_FRAME_IDS.map((id) => getSanctuaryFrame(id)) as ImageSourcePropType[];
  const [index, setIndex] = useState(0);
  const innerOpacity = useRef(new Animated.Value(1)).current;

  const advanceFrame = useCallback(() => {
    if (frames.length <= 1) return;

    Animated.timing(innerOpacity, {
      toValue: 0,
      duration: FADE_MS / 2,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setIndex((prev) => (prev + 1) % frames.length);
      Animated.timing(innerOpacity, {
        toValue: 1,
        duration: FADE_MS / 2,
        useNativeDriver: true,
      }).start();
    });
  }, [frames.length, innerOpacity]);

  useEffect(() => {
    if (!animate || frames.length <= 1) return undefined;
    const id = setInterval(advanceFrame, CYCLE_MS);
    return () => clearInterval(id);
  }, [advanceFrame, animate, frames.length]);

  const content = (
    <Animated.View style={[styles.fill, { opacity: innerOpacity }]}>
      <Image
        source={frames[index]}
        style={styles.image}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );

  if (outerOpacity) {
    return (
      <Animated.View
        style={[styles.overlay, { backgroundColor, opacity: outerOpacity }, style]}
        pointerEvents="none"
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="progressbar"
      >
        {content}
      </Animated.View>
    );
  }

  return (
    <View
      style={[styles.overlay, { backgroundColor }, style]}
      pointerEvents="auto"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  fill: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

/** Bridge layer background aligned with waiting video edges. */
export const SANCTUARY_BREATHING_BRIDGE_BG = SPLASH_FRAME_BG;
