import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ArchetypeResultMap } from "@/src/components/archetype/ArchetypeResultMap";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";
import { routes } from "@/src/navigation/routes";

type FixturePreset = {
  id: string;
  label: string;
  shotHint: string;
  axisA: number;
  axisB: number;
};

const FIXTURE_PRESETS: readonly FixturePreset[] = [
  {
    id: "spark",
    label: "Spark",
    shotHint: "Top-right quadrant",
    axisA: 95,
    axisB: 95,
  },
  {
    id: "storm",
    label: "Storm",
    shotHint: "Bottom-right quadrant",
    axisA: 95,
    axisB: 5,
  },
  {
    id: "wall",
    label: "Wall",
    shotHint: "Bottom-left quadrant",
    axisA: 5,
    axisB: 5,
  },
  {
    id: "quietTester",
    label: "Quiet Tester",
    shotHint: "Top-left @ reduced opacity",
    axisA: 5,
    axisB: 95,
  },
  {
    id: "center",
    label: "Center blend",
    shotHint: "Near-center caption (optional)",
    axisA: 50,
    axisB: 50,
  },
] as const;

/**
 * Dev-only visual QA fixture for ArchetypeResultMap screenshots.
 * Open: /archetype-map-fixture (Expo Router) while Metro is running.
 * Not linked from production navigation; __DEV__ gate only.
 */
export default function ArchetypeMapFixtureScreen() {
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const [activeId, setActiveId] = useState<string>("spark");

  useEffect(() => {
    if (typeof preset !== "string") return;
    if (FIXTURE_PRESETS.some((p) => p.id === preset)) {
      setActiveId(preset);
    }
  }, [preset]);

  const active = useMemo(
    () => FIXTURE_PRESETS.find((p) => p.id === activeId) ?? FIXTURE_PRESETS[0]!,
    [activeId],
  );

  if (!__DEV__) {
    return <Redirect href={routes.sanctuary} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Archetype map — visual QA fixture</Text>
        <Text style={styles.note}>
          Dev only. Pick a preset, screenshot the map, save under docs/visual-qa/. Remove this route
          before store release.
        </Text>

        <View style={styles.presetRow}>
          {FIXTURE_PRESETS.map((preset) => {
            const selected = preset.id === activeId;
            return (
              <Pressable
                key={preset.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Show ${preset.label} fixture`}
                onPress={() => setActiveId(preset.id)}
                style={[styles.presetBtn, selected && styles.presetBtnSelected]}
              >
                <Text style={[styles.presetLabel, selected && styles.presetLabelSelected]}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.mapCard}>
          <Text style={styles.shotHint}>{active.shotHint}</Text>
          <Text style={styles.axes}>
            axisA={active.axisA} · axisB={active.axisB}
          </Text>
          <ArchetypeResultMap axisA={active.axisA} axisB={active.axisB} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: spacing.inner,
    paddingTop: spacing.inner,
    paddingBottom: 32,
    gap: 16,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: 22,
    letterSpacing: -0.44,
    color: colors.textPrimary,
    textAlign: "center",
  },
  note: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  presetBtn: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  presetBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  presetLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  presetLabelSelected: {
    color: colors.textPrimary,
  },
  mapCard: {
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 12,
  },
  shotHint: {
    fontFamily: fontFamilies.heading,
    fontSize: 18,
    letterSpacing: -0.36,
    color: colors.textPrimary,
    textAlign: "center",
  },
  axes: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
