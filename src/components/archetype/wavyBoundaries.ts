/**
 * Fixed deterministic wavy midlines for the archetype garden map.
 * Control points are constant — remount must produce identical paths.
 */

/** Vertical wavy divider (axisA ≈ 50), in 0–100 map coords then scaled. */
export function verticalWavePath(
  plotLeft: number,
  plotTop: number,
  plotW: number,
  plotH: number,
): string {
  const midX = plotLeft + plotW * 0.5;
  const amp = plotW * 0.04;
  const y0 = plotTop;
  const y1 = plotTop + plotH;
  // Cubic segments with fixed offsets
  const c1x = midX + amp;
  const c2x = midX - amp;
  const c3x = midX + amp * 0.6;
  const midY = plotTop + plotH * 0.5;
  const q1 = plotTop + plotH * 0.25;
  const q3 = plotTop + plotH * 0.75;
  return [
    `M ${midX} ${y0}`,
    `C ${c1x} ${q1}, ${c2x} ${midY}, ${midX} ${midY}`,
    `C ${c3x} ${q3}, ${c2x} ${y1}, ${midX} ${y1}`,
  ].join(" ");
}

/** Horizontal wavy divider (axisB ≈ 50). */
export function horizontalWavePath(
  plotLeft: number,
  plotTop: number,
  plotW: number,
  plotH: number,
): string {
  const midY = plotTop + plotH * 0.5;
  const amp = plotH * 0.04;
  const x0 = plotLeft;
  const x1 = plotLeft + plotW;
  const c1y = midY - amp;
  const c2y = midY + amp;
  const midX = plotLeft + plotW * 0.5;
  const q1 = plotLeft + plotW * 0.25;
  const q3 = plotLeft + plotW * 0.75;
  return [
    `M ${x0} ${midY}`,
    `C ${q1} ${c1y}, ${midX} ${c2y}, ${midX} ${midY}`,
    `C ${q3} ${c1y}, ${x1} ${c2y}, ${x1} ${midY}`,
  ].join(" ");
}

/**
 * Approximate quadrant clip rects in plot space (straight midlines for fill regions).
 * Wave strokes sit on top for soft boundaries; fills use half-plot rects.
 */
export function quadrantRects(plotLeft: number, plotTop: number, plotW: number, plotH: number) {
  const midX = plotLeft + plotW / 2;
  const midY = plotTop + plotH / 2;
  return {
    /** Quiet Tester — top-left (low A, high B) */
    quietTester: { x: plotLeft, y: plotTop, w: plotW / 2, h: plotH / 2 },
    /** Spark — top-right (high A, high B) */
    spark: { x: midX, y: plotTop, w: plotW / 2, h: plotH / 2 },
    /** Wall — bottom-left (low A, low B) */
    wall: { x: plotLeft, y: midY, w: plotW / 2, h: plotH / 2 },
    /** Storm — bottom-right (high A, low B) */
    storm: { x: midX, y: midY, w: plotW / 2, h: plotH / 2 },
  };
}
