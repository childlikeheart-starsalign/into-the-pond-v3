/**
 * Caption copy + thresholds for ArchetypeResultMap.
 * Strings are frozen exports — unit tests assert exact equality.
 * Do not edit threshold values in place; bump to CAPTION_THRESHOLDS_V2 if tuned.
 */

export const CAPTION_THRESHOLDS_V1 = {
  version: 1,
  centerBlendRadius: 18, // DRAFT — pending product sign-off
  tieBreakRatio: 1.25, // DRAFT — pending product sign-off
} as const;

export const CENTER_BLEND_CAPTION = "You're seeing a mix of a few patterns right now." as const;

// DO NOT increase certainty language here without explicit product
// sign-off — "we're still confirming" / "provisional" framing is
// intentional, not a placeholder to be tightened later.
export const QUIET_TESTER_CAPTION =
  "Right now this looks like a pattern we don't have a full picture of yet — we're calling it Quiet Tester for now." as const;

export function tieBreakBlendCaption(
  nearest: ArchetypeCornerName,
  second: ArchetypeCornerName,
): string {
  return `You're seeing a bit of ${nearest} and a bit of ${second} right now — that's normal.`;
}

export function leaningTowardCaption(nearest: ArchetypeCornerName): string {
  return `Leaning toward ${nearest} right now.`;
}

export function trendAppendCaption(current: ArchetypeCornerName): string {
  return `Compared to last time, this leans a bit more toward ${current}.`;
}

export type ArchetypeCornerName = "Storm" | "Wall" | "Spark" | "Quiet Tester";

export type MapTrailPoint = {
  axisA: number;
  axisB: number;
  completedAt: string;
  /** Quick vs Deep; missing → treat as deep (legacy). */
  source?: "quick" | "deep";
};

type Corner = {
  name: ArchetypeCornerName;
  axisA: number;
  axisB: number;
};

const CORNERS: readonly Corner[] = [
  { name: "Storm", axisA: 100, axisB: 0 },
  { name: "Wall", axisA: 0, axisB: 0 },
  { name: "Spark", axisA: 100, axisB: 100 },
  { name: "Quiet Tester", axisA: 0, axisB: 100 },
] as const;

function dist(a: number, b: number, x: number, y: number): number {
  const dx = a - x;
  const dy = b - y;
  return Math.hypot(dx, dy);
}

function nearestCorners(
  axisA: number,
  axisB: number,
): { nearest: Corner; nearestDist: number; second: Corner; secondDist: number } {
  const ranked = CORNERS.map((c) => ({
    corner: c,
    d: dist(axisA, axisB, c.axisA, c.axisB),
  })).sort((x, y) => x.d - y.d);
  return {
    nearest: ranked[0]!.corner,
    nearestDist: ranked[0]!.d,
    second: ranked[1]!.corner,
    secondDist: ranked[1]!.d,
  };
}

type CaptionKind = "center" | "quietTester" | "blend" | "lean";

function classifyPoint(
  axisA: number,
  axisB: number,
): { kind: CaptionKind; nearest: ArchetypeCornerName; second: ArchetypeCornerName } {
  const d = dist(axisA, axisB, 50, 50);
  const { nearest, nearestDist, second, secondDist } = nearestCorners(axisA, axisB);
  if (d <= CAPTION_THRESHOLDS_V1.centerBlendRadius) {
    return { kind: "center", nearest: nearest.name, second: second.name };
  }
  if (nearest.name === "Quiet Tester") {
    return { kind: "quietTester", nearest: nearest.name, second: second.name };
  }
  if (secondDist <= nearestDist * CAPTION_THRESHOLDS_V1.tieBreakRatio) {
    return { kind: "blend", nearest: nearest.name, second: second.name };
  }
  return { kind: "lean", nearest: nearest.name, second: second.name };
}

function captionForClassification(c: {
  kind: CaptionKind;
  nearest: ArchetypeCornerName;
  second: ArchetypeCornerName;
}): string {
  switch (c.kind) {
    case "center":
      return CENTER_BLEND_CAPTION;
    case "quietTester":
      return QUIET_TESTER_CAPTION;
    case "blend":
      return tieBreakBlendCaption(c.nearest, c.second);
    case "lean":
      return leaningTowardCaption(c.nearest);
  }
}

/**
 * Build the visible + a11y caption for a map point.
 * Trail: current is (axisA, axisB); prior points are oldest-first in `trail`.
 * Cap consumers to current + 2 prior externally; trend uses oldest prior vs current.
 */
export function buildMapCaption(axisA: number, axisB: number, trail?: MapTrailPoint[]): string {
  const current = classifyPoint(axisA, axisB);
  let caption = captionForClassification(current);

  const priors = trail ?? [];
  if (priors.length >= 1) {
    const oldest = priors[0]!;
    const prior = classifyPoint(oldest.axisA, oldest.axisB);
    const currentIsBlendOrCenter = current.kind === "center" || current.kind === "blend";
    const priorIsBlendOrCenter = prior.kind === "center" || prior.kind === "blend";
    if (!currentIsBlendOrCenter && !priorIsBlendOrCenter && prior.nearest !== current.nearest) {
      caption = `${caption} ${trendAppendCaption(current.nearest)}`;
    }
  }

  return caption;
}
