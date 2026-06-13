import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { gateAssets } from "@/src/features/gate/gateAssets";
import { translateGateCopy } from "@/src/features/gate/gateCopy";
import { colors, fontFamilies } from "@/src/constants/theme";

type StickyCurrentTierHeaderProps = {
  visible: boolean;
  activeTierLabel: string;
};

export function StickyCurrentTierHeader({
  visible,
  activeTierLabel,
}: StickyCurrentTierHeaderProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View
      style={[styles.wrap, { paddingTop: insets.top + 4 }]}
      accessibilityRole="header"
      accessibilityLabel={`${translateGateCopy("gate.sticky.currentTier")}: ${activeTierLabel}`}
    >
      <ImageBackground source={gateAssets.header.strip} style={styles.strip} resizeMode="stretch">
        <Text style={styles.kicker}>{translateGateCopy("gate.sticky.currentTier")}</Text>
        <Text style={styles.tier}>{activeTierLabel}</Text>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  strip: {
    width: "100%",
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  kicker: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  tier: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    letterSpacing: -0.36,
    color: colors.textPrimary,
  },
});
