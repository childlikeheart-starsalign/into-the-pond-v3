import { doc, getDoc } from "firebase/firestore";

import {
  evaluateFeatureFlag,
  parseFeatureFlagDoc,
} from "@/shared/featureFlags/evaluateFeatureFlag";
import type { FeatureFlagDoc } from "@/shared/featureFlags/types";
import { firestore } from "@/src/services/firebase/client";

type SessionState = {
  uid: string | null;
  /** flagName → evaluated enabled for session uid */
  enabled: Map<string, boolean>;
  epoch: number;
};

const state: SessionState = {
  uid: null,
  enabled: new Map(),
  epoch: 0,
};

const listeners = new Set<() => void>();

function emit() {
  state.epoch += 1;
  for (const listener of listeners) listener();
}

export function subscribeFeatureFlags(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getFeatureFlagsEpoch(): number {
  return state.epoch;
}

export function clearFeatureFlagsSession(): void {
  state.uid = null;
  state.enabled.clear();
  emit();
}

export function isFeatureEnabled(flagName: string, uid: string | null | undefined): boolean {
  if (!uid || uid !== state.uid) return false;
  return state.enabled.get(flagName) === true;
}

async function fetchFlagDoc(flagName: string): Promise<FeatureFlagDoc | null> {
  const snap = await getDoc(doc(firestore, "featureFlags", flagName));
  if (!snap.exists()) return null;
  return parseFeatureFlagDoc(snap.data());
}

/**
 * Session-cached flag hydrate. Call once at the same launch point as the user-doc read.
 * Not live-reactive mid-session — re-hydrate only on auth uid change / explicit clear.
 */
export async function hydrateSessionFeatureFlags(
  uid: string,
  flagNames: readonly string[],
): Promise<void> {
  const results = await Promise.all(
    flagNames.map(async (flagName) => {
      try {
        const flag = await fetchFlagDoc(flagName);
        return [flagName, evaluateFeatureFlag(flag, uid)] as const;
      } catch {
        return [flagName, false] as const;
      }
    }),
  );

  state.uid = uid;
  state.enabled = new Map(results);
  emit();
}
