/**
 * Overlapping-circle garden map geometry — matches xy_garden_map_updated_palette.html.
 * Circle centers and radius are fixed ratios of the 260×260 plot (inset 10 in a 280 canvas).
 */

export const GARDEN_MAP_BG = "#EDE4C8";
/** Named archetypes (Storm / Wall / Spark) — circle map baseline. */
export const REGION_FILL_OPACITY = 0.32;
export const NAMED_REGION_FILL_OPACITY = REGION_FILL_OPACITY;
export const MAP_BORDER_OPACITY = 0.3;

/** Quiet Tester — Mist Heather; peer wash strength with named regions. */
export const QUIET_TESTER_FILL = "#8E7C93";
export const QUIET_TESTER_FILL_OPACITY = NAMED_REGION_FILL_OPACITY;

const NAMED_LABEL_OPACITY = 1;
export const QUIET_TESTER_LABEL_OPACITY = NAMED_LABEL_OPACITY;

/** Plot-space offsets for circle centers (260×260 reference plot). */
const CIRCLE_CENTERS = {
  quietTester: { x: 60, y: 60 },
  spark: { x: 200, y: 60 },
  wall: { x: 60, y: 200 },
  storm: { x: 200, y: 200 },
} as const;

const CIRCLE_RADIUS = 110;
const CORNER_RADIUS = 40;

export type CircleRegion = {
  key: keyof typeof CIRCLE_CENTERS;
  cx: number;
  cy: number;
  r: number;
  fill: string;
};

export type RegionLabel = {
  x: number;
  y: number;
  text: string;
  fontSize: number;
  opacity: number;
};

export function mapCornerRadius(plotW: number): number {
  return (CORNER_RADIUS / 260) * plotW;
}

export function gardenCircleRegions(
  plotLeft: number,
  plotTop: number,
  plotW: number,
  plotH: number,
  fills: { wall: string; storm: string; spark: string; quietTester: string },
): CircleRegion[] {
  const r = (CIRCLE_RADIUS / 260) * plotW;
  const toPlot = (offsetX: number, offsetY: number) => ({
    cx: plotLeft + (offsetX / 260) * plotW,
    cy: plotTop + (offsetY / 260) * plotH,
  });

  return [
    { key: "wall", ...toPlot(CIRCLE_CENTERS.wall.x, CIRCLE_CENTERS.wall.y), r, fill: fills.wall },
    {
      key: "storm",
      ...toPlot(CIRCLE_CENTERS.storm.x, CIRCLE_CENTERS.storm.y),
      r,
      fill: fills.storm,
    },
    {
      key: "spark",
      ...toPlot(CIRCLE_CENTERS.spark.x, CIRCLE_CENTERS.spark.y),
      r,
      fill: fills.spark,
    },
    {
      key: "quietTester",
      ...toPlot(CIRCLE_CENTERS.quietTester.x, CIRCLE_CENTERS.quietTester.y),
      r,
      fill: fills.quietTester,
    },
  ];
}

/** Corner label positions from reference SVG (lowercase, bark umber). */
export function regionLabels(
  plotLeft: number,
  plotTop: number,
  plotW: number,
  plotH: number,
): RegionLabel[] {
  const lx = (x: number) => plotLeft + (x / 260) * plotW;
  const ly = (y: number) => plotTop + (y / 260) * plotH;

  return [
    { x: lx(42), y: ly(240), text: "wall", fontSize: 11, opacity: NAMED_LABEL_OPACITY },
    { x: lx(200), y: ly(240), text: "storm", fontSize: 11, opacity: NAMED_LABEL_OPACITY },
    { x: lx(200), y: ly(42), text: "spark", fontSize: 11, opacity: NAMED_LABEL_OPACITY },
    {
      x: lx(20),
      y: ly(42),
      text: "quiet tester",
      fontSize: 10,
      opacity: QUIET_TESTER_LABEL_OPACITY,
    },
  ];
}

/** Smooth quadratic trail through marker points (oldest → current). */
export function trailCurvePath(points: readonly { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cpx = (prev.x + curr.x) / 2;
    const cpy = (prev.y + curr.y) / 2;
    d += ` Q ${cpx} ${cpy} ${curr.x} ${curr.y}`;
  }
  return d;
}
