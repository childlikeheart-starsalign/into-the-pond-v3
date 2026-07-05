import { Image, ImageBackground, StyleSheet, Text, View } from "react-native";
import type { Timestamp } from "firebase/firestore";

import { atlasColors, fontFamilies } from "@/src/constants/theme";
import { ATLAS_LEARNED_LABEL, ATLAS_QUESTION_LABEL } from "@/src/features/childAtlas/atlasCopy";
import { ATLAS_ENTRY_CARDS, ATLAS_WAVY_DIVIDER } from "@/src/features/childAtlas/atlasAssets";
import {
  ATLAS_ENTRY_CARD_LAYOUT,
  normRectToImageStyle,
  normRectToStyle,
} from "@/src/features/childAtlas/atlasEntryCardLayout";
import type { ChildAtlasEntry } from "@/src/hooks/useChildAtlas";

/** Live text on entry cards — 40% smaller than spec artboard sizes. */
const FONT_SCALE = 0.6;

const META_FONT_SIZE = 12 * FONT_SCALE;
const META_LETTER_SPACING = META_FONT_SIZE * 0.16;

function formatDate(value: Timestamp | Date | { toDate?: () => Date } | undefined): string {
  const date =
    value && typeof value === "object" && "toDate" in value && value.toDate
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date();
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();
}

type ChildAtlasEntrySlideProps = {
  entry: ChildAtlasEntry;
  width: number;
};

export function ChildAtlasEntrySlide({ entry, width }: ChildAtlasEntrySlideProps) {
  const height = width / (278 / 298);
  const source = ATLAS_ENTRY_CARDS[entry.category];
  const layout = ATLAS_ENTRY_CARD_LAYOUT;

  return (
    <View style={{ width, alignItems: "center" }}>
      <ImageBackground source={source} style={{ width, height }} resizeMode="stretch">
        <View style={normRectToStyle(layout.question, width, height)}>
          <Text style={styles.sectionLabel}>{ATLAS_QUESTION_LABEL}</Text>
          <Text style={styles.prompt} numberOfLines={4}>
            {entry.prompt}
          </Text>
        </View>

        <Image
          source={ATLAS_WAVY_DIVIDER}
          style={[normRectToImageStyle(layout.dividerAfterQuestion, width, height), styles.divider]}
          resizeMode="stretch"
        />

        <View style={normRectToStyle(layout.reflection, width, height)}>
          <Text style={styles.sectionLabel}>{ATLAS_LEARNED_LABEL}</Text>
          <Text style={styles.reflection} numberOfLines={3}>
            {entry.reflectionText}
          </Text>
        </View>

        <Image
          source={ATLAS_WAVY_DIVIDER}
          style={[normRectToImageStyle(layout.dividerBeforeDate, width, height), styles.divider]}
          resizeMode="stretch"
        />

        <View style={normRectToStyle(layout.metadata, width, height)}>
          <Text style={styles.meta}>{formatDate(entry.dateDiscovered)}</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 13 * FONT_SCALE,
    letterSpacing: 1 * FONT_SCALE,
    textTransform: "uppercase",
    color: atlasColors.metaInk,
    marginBottom: 6 * FONT_SCALE,
  },
  prompt: {
    fontFamily: fontFamilies.body,
    fontSize: 16 * FONT_SCALE,
    lineHeight: 24 * FONT_SCALE,
    fontStyle: "italic",
    color: atlasColors.promptInk,
  },
  divider: {
    opacity: 0.7,
  },
  reflection: {
    fontFamily: fontFamilies.body,
    fontSize: 15 * FONT_SCALE,
    lineHeight: 22.5 * FONT_SCALE,
    color: atlasColors.reflectionInk,
  },
  meta: {
    fontFamily: fontFamilies.body,
    fontSize: META_FONT_SIZE,
    letterSpacing: META_LETTER_SPACING,
    textTransform: "uppercase",
    color: atlasColors.metaInk,
  },
});
