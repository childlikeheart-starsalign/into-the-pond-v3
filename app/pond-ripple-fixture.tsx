import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { CatalogRarityRing } from "@/src/features/fishing/CatalogRarityRing";
import {
  CATALOG_RARITY_RING_FIXTURES,
  type CatalogRarityRingFixture,
} from "@/src/features/fishing/pondRippleCatalog";
import { routes } from "@/src/navigation/routes";

/**
 * Dev-only visual QA fixture for CatalogRarityRing (16 subscription × display combos).
 * Open: /pond-ripple-fixture while Metro is running.
 * Full cast-finish (rings + Focus card): /cast-finish-fixture
 * iOS + Android smoke: walk Free/Wooden locked bands + Fiberglass|Lifetime unlocks.
 * Not linked from production navigation; __DEV__ gate only.
 */
export default function PondRippleFixtureScreen() {
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const [activeId, setActiveId] = useState<string>(CATALOG_RARITY_RING_FIXTURES[0]!.id);
  const [playKey, setPlayKey] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof preset !== "string") return;
    if (CATALOG_RARITY_RING_FIXTURES.some((p) => p.id === preset)) {
      setActiveId(preset);
    }
  }, [preset]);

  const active: CatalogRarityRingFixture = useMemo(
    () =>
      CATALOG_RARITY_RING_FIXTURES.find((p) => p.id === activeId) ??
      CATALOG_RARITY_RING_FIXTURES[0]!,
    [activeId],
  );

  if (!__DEV__) {
    return <Redirect href={routes.sanctuary} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Text style={styles.title}>Pond Ripple fixtures</Text>
      <Text style={styles.hint}>
        Unwired CatalogRarityRing — 16 combos (includes empty water). Replay after selecting. Full
        ceremony: /cast-finish-fixture. Smoke locked-band opacity on iOS and Android.
      </Text>

      <View style={styles.stage}>
        <CatalogRarityRing
          key={`${active.id}-${playKey}`}
          caughtTier={active.caughtTier}
          subscriptionTier={active.subscriptionTier}
          claimedCreatureId={`${active.claimedCreatureId}-${playKey}`}
          onComplete={() => setDone(true)}
        />
        <Text style={styles.status}>{done ? "Settled" : "Animating…"}</Text>
        <Pressable
          style={styles.replay}
          onPress={() => {
            setDone(false);
            setPlayKey((k) => k + 1);
          }}
          accessibilityRole="button"
          accessibilityLabel="Replay ceremony"
        >
          <Text style={styles.replayLabel}>Replay</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {CATALOG_RARITY_RING_FIXTURES.map((fixture) => {
          const selected = fixture.id === active.id;
          return (
            <Pressable
              key={fixture.id}
              onPress={() => {
                setDone(false);
                setActiveId(fixture.id);
                setPlayKey((k) => k + 1);
              }}
              style={[styles.chip, selected && styles.chipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                {fixture.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.inner,
  },
  title: {
    fontFamily: fontFamilies.headingSemi,
    fontSize: 22,
    letterSpacing: -0.02 * 22,
    color: colors.textPrimary,
    marginTop: 16,
  },
  hint: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 24,
  },
  stage: {
    alignItems: "center",
    minHeight: 260,
    justifyContent: "center",
    marginBottom: 24,
  },
  status: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
  },
  replay: {
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  replayLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 15,
    color: colors.primary,
  },
  list: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
    paddingBottom: 24,
  },
  chip: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipLabelSelected: {
    color: colors.primary,
  },
});
