import { Image, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ATLAS_TOPO } from "@/src/features/childAtlas/atlasAssets";
import {
  getWellBirthdateSceneGradientLocations,
  getWellBirthdateSceneShiftPx,
  pondColor,
  wellBirthdateGradient,
  wellBirthdateLayout,
} from "@/src/features/well/birthdateGate/wellBirthdateTokens";
import { WELL_SCENE_ESTABLISHING } from "@/src/features/well/wellAssets";

type GhostedWellBackgroundProps = {
  stageWidth: number;
  stageHeight: number;
};

/** Ghosted well scene inside the 9:16 stage — cover fill like sanctuary backgrounds. */
export function GhostedWellBackground({ stageWidth, stageHeight }: GhostedWellBackgroundProps) {
  const sceneShiftUp = getWellBirthdateSceneShiftPx(stageWidth);
  const blendExtend = wellBirthdateLayout.frameBlendAnchorOffsetPx;

  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={styles.creamFill} />
      <View style={[styles.sceneShift, { top: -sceneShiftUp }]}>
        <Image source={WELL_SCENE_ESTABLISHING} style={styles.wellScene} resizeMode="cover" />
        <Image source={ATLAS_TOPO} style={styles.topo} resizeMode="cover" />
      </View>
      <LinearGradient
        colors={[
          wellBirthdateGradient.top,
          wellBirthdateGradient.mid,
          wellBirthdateGradient.bottom,
        ]}
        locations={[...getWellBirthdateSceneGradientLocations(stageHeight)]}
        style={[StyleSheet.absoluteFillObject, { bottom: -blendExtend }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  creamFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: pondColor.cream,
  },
  sceneShift: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  wellScene: {
    ...StyleSheet.absoluteFillObject,
    opacity: wellBirthdateLayout.wellGhostOpacity,
  },
  topo: {
    ...StyleSheet.absoluteFillObject,
    opacity: wellBirthdateLayout.topoOpacity,
  },
});
