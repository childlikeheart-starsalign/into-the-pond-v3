/** Map trail marker fills — Quick vs Deep (shared QC+DC history). */

/** Deep Check — brand primary bark. */
export const MARKER_DEEP = "#7A5C45";

/** Quick Check — secondary sage. */
export const MARKER_QUICK = "#6F7D68";

export function markerFillForSource(source: "quick" | "deep" | null | undefined): string {
  return source === "quick" ? MARKER_QUICK : MARKER_DEEP;
}
