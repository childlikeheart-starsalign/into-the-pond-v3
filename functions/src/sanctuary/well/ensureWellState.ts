import { DEFAULT_USER_WELL_STATE } from "./types";
import { parseOptionalChildId, recordWellAnalytics, requireUid, wellStateRef } from "./wellHelpers";

export async function handleEnsureWellState(uid: string, childId?: string | null) {
  const ref = wellStateRef(uid, childId);
  const snap = await ref.get();
  if (snap.exists) {
    return { success: true as const, alreadyExisted: true };
  }

  await ref.set(DEFAULT_USER_WELL_STATE);
  await recordWellAnalytics(uid, { type: "well_state_initialized" });

  return { success: true as const, alreadyExisted: false };
}

export function ensureWellStateCallable(authUid: string | undefined, data?: { childId?: unknown }) {
  const uid = requireUid(authUid);
  return handleEnsureWellState(uid, parseOptionalChildId(data?.childId));
}
