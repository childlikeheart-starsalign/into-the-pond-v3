import AsyncStorage from "@react-native-async-storage/async-storage";
import { Timestamp } from "firebase/firestore";

import type { ChildAtlasEntry } from "@/src/hooks/useChildAtlas";
import type { ChildAtlasEntryDoc } from "@/src/services/firebase/types";

const storageKey = (uid: string) => `child-atlas:dev:${uid}`;

type StoredAtlasEntry = Omit<ChildAtlasEntryDoc, "dateDiscovered"> & {
  id: string;
  dateDiscoveredMs: number;
};

const listeners = new Map<string, Set<() => void>>();

function notify(uid: string) {
  listeners.get(uid)?.forEach((listener) => listener());
}

function toEntry(stored: StoredAtlasEntry): ChildAtlasEntry {
  return {
    id: stored.id,
    questionId: stored.questionId,
    category: stored.category,
    reflectionText: stored.reflectionText,
    headline: stored.headline,
    prompt: stored.prompt,
    themeLabel: stored.themeLabel,
    dateDiscovered: Timestamp.fromMillis(stored.dateDiscoveredMs),
  };
}

async function readStored(uid: string): Promise<StoredAtlasEntry[]> {
  const raw = await AsyncStorage.getItem(storageKey(uid));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredAtlasEntry[];
  } catch {
    return [];
  }
}

export async function loadDevChildAtlasEntries(uid: string): Promise<ChildAtlasEntry[]> {
  const stored = await readStored(uid);
  return stored
    .map(toEntry)
    .sort((a, b) => b.dateDiscovered.toMillis() - a.dateDiscovered.toMillis());
}

export async function appendDevChildAtlasEntry(
  uid: string,
  entry: Omit<ChildAtlasEntry, "dateDiscovered"> & { dateDiscovered?: Timestamp },
): Promise<string> {
  const id = entry.id;
  const stored = await readStored(uid);
  const next: StoredAtlasEntry = {
    id,
    questionId: entry.questionId,
    category: entry.category,
    reflectionText: entry.reflectionText,
    headline: entry.headline,
    prompt: entry.prompt,
    themeLabel: entry.themeLabel,
    dateDiscoveredMs: (entry.dateDiscovered ?? Timestamp.now()).toMillis(),
  };
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify([next, ...stored]));
  notify(uid);
  return id;
}

export function subscribeDevChildAtlasEntries(uid: string, onChange: () => void): () => void {
  const set = listeners.get(uid) ?? new Set();
  set.add(onChange);
  listeners.set(uid, set);
  return () => {
    set.delete(onChange);
    if (set.size === 0) listeners.delete(uid);
  };
}

export function mergeAtlasEntries(
  firestore: ChildAtlasEntry[],
  dev: ChildAtlasEntry[],
): ChildAtlasEntry[] {
  const byId = new Map<string, ChildAtlasEntry>();
  for (const entry of [...firestore, ...dev]) {
    byId.set(entry.id, entry);
  }
  return [...byId.values()].sort(
    (a, b) => b.dateDiscovered.toMillis() - a.dateDiscovered.toMillis(),
  );
}
