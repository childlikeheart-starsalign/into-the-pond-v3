import { Image, StyleSheet, View } from "react-native";

import { SanctuaryNavBar } from "@/src/components/sanctuary/SanctuaryNavBar";
import {
  SANCTUARY_TAB_BAR_STRIP_HEIGHT_RATIO,
  sanctuaryTabBarStrip,
} from "@/src/constants/sanctuaryNavLayout";

type SanctuaryTabBarStripProps = {
  frameHeight: number;
  onStripLoad?: () => void;
};

/** Parchment strip anchored to the bottom of the 9:16 frame. */
export function SanctuaryTabBarStrip({ frameHeight, onStripLoad }: SanctuaryTabBarStripProps) {
  const stripHeight = frameHeight * SANCTUARY_TAB_BAR_STRIP_HEIGHT_RATIO;

  return (
    <View
      style={[styles.stripHost, { height: stripHeight }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Image
        source={sanctuaryTabBarStrip}
        style={styles.stripImage}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        onLoad={onStripLoad}
      />
    </View>
  );
}

type SanctuaryTabBarOverlayProps = {
  frameHeight: number;
  onStripLoad?: () => void;
};

/**
 * Parchment tab-bar strip + sanctuary-aligned icon row for all main tab screens.
 */
export function SanctuaryTabBarOverlay({ frameHeight, onStripLoad }: SanctuaryTabBarOverlayProps) {
  return (
    <View style={styles.host} pointerEvents="box-none">
      <SanctuaryTabBarStrip frameHeight={frameHeight} onStripLoad={onStripLoad} />
      <SanctuaryNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
  },
  stripHost: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    overflow: "hidden",
  },
  stripImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
});
