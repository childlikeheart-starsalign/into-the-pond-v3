import { memo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import {
  PARALLAX_BACKGROUND_DEFAULTS,
  type ParallaxBackgroundMotion,
} from "@/src/features/gate/gateBackgroundLayout";

type ParallaxBackgroundProps = Partial<ParallaxBackgroundMotion> & {
  background: ReactNode;
};

/**
 * Fixed full-screen backdrop with optional motion hooks.
 * Extend with scroll-linked or device-tilt offsets without restructuring GateScreen.
 */
export const ParallaxBackground = memo(function ParallaxBackground({
  background,
  backgroundOffsetY = PARALLAX_BACKGROUND_DEFAULTS.backgroundOffsetY,
  backgroundScale = PARALLAX_BACKGROUND_DEFAULTS.backgroundScale,
  parallaxIntensity = PARALLAX_BACKGROUND_DEFAULTS.parallaxIntensity,
}: ParallaxBackgroundProps) {
  const motionStyle = useAnimatedStyle(
    () => ({
      transform: [
        { translateY: backgroundOffsetY * parallaxIntensity },
        { scale: backgroundScale },
      ],
    }),
    [backgroundOffsetY, backgroundScale, parallaxIntensity],
  );

  return (
    <View style={styles.root} pointerEvents="none" collapsable={false}>
      <Animated.View style={[StyleSheet.absoluteFill, motionStyle]} collapsable={false}>
        {background}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
