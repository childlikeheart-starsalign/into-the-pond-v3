import { useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, ClipPath, Defs, G, Path, Rect, Text as SvgText } from "react-native-svg";

import { axisToScreenX, axisToScreenY } from "@/src/components/archetype/axisToScreen";
import {
  GARDEN_MAP_BG,
  MAP_BORDER_OPACITY,
  NAMED_REGION_FILL_OPACITY,
  QUIET_TESTER_FILL,
  QUIET_TESTER_FILL_OPACITY,
  REGION_FILL_OPACITY,
  gardenCircleRegions,
  mapCornerRadius,
  regionLabels,
  trailCurvePath,
} from "@/src/components/archetype/gardenMapGeometry";
import { JournalMargin } from "@/src/components/journal/JournalMargin";
import { formatObservedMarginDate } from "@/src/components/journal/formatJournalMarginDate";
import { buildMapCaption, type MapTrailPoint } from "@/src/constants/archetypeMapCopy";
import {
  MARKER_DEEP,
  MARKER_QUICK,
  markerFillForSource,
} from "@/src/constants/archetypeMapMarkers";
import { colors, fontFamilies, spacing } from "@/src/constants/theme";

export {
  NAMED_REGION_FILL_OPACITY,
  QUIET_TESTER_FILL,
  QUIET_TESTER_FILL_OPACITY,
  REGION_FILL_OPACITY,
};

const STORM = "#A87878";
const WALL = "#6F7D68";
const SPARK = "#C4A35A";
const BARK_UMBER = "#7A5C45";

export type ArchetypeResultMapProps = {
  axisA: number;
  axisB: number;
  /** Prior map-trail points, oldest first. Cap: current + 4 priors (5 total). */
  trail?: MapTrailPoint[];
  /** When true, omit the geometric caption under the SVG (result card shows Spirit instead). */
  hideCaption?: boolean;
  /** Override computed map edge length (folio plates pass content width). */
  size?: number;
  /** Current check ISO timestamp for corner journal margin. */
  observedAt?: string | null;
  /** Source of the current (newest) marker. */
  currentSource?: "quick" | "deep" | null;
};

/**
 * Archetype garden map — overlapping flat regions clipped to a rounded plot.
 * Visual spec: xy_garden_map_updated_palette.html (32% region opacity, no wavy dividers).
 */
