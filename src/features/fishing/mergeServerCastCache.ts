/** Client cache fields that Firestore activeCast does not own. */
export type CastCacheClientFields = {
  castId: string;
  castingLabel?: string;
};

/** Preserve client-only castingLabel when reconciling the same castId from Firestore. */
export function mergeServerCastWithLocalCache<T extends { castId: string }>(
  localCast: (T & CastCacheClientFields) | null,
  serverCast: T,
): T & { castingLabel?: string } {
  const castingLabel = localCast?.castId === serverCast.castId ? localCast.castingLabel : undefined;
  return {
    ...serverCast,
    ...(castingLabel ? { castingLabel } : {}),
  };
}
