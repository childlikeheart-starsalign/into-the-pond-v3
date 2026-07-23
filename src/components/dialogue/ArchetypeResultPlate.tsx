import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Portrait } from "@/components/story/Portrait";
import { FolioOrnamentDivider } from "@/components/story/FolioOrnamentDivider";
import { STORY_LONG_CARD } from "@/src/constants/storyAssets";
import {
  computeStoryPlateDimensions,
  storyPlateLayoutStyles,
  storyPlateTextStyles,
} from "@/src/constants/storyPlateTypography";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";

type ArchetypeResultPlateProps = {
  title: string;
  quote: string;
  reflection: string;
  disclaimer: string | null;
  portrait: ImageSourcePropType | null;
  /** Visible primary CTA text (required — no default). */
  ctaLabel: string;
  /** Accessibility label for the primary CTA (required — not derived from visible text alone). */
  ctaAccessibilityLabel: string;
  onContinue: () => void;
  /** Secondary text-weight action (e.g. Deep check stub). */
  secondaryCtaLabel?: string;
  onSecondaryPress?: () => void;
};

/**
 * Single tall parchment page for archetype reveal —
 * title, quote, disclaimer, and CTA as typography on one long card.
 */
export function ArchetypeResultPlate({
  title,
  quote,
  reflection,
  disclaimer,
  portrait,
  ctaLabel,
  ctaAccessibilityLabel,
  onContinue,
  secondaryCtaLabel,
  onSecondaryPress,
}: ArchetypeResultPlateProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const { plateWidth, plateHeight, padH, padV, bottomMargin, medallionSize } =
    computeStoryPlateDimensions(screenWidth, screenHeight);

  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 16) }]}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${quote}`}
    >
      <ImageBackground
        source={STORY_LONG_CARD}
        style={[styles.plate, { width: plateWidth, height: plateHeight }]}
        imageStyle={styles.plateImage}
        resizeMode="stretch"
      >
        <View
          style={[
            storyPlateLayoutStyles.inner,
            {
              paddingHorizontal: padH,
              paddingTop: padV,
              paddingBottom: bottomMargin + 52 + (secondaryCtaLabel ? 36 : 0),
            },
          ]}
        >
          <View style={storyPlateLayoutStyles.titleRow}>
            {portrait ? <Portrait source={portrait} size={medallionSize} /> : null}
            <Text
              style={[
                storyPlateTextStyles.title,
                portrait ? { marginLeft: spacing.inner } : null,
                { flex: 1 },
              ]}
            >
              {title}
            </Text>
          </View>

          <Text style={storyPlateTextStyles.quote}>{quote}</Text>

          <FolioOrnamentDivider />

          <View style={storyPlateLayoutStyles.reflectionSection}>
            <Text style={storyPlateTextStyles.sectionLabel}>A quiet reflection</Text>
            <Text style={storyPlateTextStyles.reflection}>{reflection}</Text>
          </View>

          <FolioOrnamentDivider />

          {disclaimer ? <Text style={storyPlateTextStyles.disclaimer}>{disclaimer}</Text> : null}
        </View>

        <View style={[styles.ctaColumn, { bottom: bottomMargin }]}>
          <Pressable
            style={({ pressed }) => [
              storyPlateLayoutStyles.cta,
              { position: "relative", bottom: undefined },
              pressed && storyPlateLayoutStyles.ctaPressed,
            ]}
            onPress={onContinue}
            accessibilityRole="button"
            accessibilityLabel={ctaAccessibilityLabel}
          >
            <MaterialCommunityIcons
              name="leaf"
              size={12}
              color={colors.primary}
              style={storyPlateTextStyles.ctaLeaf}
            />
            <Text style={storyPlateTextStyles.ctaLabel}>{ctaLabel}</Text>
          </Pressable>
          {secondaryCtaLabel && onSecondaryPress ? (
            <Pressable
              onPress={onSecondaryPress}
              accessibilityRole="button"
              accessibilityLabel={secondaryCtaLabel}
              style={styles.secondaryCta}
            >
              <Text style={styles.secondaryCtaLabel}>{secondaryCtaLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: spacing.inner,
    marginLeft: 3,
  },
  plate: {
    borderRadius: 0,
    overflow: "visible",
    backgroundColor: "transparent",
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  plateImage: {
    borderRadius: 0,
  },
  ctaColumn: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 8,
  },
  secondaryCta: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  secondaryCtaLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
});
