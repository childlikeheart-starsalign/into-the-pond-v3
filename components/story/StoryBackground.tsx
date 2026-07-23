import { Image, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { storyFolioColors } from "@/src/constants/storyDialogueStyles";

type StoryBackgroundProps = {
  source: ImageSourcePropType;
};

/**
 * Full-bleed illustration plate + warm bark vignette.
 * Never uses a black "soot" wash — readability lives on the journal folio.
 */
export function StoryBackground({ source }: StoryBackgroundProps) {
  return (
    <View style={styles.fill}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessible={false}
      />

      {/* Corner vignette — soft study light, not a HUD dunk */}
      <LinearGradient
        colors={[
          storyFolioColors.vignetteClear,
          "rgba(43, 36, 29, 0.10)",
          "rgba(43, 36, 29, 0.18)",
        ]}
        locations={[0.35, 0.72, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Lower 20% of plate: warm mist into folio seam (≤ ~22% bark) */}
      <LinearGradient
        colors={[storyFolioColors.vignetteClear, storyFolioColors.vignetteBark]}
        locations={[0, 1]}
        style={styles.lowerMist}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  lowerMist: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "20%",
  },
});
