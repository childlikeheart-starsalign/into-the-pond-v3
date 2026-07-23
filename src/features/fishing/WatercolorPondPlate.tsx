import { useMemo } from "react";
import Animated, {
  interpolateColor,
  type SharedValue,
  useAnimatedProps,
} from "react-native-reanimated";
import Svg, { Circle, G, Path } from "react-native-svg";

import {
  isBandUnlocked,
  pondRippleRecognitionTargetColor,
  POND_RIPPLE_BAND_ORDER,
  POND_RIPPLE_STROKE_WIDTHS,
  type PondRippleActiveTier,
  type PondRippleDisplayTier,
} from "@/src/features/fishing/pondRippleCatalog";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const POND_PLATE_SIZE = 180;
export const POND_PLATE_CENTER = POND_PLATE_SIZE / 2;
export const POND_PLATE_MAX_RADIUS = 78;
const BAND_GAP = 4;

function buildRadii(): Record<PondRippleDisplayTier, number> {
  const radii = {} as Record<PondRippleDisplayTier, number>;
  let radius = POND_PLATE_MAX_RADIUS;
  for (const band of POND_RIPPLE_BAND_ORDER) {
    radii[band] = radius;
    radius -= POND_RIPPLE_STROKE_WIDTHS[band] + BAND_GAP;
  }
  return radii;
}

export const POND_PLATE_RADII = buildRadii();

const PAINT: Record<PondRippleDisplayTier, string> = {
  empty: "#6F8F98",
  common: "#48AFA3",
  rare: "#9E9A67",
  epic: "#D69B32",
};

const LOCKED_PAINT: Record<PondRippleDisplayTier, string> = {
  empty: "#829CA3",
  common: "#79AAA2",
  rare: "#A6A183",
  epic: "#C6A76B",
};

const LOCK_WASH = "#D6A54B";
const PAPER_LIFT = "#FAF7F2";

type Point = { x: number; y: number };

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Deterministic hand-wobbled loop. Multiple low-opacity passes make a
 * watercolor bleed without relying on SVG filters that diverge by platform.
 */
function paintedLoop(radius: number, seed: number, wobble = 1.5): string {
  const points: Point[] = [];
  const count = 28;
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const drift =
      Math.sin(angle * 3 + seed * 0.71) * wobble * 0.58 +
      Math.sin(angle * 7 + seed * 1.37) * wobble * 0.28 +
      Math.cos(angle * 11 + seed * 0.43) * wobble * 0.14;
    const localRadius = radius + drift;
    points.push({
      x: POND_PLATE_CENTER + Math.cos(angle) * localRadius,
      y: POND_PLATE_CENTER + Math.sin(angle) * localRadius,
    });
  }

  const first = midpoint(points[points.length - 1]!, points[0]!);
  let path = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!;
    const next = points[(index + 1) % points.length]!;
    const mid = midpoint(current, next);
    path += ` Q ${current.x.toFixed(2)} ${current.y.toFixed(2)} ${mid.x.toFixed(2)} ${mid.y.toFixed(2)}`;
  }
  return `${path} Z`;
}

type WatercolorPondPlateProps = {
  caughtTier: PondRippleDisplayTier;
  activeTier: PondRippleActiveTier;
  flourish: SharedValue<number>;
  /** Recognition rest — color warmth only on matched band. */
  recognitionWarmth: SharedValue<number>;
  /** Simultaneous calm settle for non-matching bands. */
  calmBeat: SharedValue<number>;
  ackPulse?: SharedValue<number>;
  ackBand?: PondRippleDisplayTier | null;
  /** Per-band sequential illuminate; when set, drives band opacity independently. */
  bandSettles: Record<PondRippleDisplayTier, SharedValue<number>>;
};

