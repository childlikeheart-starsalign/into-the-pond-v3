import { useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";

import { axisToScreenX, axisToScreenY } from "@/src/components/archetype/axisToScreen";
import {
  horizontalWavePath,
  quadrantRects,
  verticalWavePath,
} from "@/src/components/archetype/wavyBoundaries";
import {
  buildMapCaption,
  type MapTrailPoint,
} from "@/src/constants/archetypeMapCopy";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";

const STORM = "#A87878";
const WALL = "#6F7D68";
const SPARK = "#C4A35A";
const QUIET_TESTER = "#8E7C93";
const BARK_UMBER = "#7A5C45";
const FILL_OPACITY = 0.75;
const QUIET_TESTER_OPACITY = 0.2;
export type ArchetypeResultMapProps = {
  axisA: number;
  axisB: number;
  /** Prior Deep Check points, oldest first. Cap: current + 2 prior. */
  trail?: MapTrailPoint[];
};

/**
 * Fixture-friendly archetype garden map (no persistence in this PR).
 * Quadrants: Spark TR, Storm BR, Wall BL, Quiet Tester TL @ 20% opacity.
 */
export function ArchetypeResultMap({ axisA, axisB, trail }: ArchetypeResultMapProps) {
  const { width: screenWidth } = useWindowDimensions();
  const size = Math.min(280, Math.round(screenWidth * 0.72));
  const inset = Math.round(size * (10 / 280));
  const plotLeft = inset;
  const plotTop = inset;
  const plotW = size - inset * 2;
  const plotH = size - inset * 2;

  const priorTrail = useMemo(() => {
    const raw = trail ?? [];
    // Keep at most 2 prior points (oldest of the kept set first)
    return raw.length > 2 ? raw.slice(-2) : raw;
  }, [trail]);

  const caption = useMemo(
    () => buildMapCaption(axisA, axisB, priorTrail),
    [axisA, axisB, priorTrail],
  );

  const geometry = useMemo(() => {
    const rects = quadrantRects(plotLeft, plotTop, plotW, plotH);
    const vWave = verticalWavePath(plotLeft, plotTop, plotW, plotH);
    const hWave = horizontalWavePath(plotLeft, plotTop, plotW, plotH);
    const markerX = axisToScreenX(axisA, plotLeft, plotW);
    const markerY = axisToScreenY(axisB, plotTop, plotH);
    const trailPts = priorTrail.map((p) => ({
      x: axisToScreenX(p.axisA, plotLeft, plotW),
      y: axisToScreenY(p.axisB, plotTop, plotH),
    }));
    const pathPts = [...trailPts, { x: markerX, y: markerY }];
    return { rects, vWave, hWave, markerX, markerY, trailPts, pathPts };
  }, [axisA, axisB, plotH, plotLeft, plotTop, plotW, priorTrail]);

  return (
    <View style={styles.wrap} accessibilityLabel={caption}>
      <Svg width={size} height={size} accessibilityLabel={caption}>
        <Defs />
        <Rect
          x={0}
          y={0}
          width={size}
          height={size}
          rx={16}
          ry={16}
          fill={colors.surface}
          stroke={colors.border}
          strokeWidth={1}
        />
        {/* Quiet Tester — top-left @ 20% */}
        <Rect
          x={geometry.rects.quietTester.x}
          y={geometry.rects.quietTester.y}
          width={geometry.rects.quietTester.w}
          height={geometry.rects.quietTester.h}
          fill={QUIET_TESTER}
          fillOpacity={QUIET_TESTER_OPACITY}
        />
        <Rect
          x={geometry.rects.spark.x}
          y={geometry.rects.spark.y}
          width={geometry.rects.spark.w}
          height={geometry.rects.spark.h}
          fill={SPARK}
          fillOpacity={FILL_OPACITY}
        />
        <Rect
          x={geometry.rects.wall.x}
          y={geometry.rects.wall.y}
          width={geometry.rects.wall.w}
          height={geometry.rects.wall.h}
          fill={WALL}
          fillOpacity={FILL_OPACITY}
        />
        <Rect
          x={geometry.rects.storm.x}
          y={geometry.rects.storm.y}
          width={geometry.rects.storm.w}
          height={geometry.rects.storm.h}
          fill={STORM}
          fillOpacity={FILL_OPACITY}
        />
        <Path d={geometry.vWave} stroke={BARK_UMBER} strokeWidth={1.5} fill="none" opacity={0.45} />
        <Path d={geometry.hWave} stroke={BARK_UMBER} strokeWidth={1.5} fill="none" opacity={0.45} />
        <SvgText
          x={geometry.rects.spark.x + geometry.rects.spark.w / 2}
          y={geometry.rects.spark.y + 14}
          fill={BARK_UMBER}
          fontSize={10}
          fontFamily={fontFamilies.body}
          textAnchor="middle"
          opacity={0.85}
        >
          Spark
        </SvgText>
        <SvgText
          x={geometry.rects.storm.x + geometry.rects.storm.w / 2}
          y={geometry.rects.storm.y + geometry.rects.storm.h - 8}
          fill={BARK_UMBER}
          fontSize={10}
          fontFamily={fontFamilies.body}
          textAnchor="middle"
          opacity={0.85}
        >
          Storm
        </SvgText>
        <SvgText
          x={geometry.rects.wall.x + geometry.rects.wall.w / 2}
          y={geometry.rects.wall.y + geometry.rects.wall.h - 8}
          fill={BARK_UMBER}
          fontSize={10}
          fontFamily={fontFamilies.body}
          textAnchor="middle"
          opacity={0.85}
        >
          Wall
        </SvgText>
        <SvgText
          x={geometry.rects.quietTester.x + geometry.rects.quietTester.w / 2}
          y={geometry.rects.quietTester.y + 14}
          fill={BARK_UMBER}
          fontSize={9}
          fontFamily={fontFamilies.body}
          textAnchor="middle"
          opacity={0.55}
        >
          Quiet Tester
        </SvgText>

        {geometry.pathPts.length >= 2
          ? geometry.pathPts.slice(0, -1).map((from, i) => {
              const to = geometry.pathPts[i + 1]!;
              return (
                <Line
                  key={`seg-${i}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={BARK_UMBER}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  opacity={0.4}
                />
              );
            })
          : null}

        {geometry.trailPts.map((p, i) => {
          const opacity = 0.35 + (i / Math.max(geometry.trailPts.length - 1, 1)) * 0.25;
          return (
            <Circle
              key={`trail-${i}`}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={BARK_UMBER}
              opacity={Number.isFinite(opacity) ? opacity : 0.35}
            />
          );
        })}

        <Circle cx={geometry.markerX} cy={geometry.markerY} r={16} fill={BARK_UMBER} opacity={0.15} />
        <Circle cx={geometry.markerX} cy={geometry.markerY} r={10} fill={BARK_UMBER} opacity={0.3} />
        <Circle cx={geometry.markerX} cy={geometry.markerY} r={5} fill={BARK_UMBER} opacity={1} />
      </Svg>
      <Text style={styles.caption} accessibilityElementsHidden>
        {caption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.inner,
  },
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.inner,
    maxWidth: 320,
  },
});
