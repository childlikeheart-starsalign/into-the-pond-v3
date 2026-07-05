import { ImageBackground, StyleSheet, View } from "react-native";

import { atlasColors } from "@/src/constants/theme";
import { ATLAS_PAPER_TEXTURE, ATLAS_TOPO } from "@/src/features/childAtlas/atlasAssets";

type ChildAtlasBackgroundProps = {
  children: React.ReactNode;
};

export function ChildAtlasBackground({ children }: ChildAtlasBackgroundProps) {
  return (
    <View style={styles.root}>
      <ImageBackground source={ATLAS_PAPER_TEXTURE} style={styles.texture} resizeMode="repeat">
        <View style={styles.vignette} />
        <ImageBackground
          source={ATLAS_TOPO}
          style={styles.topo}
          imageStyle={styles.topoImage}
          resizeMode="cover"
        >
          {children}
        </ImageBackground>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: atlasColors.paper,
  },
  texture: {
    flex: 1,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(244, 239, 230, 0.35)",
  },
  topo: {
    flex: 1,
  },
  topoImage: {
    opacity: 0.07,
  },
});
