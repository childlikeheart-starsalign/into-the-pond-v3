import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { Pressable, ScrollView } from "react-native-gesture-handler";

import { FolioOrnamentDivider } from "@/components/story/FolioOrnamentDivider";
import {
  storyPlateInk,
  storyPlateLayoutStyles,
  storyPlateTextStyles,
} from "@/src/constants/storyPlateTypography";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";

type Props = {
  displayName: string;
  psychologicalInterpretation: string;
  whatTheyNeed: string[];
  bothCanBeTrue: string;
  ageBandNote?: string | null;
  disclaimer?: string | null;
  deepCheckIntro?: string;
  deepCheckCtaLabel?: string;
  onDeepCheckPress?: () => void;
  deepCheckRetentionNote?: string | null;
};

/**
 * Back of archetype result flip card — psychology + needs in a scrollable container.
 * Renders as transparent content for the shared folio parchment shell.
 */
export function ArchetypeResultCardBack({
  displayName,
  psychologicalInterpretation,
  whatTheyNeed,
  bothCanBeTrue,
  ageBandNote,
  disclaimer,
  deepCheckIntro,
  deepCheckCtaLabel,
  onDeepCheckPress,
  deepCheckRetentionNote,
}: Props) {
  const hasDeepCheck = Boolean(deepCheckCtaLabel && onDeepCheckPress);

  return (
    <View
      style={[styles.shell, hasDeepCheck && styles.shellWithDeepCheck]}
      accessibilityLabel={`${displayName}. Psychological interpretation. ${psychologicalInterpretation}`}
    >
      <Text style={[storyPlateTextStyles.title, styles.title]}>{displayName}</Text>
      <ScrollView
        style={[styles.scroll, hasDeepCheck && styles.scrollWithDeepCheck]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        nestedScrollEnabled
      >
        <Text style={storyPlateTextStyles.sectionLabel}>Psychological interpretation</Text>
        <Text style={storyPlateTextStyles.reflection}>{psychologicalInterpretation}</Text>

        <FolioOrnamentDivider />

        <Text style={storyPlateTextStyles.sectionLabel}>What they need</Text>
        {whatTheyNeed.slice(0, 4).map((item) => (
          <Text key={item} style={styles.bullet}>
            • {item}
          </Text>
        ))}

        {ageBandNote ? (
          <Text style={[storyPlateTextStyles.disclaimer, styles.note]}>{ageBandNote}</Text>
        ) : null}

        <Text style={styles.both}>{bothCanBeTrue}</Text>

        {disclaimer ? <Text style={storyPlateTextStyles.disclaimer}>{disclaimer}</Text> : null}
      </ScrollView>

      {hasDeepCheck ? (
        <View style={styles.deepCheckBlock}>
          {deepCheckIntro ? <Text style={styles.deepCheckIntro}>{deepCheckIntro}</Text> : null}
          <Pressable
            onPress={onDeepCheckPress}
            accessibilityRole="button"
            accessibilityLabel={deepCheckCtaLabel}
            style={({ pressed }) => [
              storyPlateLayoutStyles.cta,
              styles.deepCheckCta,
              pressed && storyPlateLayoutStyles.ctaPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="leaf"
              size={12}
              color={colors.primary}
              style={storyPlateTextStyles.ctaLeaf}
            />
            <Text style={storyPlateTextStyles.ctaLabel}>{deepCheckCtaLabel}</Text>
          </Pressable>
          {deepCheckRetentionNote ? (
            <Text style={styles.retentionNote}>{deepCheckRetentionNote}</Text>
          ) : null}
        </View>
      ) : null}

      <Text style={[styles.hint, hasDeepCheck && styles.hintAfterCta]}>Swipe to flip back</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    paddingBottom: spacing.inner,
    minHeight: 280,
  },
  shellWithDeepCheck: {
    paddingBottom: spacing.inner + 12,
  },
  title: {
    textAlign: "center",
    marginTop: 30,
    marginBottom: spacing.inner,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: "64%",
  },
  scrollWithDeepCheck: {
    maxHeight: "52%",
  },
  scrollContent: {
    gap: 12,
    paddingBottom: spacing.inner,
  },
  bullet: {
    fontFamily: fontFamilies.body,
    fontSize: 11.5,
    lineHeight: 17.5,
    color: colors.textSecondary,
    paddingLeft: 4,
  },
  note: {
    marginTop: 4,
  },
  both: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primary,
    marginTop: 4,
  },
  deepCheckBlock: {
    marginTop: spacing.inner - 1,
    gap: 8,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  deepCheckIntro: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: "center",
  },
  deepCheckCta: {
    position: "relative",
    bottom: undefined,
    minHeight: 48,
    alignSelf: "stretch",
    marginTop: 17,
  },
  retentionNote: {
    fontFamily: fontFamilies.body,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textSecondary,
    opacity: 0.78,
    textAlign: "center",
    fontStyle: "italic",
  },
  hint: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 10.4,
    color: storyPlateInk,
    opacity: 0.65,
    textAlign: "center",
    marginTop: spacing.inner + 25,
  },
  hintAfterCta: {
    marginTop: spacing.inner - 13,
  },
});
