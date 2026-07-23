/**
 * Date formatters for JournalMargin — real timestamps only, never fabricated counts.
 */

/** Short locale date for cast-finish corner stamp (Surface 1). */
export function formatClaimMarginDate(claimedAtMs: number, locale?: string): string {
  const date = new Date(claimedAtMs);
  if (!Number.isFinite(claimedAtMs) || Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Observed …" stamp for Deep Check map corner (Surface 4). */
export function formatObservedMarginDate(iso: string, locale?: string): string {
  const date = new Date(iso);
  if (!iso.trim() || Number.isNaN(date.getTime())) {
    return "";
  }
  const formatted = date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `Observed ${formatted}`;
}
