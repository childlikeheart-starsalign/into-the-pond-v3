import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ImageBackground,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { ATLAS_PAPER_TEXTURE } from "@/src/features/childAtlas/atlasAssets";
import { fontFamilies } from "@/src/constants/theme";

/** Aged parchment / warm cream — already used on Sanctuary field notes. */
const PARCHMENT = "#F6EBD7";
const IVORY_BLOOM = "rgba(255, 248, 235, 0.28)";
/** Warm charcoal for titles. */
const HEADING_INK = "#544D46";
/** Softened charcoal for body. */
const BODY_INK = "#5B514A";
/** Walnut ink stroke. */
const INK_STROKE = "rgba(75, 67, 60, 0.19)";
/** Faded sage foxing accent. */
const SAGE_FOXING = "rgba(111, 125, 104, 0.12)";
const WALNUT_SHADOW = "#2C2418";

export function buildIrregularBorderPath(width: number, height: number): string {
  if (width <= 0 || height <= 0) return "";

  const inset = 1;
  const x = inset;
  const y = inset;
  const w = width - inset * 2;
  const h = height - inset * 2;
  const rTL = 2;
  const rTR = 5;
  const rBR = 4;
  const rBL = 3;
  const wobble = 0.35;

  return [
    `M ${x + rTL} ${y + wobble}`,
    `L ${x + w - rTR - wobble * 0.5} ${y}`,
    `Q ${x + w + wobble * 0.3} ${y + wobble} ${x + w} ${y + rTR}`,
    `L ${x + w - wobble * 0.5} ${y + h - rBR}`,
    `Q ${x + w - wobble} ${y + h + wobble * 0.2} ${x + w - rBR} ${y + h}`,
    `L ${x + rBL + wobble} ${y + h - wobble * 0.5}`,
    `Q ${x - wobble * 0.2} ${y + h} ${x} ${y + h - rBL}`,
    `L ${x + wobble * 0.5} ${y + rTL}`,
    `Q ${x} ${y - wobble * 0.2} ${x + rTL} ${y}`,
    "Z",
  ].join(" ");
}

export function FieldNoteBorder({ width, height }: { width: number; height: number }) {
  if (width <= 0 || height <= 0) return null;

  return (
    <Svg width={width} height={height} style={styles.borderSvg} pointerEvents="none">
      <Path
        d={buildIrregularBorderPath(width, height)}
        fill="none"
        stroke={INK_STROKE}
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export type SanctuaryFieldNoteProps = {
  heading: string;
  body: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Uniform size multiplier (e.g. 0.7 = 30% smaller). Defaults to 1. */
  scale?: number;
};

/**
 * Soft parchment field note — atlas paper texture, irregular ink border,
 * Playfair heading + Inter body. Used for Sanctuary soft blockers (e.g. cast errors).
 */
export function SanctuaryFieldNote({
  heading,
  body,
  onPress,
  accessibilityLabel,
  style,
  scale = 1,
}: SanctuaryFieldNoteProps) {
  const s = (value: number) => value * scale;
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const [textColumnWidth, setTextColumnWidth] = useState(0);

  const handleCardLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCardSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  const handleTextColumnLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setTextColumnWidth((prev) => (prev === width ? prev : width));
  };

  // pad each side ≈ 10% of final card width ⇒ pad = 0.125 × text column width
  const padH = textColumnWidth > 0 ? Math.max(s(12), Math.round(textColumnWidth * 0.125)) : s(16);

  const headingSize = s(17);
  const bodySize = s(14);

  const content = (
    <View
      style={[
        styles.noteCard,
        {
          minHeight: s(48),
          shadowRadius: s(4),
        },
      ]}
      onLayout={handleCardLayout}
    >
      <ImageBackground
        source={ATLAS_PAPER_TEXTURE}
        style={styles.paperTexture}
        imageStyle={styles.paperTextureImage}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={[IVORY_BLOOM, "rgba(246, 235, 215, 0)"]}
        style={styles.watercolorBloom}
        start={{ x: 0.5, y: 0.35 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(75, 67, 60, 0.058)", "rgba(75, 67, 60, 0)"]}
        style={[styles.edgeVignetteTop, { height: s(10) }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(75, 67, 60, 0)", "rgba(75, 67, 60, 0.05)"]}
        style={[styles.edgeVignetteBottom, { height: s(10) }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(75, 67, 60, 0.043)", "rgba(75, 67, 60, 0)"]}
        style={[styles.edgeVignetteLeft, { width: s(8) }]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(75, 67, 60, 0)", "rgba(75, 67, 60, 0.043)"]}
        style={[styles.edgeVignetteRight, { width: s(8) }]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        pointerEvents="none"
      />
      <View
        style={[
          styles.foxingSpot,
          {
            top: s(16),
            right: s(22),
            width: s(4),
            height: s(4),
            borderRadius: s(2),
          },
        ]}
      />
      <View style={[styles.noteContent, { paddingHorizontal: padH, paddingVertical: s(14) }]}>
        <View style={[styles.textColumn, { gap: s(6) }]} onLayout={handleTextColumnLayout}>
          <Text
            style={[
              styles.heading,
              {
                fontSize: headingSize,
                lineHeight: s(22),
                letterSpacing: -0.02 * headingSize,
              },
            ]}
          >
            {heading}
          </Text>
          <Text style={[styles.body, { fontSize: bodySize, lineHeight: s(20) }]}>{body}</Text>
        </View>
      </View>
      <FieldNoteBorder width={cardSize.width} height={cardSize.height} />
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? heading}
        onPress={onPress}
        style={[styles.wrap, styles.pressableHit, style]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? `${heading}. ${body}`}
      style={[styles.wrap, style]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    alignItems: "center",
  },
  pressableHit: {
    minHeight: 48,
    justifyContent: "center",
  },
  noteCard: {
    backgroundColor: PARCHMENT,
    overflow: "hidden",
    alignSelf: "center",
    shadowColor: WALNUT_SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    elevation: 1,
  },
  paperTexture: {
    ...StyleSheet.absoluteFillObject,
  },
  paperTextureImage: {
    opacity: 0.11,
  },
  watercolorBloom: {
    ...StyleSheet.absoluteFillObject,
  },
  edgeVignetteTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  edgeVignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  edgeVignetteLeft: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
  edgeVignetteRight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
  },
  foxingSpot: {
    position: "absolute",
    backgroundColor: SAGE_FOXING,
  },
  noteContent: {
    alignItems: "center",
    alignSelf: "center",
  },
  textColumn: {
    alignItems: "center",
  },
  borderSvg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  heading: {
    color: HEADING_INK,
    fontFamily: fontFamilies.headingSemi,
    textAlign: "center",
  },
  body: {
    color: BODY_INK,
    fontFamily: fontFamilies.body,
    textAlign: "center",
  },
});
