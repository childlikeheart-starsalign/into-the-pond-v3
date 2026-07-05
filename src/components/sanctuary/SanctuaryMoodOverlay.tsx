import { Image, StyleSheet, View } from "react-native";

import { getSanctuaryMoodOverlay, type SanctuaryTimeOfDay } from "@/src/constants/sanctuaryAssets";

type SanctuaryMoodOverlayProps = {
  timeOfDay: SanctuaryTimeOfDay;
  onLoad?: () => void;
};

/** Time-of-day mood tint — full artboard, above avatar, below nav. */
export function SanctuaryMoodOverlay({ timeOfDay, onLoad }: SanctuaryMoodOverlayProps) {
  return (
    <View style={styles.host} pointerEvents="none">
      <Image
        source={getSanctuaryMoodOverlay(timeOfDay)}
        style={styles.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        onLoad={onLoad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
