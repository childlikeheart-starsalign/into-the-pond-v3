import { Image, StyleSheet } from "react-native";

import { resolveCreatureCutoutSource } from "@/src/features/fishing/resolveCreatureCutout";

type CreatureCutoutPortraitProps = {
  creatureTypeId: string | undefined | null;
  accessibilityLabel?: string;
};

/** Field-note plate art — contain-fit inside the reserved square frame. */
export function CreatureCutoutPortrait({
  creatureTypeId,
  accessibilityLabel,
}: CreatureCutoutPortraitProps) {
  const source = resolveCreatureCutoutSource(creatureTypeId);
  if (!source) return null;
  return (
    <Image
      source={source}
      style={styles.image}
      resizeMode="contain"
      accessibilityLabel={accessibilityLabel}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
  },
});
