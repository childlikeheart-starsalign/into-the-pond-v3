import { memo } from "react";
import { Image, StyleSheet, View } from "react-native";

import { colors } from "@/src/constants/theme";
import { ParallaxBackground } from "@/src/features/gate/components/ParallaxBackground";
import { gateAssets } from "@/src/features/gate/gateAssets";
import {
  GATE_AMBIENT_OVERLAY_OPACITY,
  PARALLAX_BACKGROUND_DEFAULTS,
  type ParallaxBackgroundMotion,
} from "@/src/features/gate/gateBackgroundLayout";

/** Bundled once — avoids require() inside render. */
const ENVIRONMENT_ARTWORK = gateAssets.background.environment;

type SanctuaryGateBackgroundProps = Partial<ParallaxBackgroundMotion>;

/**
 * Production Sanctuary Gate environment layer.
 * Fixed, full-bleed, separate from all scrollable UI.
 */
export const SanctuaryGateBackground = memo(function SanctuaryGateBackground({
  backgroundOffsetY = PARALLAX_BACKGROUND_DEFAULTS.backgroundOffsetY,
  backgroundScale = PARALLAX_BACKGROUND_DEFAULTS.backgroundScale,
  parallaxIntensity = PARALLAX_BACKGROUND_DEFAULTS.parallaxIntensity,
}: SanctuaryGateBackgroundProps) {
  return (
    <View style={styles.stack} pointerEvents="none" collapsable={false}>
      <ParallaxBackground
        backgroundOffsetY={backgroundOffsetY}
        backgroundScale={backgroundScale}
        parallaxIntensity={parallaxIntensity}
        background={
          <Image
            source={ENVIRONMENT_ARTWORK}
            style={styles.artwork}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        }
      />
      {GATE_AMBIENT_OVERLAY_OPACITY > 0 ? (
        <View
          style={[styles.ambientOverlay, { opacity: GATE_AMBIENT_OVERLAY_OPACITY }]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  stack: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    backgroundColor: colors.bg,
  },
  artwork: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  ambientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
  },
});
