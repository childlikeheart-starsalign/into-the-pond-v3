/** Container-layer wonder display — header paints the string only. */
export function formatSanctuaryWonderLabel(value: number): string {
  return String(value);
}

export function buildSanctuaryWonderAccessibilityLabel(
  label: string,
  previewOffset?: number,
): string {
  if (previewOffset != null && previewOffset > 0) {
    return `Wonder: ${label}, includes ${previewOffset} preview-only balance not yet saved`;
  }
  return `Wonder: ${label}`;
}
