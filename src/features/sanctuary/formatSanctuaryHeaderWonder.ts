const PREVIEW_MARKER = "*";

export function formatWonderLabel(totalWonder: number, previewOffset?: number): string {
  const base = String(totalWonder);
  if (__DEV__ && previewOffset != null && previewOffset > 0) {
    return `${base}${PREVIEW_MARKER}`;
  }
  return base;
}

export function formatWonderAccessibilityLabel(
  totalWonder: number,
  previewOffset?: number,
): string {
  if (previewOffset != null && previewOffset > 0) {
    return `Wonder: ${totalWonder}, includes ${previewOffset} preview-only balance not yet saved`;
  }
  return `Wonder: ${totalWonder}`;
}

export function splitWonderLabelForDisplay(wonderLabel: string): {
  text: string;
  showPreviewMarker: boolean;
} {
  if (__DEV__ && wonderLabel.endsWith(PREVIEW_MARKER)) {
    return { text: wonderLabel.slice(0, -1), showPreviewMarker: true };
  }
  return { text: wonderLabel, showPreviewMarker: false };
}
