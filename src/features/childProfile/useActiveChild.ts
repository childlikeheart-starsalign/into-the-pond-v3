import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { resolveAccountTier } from "@/shared/childProfile/tierAccess";
import { useChildProfileFeatureFlags } from "@/src/features/childProfile/featureFlags";
import { resolveActiveChildIdAfterEntitlement } from "@/src/features/childProfile/resolveActiveChildId";
import { callSwitchActiveChild } from "@/src/features/childProfile/switchActiveChildClient";
import type { ChildrenSummaryEntry } from "@/src/features/childProfile/types";
import { firebaseAuth, firestore } from "@/src/services/firebase/client";
import type { UserDoc, UserSubscription } from "@/src/services/firebase/types";

export type ActiveChildState = {
  uid: string | null;
  ready: boolean;
  /** Resolved accessible child (downgrade-safe). */
  activeChildId: string | null;
  childrenSummary: ChildrenSummaryEntry[];
  subscription: UserSubscription | null;
  tier: ReturnType<typeof resolveAccountTier>;
  /**
   * childId to pass to Well/Atlas/narrative callables when Flag A is on.
   * Null when dual-read is off or no active child — callers use legacy paths.
   */
  childAwareId: string | null;
  setActiveChildId: (childId: string) => Promise<void>;
  /** True while a child-specific Well write should block switcher (caller-owned). */
};

/**
 * Single user-doc listener for active child + childrenSummary.
 * Applies plan §3 downgrade fallback and may write activeChildId when it drifts.
 * Switcher consumers must use childrenSummary only (no N child fetches).
 */
export function useActiveChild(): ActiveChildState {
  const [uid, setUid] = useState<string | null>(firebaseAuth.currentUser?.uid ?? null);
  const [ready, setReady] = useState(false);
  const [rawActiveChildId, setRawActiveChildId] = useState<string | null>(null);
  const [childrenSummary, setChildrenSummary] = useState<ChildrenSummaryEntry[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const writingFallbackRef = useRef(false);
  const { migrationDualRead } = useChildProfileFeatureFlags();

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (user) => {
      setUid(user?.uid ?? null);
      if (!user) {
        setReady(true);
        setRawActiveChildId(null);
        setChildrenSummary([]);
        setSubscription(null);
      } else {
        setReady(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!uid) return;

    const unsub = onSnapshot(
      doc(firestore, "users", uid),
      (snap) => {
        const data = (snap.data() ?? {}) as UserDoc;
        setRawActiveChildId(typeof data.activeChildId === "string" ? data.activeChildId : null);
        setChildrenSummary(
          Array.isArray(data.childrenSummary)
            ? (data.childrenSummary as ChildrenSummaryEntry[])
            : [],
        );
        setSubscription(data.subscription ?? null);
        setReady(true);
      },
      () => {
        setReady(true);
      },
    );
    return unsub;
  }, [uid]);

  const activeChildId = useMemo(
    () => resolveActiveChildIdAfterEntitlement(rawActiveChildId, childrenSummary, subscription),
    [rawActiveChildId, childrenSummary, subscription],
  );

  const tier = useMemo(() => resolveAccountTier(subscription), [subscription]);

  // Downgrade fallback write — never deletes child data.
  useEffect(() => {
    if (!uid || !ready || writingFallbackRef.current) return;
    if (!activeChildId || activeChildId === rawActiveChildId) return;
    writingFallbackRef.current = true;
    void updateDoc(doc(firestore, "users", uid), { activeChildId })
      .catch(() => {
        /* non-fatal; next load retries */
      })
      .finally(() => {
        writingFallbackRef.current = false;
      });
  }, [uid, ready, activeChildId, rawActiveChildId]);

  const setActiveChildId = useCallback(
    async (childId: string) => {
      if (!uid) return;
      const entry = childrenSummary.find((s) => s.childId === childId);
      if (!entry) return;
      // Only allow selecting accessible children; locked stay visible but not selectable.
      const resolved = resolveActiveChildIdAfterEntitlement(childId, childrenSummary, subscription);
      if (resolved !== childId) return;
      try {
        await callSwitchActiveChild({ childId });
      } catch {
        // Fallback if callable is unavailable (local / undeployed) — switch still works.
        await updateDoc(doc(firestore, "users", uid), { activeChildId: childId });
      }
    },
    [uid, childrenSummary, subscription],
  );

  const childAwareId = migrationDualRead && activeChildId ? activeChildId : null;

  return {
    uid,
    ready,
    activeChildId,
    childrenSummary,
    subscription,
    tier,
    childAwareId,
    setActiveChildId,
  };
}
