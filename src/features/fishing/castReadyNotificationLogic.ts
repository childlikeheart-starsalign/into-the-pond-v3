/** Pure helpers for cast-ready local notification registry (no RN imports). */

export const CAST_READY_NOTIF_STORAGE_PREFIX = "fishing:cast-ready-notif:";

/** Which registered castIds should be cancelled given server active cast. */
export function orphanedCastReadyCastIds(
  registeredCastIds: readonly string[],
  activeCastId: string | null,
): string[] {
  if (activeCastId == null) {
    return [...registeredCastIds];
  }
  return registeredCastIds.filter((id) => id !== activeCastId);
}

export function castIdsFromNotifStorageKeys(keys: readonly string[]): string[] {
  return keys
    .filter((key) => key.startsWith(CAST_READY_NOTIF_STORAGE_PREFIX))
    .map((key) => key.slice(CAST_READY_NOTIF_STORAGE_PREFIX.length))
    .filter((castId) => castId.length > 0);
}
