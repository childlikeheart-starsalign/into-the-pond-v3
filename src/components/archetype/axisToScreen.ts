/**
 * Sole Y inversion for archetype map plotting.
 * axisB increases upward (testing = top) → smaller screen Y.
 */
export function axisToScreenY(
  axisB: number,
  insetTop: number,
  plotHeight: number,
): number {
  return insetTop + plotHeight - (axisB / 100) * plotHeight;
}

export function axisToScreenX(
  axisA: number,
  insetLeft: number,
  plotWidth: number,
): number {
  return insetLeft + (axisA / 100) * plotWidth;
}
