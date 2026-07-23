import { StyleSheet, Text, View } from "react-native";

import { FolioOrnamentDivider } from "@/components/story/FolioOrnamentDivider";
import { ArchetypeResultMap } from "@/src/components/archetype/ArchetypeResultMap";
import type { MapTrailPoint } from "@/src/constants/archetypeMapCopy";
import { storyPlateInk, storyPlateTextStyles } from "@/src/constants/storyPlateTypography";
import { fontFamilies, spacing } from "@/src/constants/theme";

type Props = {
  displayName: string;
  spiritVoice: string;
  axisA: number;
  axisB: number;
  /** Prior map-trail points (oldest first). */
  trail?: MapTrailPoint[];
  /** Current check ISO for map corner margin. */
  observedAt?: string | null;
  /** Optional folio eyebrow above the display name (e.g. peek context). */
  eyebrow?: string | null;
  /** Map edge length fitted to plate content width. */
  mapSize: number;
  /** Source of the current (newest) marker. */
  currentSource?: "quick" | "deep" | null;
};

/**
 * Front of archetype result flip card — map + display name + Spirit-only line.
 * Renders as transparent content for the shared folio parchment shell.
 */
export function ArchetypeResultCardFront({
  displayName,
  spiritVoice,
  axisA,
  axisB,
  trail,
  observedAt = null,
  eyebrow,
  mapSize,
  currentSource = null,
}: Props) {
  return (
    <View
      style={styles.wrap}
      accessibilityLabel={`${eyebrow ? `${eyebrow}. ` : ""}${displayName}. ${spiritVoice}`}
    >
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={[storyPlateTextStyles.title, styles.title]}>{displayName}</Text>
      <FolioOrnamentDivider />
      <ArchetypeResultMap
        axisA={axisA}
        axisB={axisB}
        trail={trail}
        observedAt={observedAt}
        currentSource={currentSource}
        hideCaption
        size={mapSize}
      />
      <Text style={[storyPlateTextStyles.quote, styles.spirit]}>{spiritVoice}</Text>
      <Text style={styles.hint}>Swipe to flip</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    gap: spacing.inner,
    minHeight: 48,
  },
  eyebrow: {
    fontFamily: fontFamilies.body,
    fontSize: 11.5,
    lineHeight: 17.5,
    color: storyPlateInk,
    opacity: 0.72,
    textAlign: "center",
  },
  title: {
    textAlign: "center",
    width: "100%",
    marginTop: 30,
  },
  spirit: {
    fontSize: 12.9,
    lineHeight: 19.9,
    marginTop: 8,
  },
  hint: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 10.4,
    color: storyPlateInk,
    opacity: 0.65,
    marginTop: -4,
  },
});
