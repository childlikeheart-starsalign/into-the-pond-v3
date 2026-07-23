import { Redirect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { CatalogRarityRing } from "@/src/features/fishing/CatalogRarityRing";
import { shouldShowCatalogRarityRingOverlay } from "@/src/features/fishing/claimCeremony";
import { buildClaimCelebrationCopy } from "@/src/features/fishing/claimCelebrationCopy";
import { ClaimCelebrationCard } from "@/src/features/fishing/ClaimCelebrationCard";
import {
  CLAIM_THRESHOLD_SCRIM,
  outcomeToDisplayTier,
  type PondRippleActiveTier,
  type PondRippleDisplayTier,
} from "@/src/features/fishing/pondRippleCatalog";
import { routes } from "@/src/navigation/routes";
import { closeSceneScreen } from "@/src/navigation/closeSceneScreen";
import type { ServerClaimSummary } from "@/src/services/firebase/serverActions";

type CastFinishPreset = {
  id: string;
  label: string;
  subscriptionTier: PondRippleActiveTier;
  claim: ServerClaimSummary;
};

const FIXTURE_CLAIMED_AT = Date.UTC(2026, 6, 20);

const PRESETS: readonly CastFinishPreset[] = [
  {
    id: "catch-common-free",
    label: "Catch common · free",
    subscriptionTier: "free",
    claim: {
      outcome: "catch",
      rarityIndicator: "common",
      creatureTypeId: "puddle-dart",
      creatureDisplayName: "Puddle Dart",
      wonderAwarded: 2,
      materialsAwarded: 1,
      claimedAt: FIXTURE_CLAIMED_AT,
      previewOnly: true,
    },
  },
  {
    id: "catch-common-alias",
    label: "Catch common (sheet alias)",
    subscriptionTier: "free",
    claim: {
      outcome: "catch",
      rarityIndicator: "common",
      creatureTypeId: "reed-tail",
      creatureDisplayName: "Reed Tail",
      wonderAwarded: 2,
      materialsAwarded: 1,
      claimedAt: FIXTURE_CLAIMED_AT,
      previewOnly: true,
    },
  },
  {
    id: "catch-rare-wooden",
    label: "Catch rare · wooden",
    subscriptionTier: "wooden",
    claim: {
      outcome: "catch",
      rarityIndicator: "rare",
      creatureTypeId: "ember-darter",
      creatureDisplayName: "Ember Darter",
      wonderAwarded: 3,
      materialsAwarded: 2,
      claimedAt: FIXTURE_CLAIMED_AT,
      previewOnly: true,
    },
  },
  {
    id: "catch-epic-fiberglass",
    label: "Catch epic · fiberglass",
    subscriptionTier: "fiberglass",
    claim: {
      outcome: "catch",
      rarityIndicator: "epic",
      creatureTypeId: "magma-elder",
      creatureDisplayName: "Magma Elder",
      wonderAwarded: 5,
      materialsAwarded: 3,
      claimedAt: FIXTURE_CLAIMED_AT,
      previewOnly: true,
    },
  },
  {
    id: "catch-long-copy",
    label: "Long name + metaphor",
    subscriptionTier: "lifetime",
    claim: {
      outcome: "catch",
      rarityIndicator: "epic",
      creatureTypeId: "resonant-sovereign",
      creatureDisplayName: "Resonant Sovereign of the Deep Current",
      wonderAwarded: 4,
      materialsAwarded: 2,
      claimedAt: FIXTURE_CLAIMED_AT,
      previewOnly: true,
    },
  },
  {
    id: "catch-zero-reward",
    label: "Catch · zero reward",
    subscriptionTier: "free",
    claim: {
      outcome: "catch",
      rarityIndicator: "common",
      creatureTypeId: "not-in-catalog",
      creatureDisplayName: "Ripple Minnow",
      wonderAwarded: 0,
      materialsAwarded: 0,
      claimedAt: FIXTURE_CLAIMED_AT,
      previewOnly: true,
    },
  },
  {
    id: "duplicate-lifetime",
    label: "Duplicate · lifetime",
    subscriptionTier: "lifetime",
    claim: {
      outcome: "duplicate",
      rarityIndicator: "rare",
      creatureTypeId: "cinder-veil",
      creatureDisplayName: "Cinder Veil",
      wonderAwarded: 2,
      materialsAwarded: 2,
      claimedAt: FIXTURE_CLAIMED_AT,
      previewOnly: true,
    },
  },
  {
    id: "miss-free",
    label: "Miss · free",
    subscriptionTier: "free",
    claim: {
      outcome: "miss",
      rarityIndicator: "common",
      wonderAwarded: 0,
      materialsAwarded: 0,
      claimedAt: FIXTURE_CLAIMED_AT,
      previewOnly: true,
    },
  },
  {
    id: "miss-fiberglass",
    label: "Miss · fiberglass",
    subscriptionTier: "fiberglass",
    claim: {
      outcome: "miss",
      rarityIndicator: "epic",
      wonderAwarded: 0,
      materialsAwarded: 0,
      claimedAt: FIXTURE_CLAIMED_AT,
      previewOnly: true,
    },
  },
] as const;

/**
 * Dev-only full cast-finish ceremony: Pond Ripple → Today's Focus card.
 * Open: /cast-finish-fixture (Expo Router) while Metro is running.
 * Not linked from production navigation; __DEV__ gate only.
 */
export default function CastFinishFixtureScreen() {
  const { preset, ring } = useLocalSearchParams<{ preset?: string; ring?: string }>();
  const [activeId, setActiveId] = useState<string>(PRESETS[0]!.id);
  const [playKey, setPlayKey] = useState(0);
  const ringEnabled = ring !== "0";
  const [revealReady, setRevealReady] = useState(() => ring === "0");

  useEffect(() => {
    if (typeof preset !== "string") return;
    if (PRESETS.some((p) => p.id === preset)) {
      setActiveId(preset);
    }
  }, [preset]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeSceneScreen("cast-finish-fixture");
      return true;
    });
    return () => sub.remove();
  }, []);

  const active = useMemo(() => PRESETS.find((p) => p.id === activeId) ?? PRESETS[0]!, [activeId]);

  const celebration = useMemo(() => buildClaimCelebrationCopy(active.claim), [active.claim]);
  const caughtTier: PondRippleDisplayTier = outcomeToDisplayTier(active.claim);

  const replay = useCallback(() => {
    setRevealReady(!ringEnabled);
    setPlayKey((k) => k + 1);
  }, [ringEnabled]);

  const showRingOverlay = shouldShowCatalogRarityRingOverlay({
    claimRevealReady: revealReady || !ringEnabled,
  });

  if (!__DEV__) {
    return <Redirect href={routes.sanctuary} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Cast finish (DEV)</Text>
        <Pressable
          onPress={() => closeSceneScreen("cast-finish-fixture")}
          style={styles.close}
          accessibilityRole="button"
          accessibilityLabel="Close cast finish preview"
        >
          <Text style={styles.closeLabel}>Close</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>
        Full claim ceremony: Pond Ripple, then pure text field-note page. No Firestore writes. Add
        ?ring=0 to skip ring (dev-only). Rings only — /pond-ripple-fixture
      </Text>

      <View style={styles.stage}>
        <View style={styles.claimBackdrop}>
          <ClaimCelebrationCard
            key={`${active.id}-${playKey}-card`}
            celebration={celebration}
            showContinue={revealReady}
            continueAccessibilityLabel="Replay cast finish preview"
            onContinue={replay}
            claimDateMs={active.claim.claimedAt}
            revealOverlay={
              showRingOverlay ? (
                <CatalogRarityRing
                  key={`${active.id}-${playKey}-ring`}
                  caughtTier={caughtTier}
                  subscriptionTier={active.subscriptionTier}
                  claimedCreatureId={`dev-${active.id}-${playKey}`}
                  onComplete={() => setRevealReady(true)}
                />
              ) : null
            }
          />
        </View>
      </View>

      <Pressable
        style={styles.replay}
        onPress={replay}
        accessibilityRole="button"
        accessibilityLabel="Replay ceremony"
      >
        <Text style={styles.replayLabel}>Replay</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.list}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {PRESETS.map((item) => {
          const selected = item.id === active.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                setRevealReady(false);
                setActiveId(item.id);
                setPlayKey((k) => k + 1);
              }}
              style={[styles.chip, selected && styles.chipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                {item.label}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: fontFamilies.headingSemi,
    fontSize: 22,
    letterSpacing: -0.02 * 22,
    color: colors.textPrimary,
  },
  close: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  closeLabel: {
    fontFamily: fontFamilies.bodySemi,
    fontSize: 14,
    color: colors.primary,
  },
  hint: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 16,
  },
  stage: {
    flex: 1,
    minHeight: 360,
    marginBottom: 8,
  },
  claimBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: spacing.inner,
    backgroundColor: CLAIM_THRESHOLD_SCRIM,
  },
  replay: {
    alignSelf: "center",
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
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
