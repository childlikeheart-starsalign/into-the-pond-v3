import { StyleSheet, Text, View } from "react-native";

import { atlasColors, fontFamilies, spacing } from "@/src/constants/theme";
import { ChildAtlasCategoryPile } from "@/src/features/childAtlas/ChildAtlasCategoryPile";
import { ALL_DISCOVERY_CATEGORIES } from "@/src/features/childAtlas/atlasAssets";
import type { PileOriginRect } from "@/src/features/childAtlas/atlasEntryCardLayout";
import type { ChildAtlasEntry } from "@/src/hooks/useChildAtlas";
import type { DiscoveryCategory } from "@/shared/sanctuary/well/types";

type ChildAtlasPileGridProps = {
  entriesByCategory: Record<DiscoveryCategory, ChildAtlasEntry[]>;
  onSelectCategory: (category: DiscoveryCategory, origin: PileOriginRect) => void;
};

export function ChildAtlasPileGrid({
  entriesByCategory,
  onSelectCategory,
}: ChildAtlasPileGridProps) {
  const rows: DiscoveryCategory[][] = [];
  for (let i = 0; i < ALL_DISCOVERY_CATEGORIES.length; i += 2) {
    rows.push(ALL_DISCOVERY_CATEGORIES.slice(i, i + 2));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Child Atlas</Text>
      {rows.map((pair) => (
        <View key={pair.join("-")} style={styles.row}>
          {pair.map((category) => {
            const count = entriesByCategory[category]?.length ?? 0;
            return (
              <ChildAtlasCategoryPile
                key={category}
                category={category}
                count={count}
                disabled={count === 0}
                onPress={(origin) => onSelectCategory(category, origin)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.section,
    paddingTop: spacing.inner,
    paddingBottom: spacing.section,
    gap: spacing.inner,
  },
  title: {
    fontFamily: fontFamilies.body,
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: atlasColors.inkMuted,
    marginBottom: spacing.inner,
  },
  row: {
    flexDirection: "row",
    gap: spacing.inner,
  },
});
