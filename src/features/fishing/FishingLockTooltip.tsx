import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, ImageBackground, LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import { ATLAS_PAPER_TEXTURE } from "@/src/features/childAtlas/atlasAssets";
import { fontFamilies } from "@/src/constants/theme";

export type FishingLockTooltipVariant = "bait" | "rod";

const PARCHMENT = "#F6EBD7";
const HEADING_INK = "#544D46";
const BODY_INK = "#6A645D";
const INK_STROKE = "rgba(75, 67, 60, 0.19)";

const FIELD_NOTE_SCALE = 0.7;
const s = (value: number) => value * FIELD_NOTE_SCALE;

const NOTE_MIN_WIDTH = s(138);
const NOTE_MAX_WIDTH = s(192);
const NOTE_PADDING_H = s(16);
const NOTE_PADDING_V = s(5);

const ANCHOR_BOTTOM_BY_VARIANT = {
  bait: "101%",
  rod: "102%",
} as const;

const ANCHOR_OFFSET_BY_VARIANT = {
  bait: 1,
  rod: 3,
} as const;

const ANCHOR_DOWN_PX = 20;

const ENTRANCE_MS = 230;
const DRIFT_PX = s(3.5);

const FIELD_NOTE_COPY = {
  rod: {
    heading: "Not quite yet",
    body: "Craft this rod at the Craft Bench first.",
  },
  bait: {
    heading: "Not quite yet",
    body: "This bait is included with membership.",
  },
} as const;

type FishingLockTooltipProps = {
  variant: FishingLockTooltipVariant;
};

function buildIrregularBorderPath(width: number, height: number): string {
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

function FieldNoteBorder({ width, height }: { width: number; height: number }) {
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

function FoldedPaperTab() {
  const tabWidth = s(7);
  const tabHeight = s(4);

  return (
    <Svg width={tabWidth} height={tabHeight} style={styles.foldedTab} pointerEvents="none">
      <Path
        d={`M 0 0 L ${tabWidth} 0 L ${s(5.5)} ${tabHeight} L ${s(1.5)} ${tabHeight} Z`}
        fill={PARCHMENT}
      />
      <Line
        x1={s(1.5)}
        y1={tabHeight}
        x2={s(3.5)}
        y2={s(1.5)}
        stroke="rgba(75, 67, 60, 0.18)"
        strokeWidth={1}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function FishingLockTooltip({ variant }: FishingLockTooltipProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(DRIFT_PX)).current;
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const copy = FIELD_NOTE_COPY[variant];

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(DRIFT_PX);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ENTRANCE_MS,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ENTRANCE_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, variant]);

  const handleCardLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCardSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.anchor,
        {
          bottom: ANCHOR_BOTTOM_BY_VARIANT[variant],
          marginBottom: ANCHOR_OFFSET_BY_VARIANT[variant] - ANCHOR_DOWN_PX,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.noteCard} onLayout={handleCardLayout}>
        <ImageBackground
          source={ATLAS_PAPER_TEXTURE}
          style={styles.paperTexture}
          imageStyle={styles.paperTextureImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <LinearGradient
          colors={["rgba(255, 248, 235, 0.28)", "rgba(246, 235, 215, 0)"]}
          style={styles.watercolorBloom}
          start={{ x: 0.5, y: 0.35 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["rgba(75, 67, 60, 0.058)", "rgba(75, 67, 60, 0)"]}
          style={styles.edgeVignetteTop}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["rgba(75, 67, 60, 0)", "rgba(75, 67, 60, 0.05)"]}
          style={styles.edgeVignetteBottom}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["rgba(75, 67, 60, 0.043)", "rgba(75, 67, 60, 0)"]}
          style={styles.edgeVignetteLeft}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["rgba(75, 67, 60, 0)", "rgba(75, 67, 60, 0.043)"]}
          style={styles.edgeVignetteRight}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          pointerEvents="none"
        />
        <View style={styles.foxingSpot} />
        <View style={styles.noteContent}>
          <Text style={styles.heading}>{copy.heading}</Text>
          <Text style={styles.body}>{copy.body}</Text>
        </View>
        <FieldNoteBorder width={cardSize.width} height={cardSize.height} />
      </View>
      <FoldedPaperTab />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    zIndex: 100,
    minWidth: NOTE_MIN_WIDTH,
    maxWidth: NOTE_MAX_WIDTH,
    alignSelf: "center",
    alignItems: "center",
  },
  noteCard: {
    backgroundColor: PARCHMENT,
    overflow: "hidden",
    shadowColor: "#2C2418",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.018,
    shadowRadius: s(2),
    elevation: 0,
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
    height: s(8),
  },
  edgeVignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: s(8),
  },
  edgeVignetteLeft: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: s(6),
  },
  edgeVignetteRight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: s(6),
  },
  foxingSpot: {
    position: "absolute",
    top: s(14),
    right: s(18),
    width: s(3),
    height: s(3),
    borderRadius: s(2),
    backgroundColor: "rgba(139, 115, 85, 0.09)",
  },
  noteContent: {
    paddingHorizontal: NOTE_PADDING_H,
    paddingVertical: NOTE_PADDING_V,
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  borderSvg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  heading: {
    color: HEADING_INK,
    fontFamily: fontFamilies.handwritten,
    fontSize: s(16.5),
    lineHeight: s(19),
    textAlign: "left",
    alignSelf: "stretch",
    marginBottom: s(2),
    opacity: 0.9,
  },
  body: {
    color: BODY_INK,
    fontFamily: fontFamilies.headingRegular,
    fontSize: s(12.5),
    lineHeight: s(17.5),
    letterSpacing: -0.02 * s(12.5),
    textAlign: "left",
    alignSelf: "stretch",
  },
  foldedTab: {
    marginTop: -1,
    alignSelf: "center",
  },
});