export function ArchetypeResultMap({
  axisA,
  axisB,
  trail,
  hideCaption = false,
  size: sizeProp,
  observedAt = null,
  currentSource = null,
}: ArchetypeResultMapProps) {
  const { width: screenWidth } = useWindowDimensions();
  const size = sizeProp ?? Math.min(280, Math.round(screenWidth * 0.72));
  const inset = Math.round(size * (10 / 280));
  const plotLeft = inset;
  const plotTop = inset;
  const plotW = size - inset * 2;
  const plotH = size - inset * 2;
  const cornerRadius = mapCornerRadius(plotW);
  const observedLabel = observedAt ? formatObservedMarginDate(observedAt) : "";
  const currentFill = markerFillForSource(currentSource);

  const priorTrail = useMemo(() => {
    const raw = trail ?? [];
    return raw.length > 4 ? raw.slice(-4) : raw;
  }, [trail]);

  const caption = useMemo(
    () => buildMapCaption(axisA, axisB, priorTrail),
    [axisA, axisB, priorTrail],
  );

  const geometry = useMemo(() => {
    const circles = gardenCircleRegions(plotLeft, plotTop, plotW, plotH, {
      wall: WALL,
      storm: STORM,
      spark: SPARK,
      quietTester: QUIET_TESTER_FILL,
    });
    const labels = regionLabels(plotLeft, plotTop, plotW, plotH);
    const markerX = axisToScreenX(axisA, plotLeft, plotW);
    const markerY = axisToScreenY(axisB, plotTop, plotH);
    const trailPts = priorTrail.map((p) => ({
      x: axisToScreenX(p.axisA, plotLeft, plotW),
      y: axisToScreenY(p.axisB, plotTop, plotH),
      fill: markerFillForSource(p.source),
    }));
    // Single completed check → marker only; dashed path needs ≥1 prior.
    const trailPath =
      priorTrail.length >= 1 ? trailCurvePath([...trailPts, { x: markerX, y: markerY }]) : "";
    return { circles, labels, markerX, markerY, trailPts, trailPath };
  }, [axisA, axisB, plotH, plotLeft, plotTop, plotW, priorTrail]);

  return (
    <View style={styles.wrap} accessibilityLabel={hideCaption ? undefined : caption}>
      <View style={[styles.plotFrame, { width: size, height: size }]}>
        <Svg width={size} height={size} accessibilityLabel={hideCaption ? undefined : caption}>
          <Defs>
            <ClipPath id="archetypeMapClip">
              <Rect
                x={plotLeft}
                y={plotTop}
                width={plotW}
                height={plotH}
                rx={cornerRadius}
                ry={cornerRadius}
              />
            </ClipPath>
          </Defs>

          <Rect
            x={plotLeft}
            y={plotTop}
            width={plotW}
            height={plotH}
            rx={cornerRadius}
            ry={cornerRadius}
            fill={GARDEN_MAP_BG}
          />

          <G clipPath="url(#archetypeMapClip)">
            {geometry.circles.map((region) => (
              <Circle
                key={region.key}
                cx={region.cx}
                cy={region.cy}
                r={region.r}
                fill={region.fill}
                fillOpacity={
                  region.key === "quietTester"
                    ? QUIET_TESTER_FILL_OPACITY
                    : NAMED_REGION_FILL_OPACITY
                }
              />
            ))}
          </G>

          <Rect
            x={plotLeft}
            y={plotTop}
            width={plotW}
            height={plotH}
            rx={cornerRadius}
            ry={cornerRadius}
            fill="none"
            stroke={BARK_UMBER}
            strokeOpacity={MAP_BORDER_OPACITY}
            strokeWidth={1}
          />

          {geometry.labels.map((label) => (
            <SvgText
              key={label.text}
              x={label.x}
              y={label.y}
              fill={BARK_UMBER}
              fontSize={label.fontSize}
              fontFamily={fontFamilies.body}
              opacity={label.opacity}
            >
              {label.text}
            </SvgText>
          ))}

          {geometry.trailPath ? (
            <Path
              d={geometry.trailPath}
              stroke={BARK_UMBER}
              strokeWidth={1}
              fill="none"
              strokeOpacity={0.4}
              strokeDasharray="2,3"
            />
          ) : null}

          {geometry.trailPts.map((p, i) => {
            const opacity = 0.4 + (i / Math.max(geometry.trailPts.length - 1, 1)) * 0.2;
            return (
              <Circle
                key={`trail-${i}`}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={p.fill}
                opacity={Number.isFinite(opacity) ? opacity : 0.4}
              />
            );
          })}

          <Circle
            cx={geometry.markerX}
            cy={geometry.markerY}
            r={16}
            fill={currentFill}
            opacity={0.15}
          />
          <Circle
            cx={geometry.markerX}
            cy={geometry.markerY}
            r={10}
            fill={currentFill}
            opacity={0.3}
          />
          <Circle
            cx={geometry.markerX}
            cy={geometry.markerY}
            r={5}
            fill={currentFill}
            opacity={1}
          />
        </Svg>
        {observedLabel ? (
          <JournalMargin
            position="corner"
            content={observedLabel}
            variant="date"
            accessibilityGrouping="trailing"
          />
        ) : null}
      </View>
      {hideCaption ? null : (
        <Text style={styles.caption} accessibilityElementsHidden>
          {caption}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.inner,
  },
  plotFrame: {
    position: "relative",
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
