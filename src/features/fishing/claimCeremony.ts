/** Whether the CatalogRarityRing overlay should render during claim ceremony. */
export function shouldShowCatalogRarityRingOverlay(input: { claimRevealReady: boolean }): boolean {
  return !input.claimRevealReady;
}

/** Stable id for one claim resolution — retrySafe redelivery shares castId + claimedAt. */
export function claimPresentationId(input: {
  castId: string | null;
  claimedAt: number;
}): string | null {
  if (!input.castId) return null;
  return `${input.castId}:${input.claimedAt}`;
}

/** Skip ring only when this exact presentation already finished the ring phase. */
export function shouldPlayRingForPresentation(
  presentationId: string | null,
  lastRingCompletedPresentationId: string | null | undefined,
): boolean {
  if (!presentationId) return false;
  return presentationId !== lastRingCompletedPresentationId;
}