/** Printed watercolor plate: irregular translucent washes, never perfect UI rings. */
export function WatercolorPondPlate({
  caughtTier,
  activeTier,
  flourish,
  recognitionWarmth,
  calmBeat,
  ackPulse,
  ackBand,
  bandSettles,
}: WatercolorPondPlateProps) {
  const recognitionTarget = useMemo(
    () => pondRippleRecognitionTargetColor(caughtTier),
    [caughtTier],
  );

  const flourishPaths = useMemo(
    () => [
      paintedLoop(POND_PLATE_MAX_RADIUS - 4, 31, 2.1),
      paintedLoop(POND_PLATE_MAX_RADIUS - 10, 47, 1.7),
      paintedLoop(POND_PLATE_MAX_RADIUS - 17, 59, 1.35),
    ],
    [],
  );

  const flourishProps = useAnimatedProps(() => ({
    opacity: (1 - flourish.value) * 0.3,
    strokeWidth: 1 + flourish.value * 0.7,
  }));

  return (
    <Svg width={POND_PLATE_SIZE} height={POND_PLATE_SIZE}>
      {flourishPaths.map((path, index) => (
        <AnimatedPath
          key={`flourish-${index}`}
          d={path}
          fill="none"
          stroke={index === 1 ? "#93B5AE" : "#A8C5C0"}
          strokeLinecap="round"
          strokeLinejoin="round"
          animatedProps={flourishProps}
        />
      ))}

      {POND_RIPPLE_BAND_ORDER.map((band, bandIndex) => (
        <PaintedBand
          key={band}
          band={band}
          bandIndex={bandIndex}
          recognitionTarget={recognitionTarget}
          unlocked={isBandUnlocked(band, activeTier)}
          isResult={band === caughtTier}
          isAck={band === ackBand}
          settle={bandSettles[band]}
          recognitionWarmth={recognitionWarmth}
          calmBeat={calmBeat}
          ackPulse={ackPulse}
        />
      ))}

      <PaintedVignette
        tier={caughtTier}
        recognitionTarget={recognitionTarget}
        settle={bandSettles[caughtTier]}
        recognitionWarmth={recognitionWarmth}
      />
    </Svg>
  );
}

function bandWashOpacity(
  unlocked: boolean,
  isResult: boolean,
  settle: number,
  calmBeat: number,
): number {
  "worklet";
  const lit = unlocked ? 0.42 : 0.16;
  if (isResult) return settle * lit;
  const calm = unlocked ? 0.28 : 0.12;
  const blended = lit + calmBeat * (calm - lit);
  return settle * blended;
}

function PaintedBand({
  band,
  bandIndex,
  recognitionTarget,
  unlocked,
  isResult,
  isAck,
  settle,
  recognitionWarmth,
  calmBeat,
  ackPulse,
}: {
  band: PondRippleDisplayTier;
  bandIndex: number;
  recognitionTarget: string;
  unlocked: boolean;
  isResult: boolean;
  isAck: boolean;
  settle: SharedValue<number>;
  recognitionWarmth: SharedValue<number>;
  calmBeat: SharedValue<number>;
  ackPulse?: SharedValue<number>;
}) {
  const radius = POND_PLATE_RADII[band];
  const width = POND_RIPPLE_STROKE_WIDTHS[band];
  const color = unlocked ? PAINT[band] : LOCKED_PAINT[band];

  const paths = useMemo(
    () => ({
      wash: paintedLoop(radius, 101 + bandIndex * 29, 1.7),
      innerBleed: paintedLoop(radius - width * 0.24, 113 + bandIndex * 31, 1.25),
      outerBleed: paintedLoop(radius + width * 0.23, 127 + bandIndex * 37, 1.45),
      pigment: paintedLoop(radius + width * 0.04, 149 + bandIndex * 41, 1.1),
      paperEdge: paintedLoop(radius - width * 0.52 - 0.7, 163 + bandIndex * 43, 0.85),
    }),
    [bandIndex, radius, width],
  );

  const washProps = useAnimatedProps(() => {
    const ackLift = isAck ? (ackPulse?.value ?? 0) * 0.12 : 0;
    const strokeColor = isResult
      ? interpolateColor(recognitionWarmth.value, [0, 1], [color, recognitionTarget])
      : color;
    return {
      opacity: bandWashOpacity(unlocked, isResult, settle.value, calmBeat.value) + ackLift,
      stroke: strokeColor,
      strokeWidth: width * 0.72,
    };
  });

  const bleedProps = useAnimatedProps(() => {
    const ackLift = isAck ? (ackPulse?.value ?? 0) * 0.08 : 0;
    const strokeColor = isResult
      ? interpolateColor(recognitionWarmth.value, [0, 1], [color, recognitionTarget])
      : color;
    return {
      opacity:
        bandWashOpacity(unlocked, isResult, settle.value, calmBeat.value) *
          (unlocked ? 0.48 : 0.5) +
        ackLift,
      stroke: strokeColor,
      strokeWidth: Math.max(1.4, width * 0.28),
    };
  });

  const pigmentProps = useAnimatedProps(() => {
    const ackLift = isAck ? (ackPulse?.value ?? 0) * 0.1 : 0;
    const strokeColor = isResult
      ? interpolateColor(recognitionWarmth.value, [0, 1], [color, recognitionTarget])
      : color;
    return {
      opacity:
        bandWashOpacity(unlocked, isResult, settle.value, calmBeat.value) *
          (unlocked ? 0.67 : 0.625) +
        ackLift,
      stroke: strokeColor,
      strokeWidth: Math.max(1, width * 0.17),
    };
  });

  const lockProps = useAnimatedProps(() => ({
    opacity: unlocked ? 0 : settle.value * 0.2,
    strokeWidth: Math.max(1.2, width * 0.22),
  }));

  const paperProps = useAnimatedProps(() => ({
    opacity: settle.value * 0.52,
  }));

  return (
    <G>
      {!unlocked ? (
        <AnimatedPath
          d={paths.outerBleed}
          fill="none"
          stroke={LOCK_WASH}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="3 8 1 11"
          animatedProps={lockProps}
        />
      ) : null}
      <AnimatedPath
        d={paths.wash}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        animatedProps={washProps}
      />
      <AnimatedPath
        d={paths.innerBleed}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        animatedProps={bleedProps}
      />
      <AnimatedPath
        d={paths.outerBleed}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        animatedProps={bleedProps}
      />
      <AnimatedPath
        d={paths.pigment}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 7 4 10 2 8"
        animatedProps={pigmentProps}
      />
      <AnimatedPath
        d={paths.paperEdge}
        fill="none"
        stroke={PAPER_LIFT}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="8 3 13 2"
        strokeWidth={0.8}
        animatedProps={paperProps}
      />
    </G>
  );
}

