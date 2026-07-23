import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Animated, ImageBackground, LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import { FieldNoteBorder } from "@/src/components/sanctuary/SanctuaryFieldNote";
import { ATLAS_PAPER_TEXTURE } from "@/src/features/childAtlas/atlasAssets";
import { fontFamilies } from "@/src/constants/theme";

export type FishingLockTooltipVariant = "bait" | "rod";

const PARCHMENT = "#F6EBD7";
const HEADING_INK = "#544D46";
const BODY_INK = "#6A645D";

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
  /** Optional override for body copy (e.g. out-of-stock bait). */
  body?: string;
};

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

export function FishingLockTooltip({ variant, body }: FishingLockTooltipProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(DRIFT_PX)).current;
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const copy = {
    heading: FIELD_NOTE_COPY[variant].heading,
    body: body ?? FIELD_NOTE_COPY[variant].body,
  };

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
  }, [opacity, translateY, variant, body]);

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
  heading: {
    color: HEADING_INK,
    fontFamily: fontFamilies.headingSemi,
    fontSize: s(13),
    lineHeight: s(16),
    letterSpacing: -0.02 * s(13),
    textAlign: "left",
    alignSelf: "stretch",
    marginBottom: s(2),
  },
  body: {
    color: BODY_INK,
    fontFamily: fontFamilies.body,
    fontSize: s(11),
    lineHeight: s(15),
    textAlign: "left",
    alignSelf: "stretch",
  },
  foldedTab: {
    marginTop: -1,
    alignSelf: "center",
  },
});
