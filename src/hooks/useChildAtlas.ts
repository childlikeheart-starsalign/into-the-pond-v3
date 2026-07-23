import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { DiscoveryCategory } from "@/shared/sanctuary/well/types";
import {
  loadDevChildAtlasEntries,
  mergeAtlasEntries,
  subscribeDevChildAtlasEntries,
} from "@/src/features/childAtlas/childAtlasDevStore";
import { firestore } from "@/src/services/firebase/client";
import { Sentry } from "@/src/services/sentry/init";
import type { ChildAtlasEntryDoc } from "@/src/services/firebase/types";

export type ChildAtlasEntry = ChildAtlasEntryDoc & { id: string };

const ALL_CATEGORIES: DiscoveryCategory[] = [
  "curiosity",
  "worries",
  "excitement",
  "interests",
  "emotional",
  "social",
  "identity",
  "imagination",
];

function emptyByCategory(): Record<DiscoveryCategory, ChildAtlasEntry[]> {
  return ALL_CATEGORIES.reduce(
    (acc, category) => {
      acc[category] = [];
      return acc;
    },
    {} as Record<DiscoveryCategory, ChildAtlasEntry[]>,
  );
}

/** Group atlas entries by discovery category (newest first per bucket). */
export function groupEntriesByCategory(
  entries: ChildAtlasEntry[],
): Record<DiscoveryCategory, ChildAtlasEntry[]> {
  const grouped = emptyByCategory();
  for (const entry of entries) {
    grouped[entry.category]?.push(entry);
  }
  return grouped;
}

export type UseChildAtlasResult = {
  entries: ChildAtlasEntry[];
  entriesByCategory: Record<DiscoveryCategory, ChildAtlasEntry[]>;
  loading: boolean;
  error: string | null;
  insightCount: number;
};

export function useChildAtlas(
  uid: string | null | undefined,
  childId?: string | null,
): UseChildAtlasResult {
  const [firestoreEntries, setFirestoreEntries] = useState<ChildAtlasEntry[]>([]);
  const [devEntries, setDevEntries] = useState<ChildAtlasEntry[]>([]);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState<string | null>(null);

  const refreshDevEntries = useCallback(async () => {
    if (!uid || !__DEV__) {
      setDevEntries([]);
      return;
    }
    const entries = await loadDevChildAtlasEntries(uid);
    setDevEntries(entries);
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      setFirestoreEntries([]);
      setDevEntries([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    void refreshDevEntries();

    const unsubDev =
      __DEV__ && uid
        ? subscribeDevChildAtlasEntries(uid, () => void refreshDevEntries())
        : () => {};

    // Dual-read (plan §8): prefer children/{childId}/childAtlas when childId present, else legacy root.
    const col = childId
      ? collection(firestore, "users", uid, "children", childId, "childAtlas")
      : collection(firestore, "users", uid, "childAtlas");
    // Firestore cap (P7-A); __DEV__ dev-store entries may add rows on top via mergeAtlasEntries.
    const q = query(col, orderBy("dateDiscovered", "desc"), limit(200));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as ChildAtlasEntryDoc),
        }));
        setFirestoreEntries(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn("[ChildAtlas] snapshot failed", err);
        Sentry.captureException(err, {
          tags: { area: "child_atlas", flow: "snapshot" },
        });
        if (__DEV__) {
          setFirestoreEntries([]);
          setLoading(false);
          setError(null);
          return;
        }
        setError("Could not load your atlas.");
        setLoading(false);
      },
    );

    return () => {
      unsub();
      unsubDev();
    };
  }, [refreshDevEntries, uid, childId]);

  const entries = useMemo(
    () => (__DEV__ ? mergeAtlasEntries(firestoreEntries, devEntries) : firestoreEntries),
    [devEntries, firestoreEntries],
  );

  const entriesByCategory = useMemo(() => groupEntriesByCategory(entries), [entries]);

  return {
    entries,
    entriesByCategory,
    loading,
    error,
    insightCount: entries.length,
  };
}

export function findEntryIndex(entries: ChildAtlasEntry[], entryId?: string | null): number {
  if (!entryId) return 0;
  const idx = entries.findIndex((e) => e.id === entryId);
  return idx >= 0 ? idx : 0;
}
