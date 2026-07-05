import { useRef } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";

import { atlasColors, fontFamilies } from "@/src/constants/theme";
import { ATLAS_ENTRY_CARDS, ATLAS_WORRIES_VARIANT } from "@/src/features/childAtlas/atlasAssets";
import {
  ATLAS_CARD_ASPECT,
  type PileOriginRect,
} from "@/src/features/childAtlas/atlasEntryCardLayout";
import { atlasCategoryAccessibilityLabel } from "@/src/features/childAtlas/atlasCategoryLabels";
import type { DiscoveryCategory } from "@/shared/sanctuary/well/types";

type ChildAtlasCategoryPileProps = {
  category: DiscoveryCategory;
  count: number;
  disabled: boolean;
  onPress: (origin: PileOriginRect) => void;
};

export function ChildAtlasCategoryPile({
  category,
  count,
  disabled,
  onPress,
}: ChildAtlasCategoryPileProps) {
  const source = ATLAS_ENTRY_CARDS[category];
  const stackSource = category === "worries" ? ATLAS_WORRIES_VARIANT : source;
  const pileRef = useRef<View>(null);

  const handlePress = () => {
    if (disabled) return;
    pileRef.current?.measureInWindow((x, y, width, height) => {
      onPress({ x, y, width, height });
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={atlasCategoryAccessibilityLabel(category, count, disabled)}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={[styles.wrap, disabled && styles.disabled]}
      pointerEvents={disabled ? "none" : "auto"}
    >
      <View ref={pileRef} style={styles.stack} collapsable={false}>
        <ImageBackground
          source={stackSource}
          style={[styles.card, styles.stackDeep]}
          resizeMode="stretch"
        />
        <ImageBackground
          source={source}
          style={[styles.card, styles.stackBack]}
          resizeMode="stretch"
        />
        <ImageBackground source={source} style={styles.card} resizeMode="stretch">
          {count > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          ) : null}
        </ImageBackground>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 120,
    padding: 6,
  },
  disabled: {
    opacity: 0.35,
  },
  stack: {
    width: "100%",
    aspectRatio: ATLAS_CARD_ASPECT,
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    overflow: "hidden",
  },
  stackDeep: {
    transform: [{ translateX: 6 }, { translateY: 6 }],
    opacity: 0.4,
  },
  stackBack: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
    opacity: 0.65,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    minWidth: 22,
    minHeight: 22,
    borderRadius: 11,
    backgroundColor: "rgba(44, 36, 24, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    color: atlasColors.paper,
  },
});
