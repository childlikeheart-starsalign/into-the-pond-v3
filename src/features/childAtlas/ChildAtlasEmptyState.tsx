import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { atlasColors, fontFamilies, spacing } from "@/src/constants/theme";
import { ATLAS_EMPTY_TRAIL } from "@/src/features/childAtlas/atlasAssets";
import { routes } from "@/src/navigation/routes";

export function ChildAtlasEmptyState() {
  return (
    <View style={styles.wrap}>
      <Image source={ATLAS_EMPTY_TRAIL} style={styles.trail} resizeMode="contain" />
      <Text style={styles.primary}>Your atlas begins with the first question.</Text>
      <Text style={styles.secondary}>Every conversation adds something here.</Text>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push(routes.well)}
        style={styles.cta}
      >
        <Text style={styles.ctaText}>Go to the Well</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.section,
    gap: spacing.inner,
  },
  trail: {
    width: 200,
    height: 100,
    opacity: 0.25,
    marginBottom: spacing.section,
  },
  primary: {
    fontFamily: fontFamilies.headingRegular,
    fontSize: 20,
    lineHeight: 25,
    color: atlasColors.ink,
    textAlign: "center",
  },
  secondary: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    color: atlasColors.inkMuted,
    textAlign: "center",
  },
  cta: {
    minHeight: 48,
    justifyContent: "center",
    marginTop: spacing.inner,
  },
  ctaText: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    color: atlasColors.inkMuted,
  },
});
