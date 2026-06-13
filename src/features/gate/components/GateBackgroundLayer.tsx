import { Image, StyleSheet, View } from "react-native";

import { gateAssets } from "@/src/features/gate/gateAssets";

/** Layered cottage-interior background elements from production art. */
export function GateBackgroundLayer() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={gateAssets.background.windowLeft}
        style={styles.windowLeft}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Image
        source={gateAssets.background.glassJarLarge}
        style={styles.jarLarge}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Image
        source={gateAssets.background.ivyHanging}
        style={styles.ivy}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Image
        source={gateAssets.background.wildflowersLeft}
        style={styles.flowersLeft}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Image
        source={gateAssets.background.wildflowersRight}
        style={styles.flowersRight}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Image
        source={gateAssets.background.woodenShelf}
        style={styles.shelf}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  windowLeft: {
    position: "absolute",
    left: 0,
    top: "4%",
    width: "42%",
    height: "34%",
    opacity: 0.95,
  },
  jarLarge: {
    position: "absolute",
    left: "6%",
    top: "28%",
    width: "22%",
    height: "16%",
  },
  ivy: {
    position: "absolute",
    right: 0,
    top: 0,
    width: "28%",
    height: "22%",
  },
  flowersLeft: {
    position: "absolute",
    left: 0,
    bottom: "18%",
    width: "30%",
    height: "14%",
  },
  flowersRight: {
    position: "absolute",
    right: 0,
    bottom: "20%",
    width: "28%",
    height: "14%",
  },
  shelf: {
    position: "absolute",
    right: "4%",
    top: "36%",
    width: "24%",
    height: "12%",
    opacity: 0.9,
  },
});
