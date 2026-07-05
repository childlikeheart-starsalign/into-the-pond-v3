import { Image, StyleSheet, View, type ImageStyle, type ViewStyle } from "react-native";

import { botanicalOverlayLayout } from "@/src/features/well/birthdateGate/wellBirthdateTokens";
import { IVY_HANGING, WILDFLOWER_LEFT, WILDFLOWER_RIGHT } from "@/src/features/well/wellAssets";

function overlayFrameStyle(rect: {
  left: number;
  top: number;
  width: number;
  height: number;
}): ViewStyle {
  return {
    position: "absolute" as const,
    left: `${rect.left * 100}%`,
    top: `${rect.top * 100}%`,
    width: `${rect.width * 100}%`,
    height: `${rect.height * 100}%`,
    opacity: botanicalOverlayLayout.overlayOpacity,
  };
}

export function BotanicalEdgeOverlay() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={overlayFrameStyle(botanicalOverlayLayout.ivy)}>
        <Image source={IVY_HANGING} style={styles.fill} resizeMode="contain" />
      </View>
      <View style={overlayFrameStyle(botanicalOverlayLayout.wildflowerLeft)}>
        <Image source={WILDFLOWER_LEFT} style={styles.fill} resizeMode="contain" />
      </View>
      <View style={overlayFrameStyle(botanicalOverlayLayout.wildflowerRight)}>
        <Image source={WILDFLOWER_RIGHT} style={styles.fill} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: "100%",
    height: "100%",
  } satisfies ImageStyle,
});
