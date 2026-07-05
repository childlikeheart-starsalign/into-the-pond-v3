import { Image, StyleSheet, Text, View } from "react-native";

const LOCK_ASSET = require("@/assets/Fishing/fishing_lock.png");

type LockOverlayProps = {
  size?: number;
  opacity?: number;
};

export function LockOverlay({ size = 52, opacity = 0.85 }: LockOverlayProps) {
  const imageSize = size * 0.75;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {LOCK_ASSET ? (
        <Image
          source={LOCK_ASSET}
          style={{ width: imageSize, height: imageSize, opacity }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text style={styles.fallbackLock}>🔒</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  fallbackLock: {
    fontSize: 24,
  },
});