function PaintedVignette({
  tier,
  recognitionTarget,
  settle,
  recognitionWarmth,
}: {
  tier: PondRippleDisplayTier;
  recognitionTarget: string;
  settle: SharedValue<number>;
  recognitionWarmth: SharedValue<number>;
}) {
  const isMiss = tier === "empty";
  const baseInk = isMiss ? "#557B74" : tier === "epic" || tier === "rare" ? "#A87424" : "#557B74";
  const baseWash = isMiss
    ? "#7FA79F"
    : tier === "epic"
      ? "#D6A13E"
      : tier === "rare"
        ? "#B79A52"
        : "#7FA79F";

  const vignetteProps = useAnimatedProps(() => ({
    opacity: settle.value * 0.5,
    stroke: interpolateColor(recognitionWarmth.value, [0, 1], [baseInk, recognitionTarget]),
    fill: interpolateColor(recognitionWarmth.value, [0, 1], [baseWash, recognitionTarget]),
  }));

  if (tier === "empty") {
    return (
      <G>
        <AnimatedPath
          d="M77 102 C81 99 86 99 91 101 C96 103 101 103 105 100"
          fill="none"
          stroke={baseWash}
          strokeWidth={1.5}
          strokeLinecap="round"
          animatedProps={vignetteProps}
        />
        <AnimatedPath
          d="M83 101 C82 95 82 88 84 81 M89 101 C89 93 91 86 94 80 M96 102 C96 95 98 90 101 86"
          fill="none"
          stroke={baseInk}
          strokeWidth={1.2}
          strokeLinecap="round"
          animatedProps={vignetteProps}
        />
        <AnimatedPath
          d="M80 102 C83 99 88 99 91 102 C89 105 83 105 80 102 Z"
          fill={baseWash}
          animatedProps={vignetteProps}
        />
      </G>
    );
  }

  return (
    <G>
      <AnimatedPath
        d="M76 90 C81 84 92 83 100 88 C104 90 106 92 109 94 C105 95 102 97 99 99 C91 103 81 100 76 94 C73 96 70 98 68 99 C70 94 70 91 68 86 C71 87 73 89 76 90 Z"
        fill={baseWash}
        animatedProps={vignetteProps}
      />
      <AnimatedPath
        d="M77 91 C85 87 94 87 101 91 M80 96 C87 99 96 97 101 94"
        fill="none"
        stroke={baseInk}
        strokeWidth={0.8}
        strokeLinecap="round"
        animatedProps={vignetteProps}
      />
      <AnimatedCircle cx={96.5} cy={90.2} r={0.9} fill="#4D463E" animatedProps={vignetteProps} />
    </G>
  );
}
