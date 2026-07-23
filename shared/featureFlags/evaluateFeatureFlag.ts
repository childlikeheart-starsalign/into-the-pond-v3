import type { FeatureFlagDoc, FeatureFlagRolloutState } from "./types";

function isRolloutState(value: unknown): value is FeatureFlagRolloutState {
  return value === "off" || value === "allowlist" || value === "all";
}

/**
 * Pure evaluation for allowlist rollout.
 * `off` always wins — listed UIDs do not override a global off.
 */
export function evaluateFeatureFlag(
  flag: FeatureFlagDoc | null | undefined,
  uid: string | null | undefined,
): boolean {
  if (!uid || !flag) return false;
  if (!isRolloutState(flag.rolloutState)) return false;
  if (flag.rolloutState === "off") return false;
  if (flag.rolloutState === "all") return true;
  const list = flag.allowlistUids;
  if (!Array.isArray(list)) return false;
  return list.includes(uid);
}

/** Coerce a raw Firestore payload into a flag doc (invalid → treated as off/empty). */
export function parseFeatureFlagDoc(raw: unknown): FeatureFlagDoc | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (!isRolloutState(data.rolloutState)) return null;
  const allowlistUids = Array.isArray(data.allowlistUids)
    ? data.allowlistUids.filter((entry): entry is string => typeof entry === "string")
    : [];
  return {
    rolloutState: data.rolloutState,
    allowlistUids,
  };
}
