import AsyncStorage from "@react-native-async-storage/async-storage";

import type { FishingRodId } from "@/shared/sanctuary/types";
import type { PlayerRodRecord } from "@/shared/sanctuary/progression";
import type { RodProgressionSnapshot } from "@/src/state/rodProgressionStore";

const STORAGE_PREFIX = "rod_progression_snapshot_v1";

type PersistedRodProgression = {
  version: 1;
  savedAt: number;
  playerRods: Partial<Record<FishingRodId, PlayerRodRecord>>;
  parts: number;
  storedWonder: number;
  equippedRodId?: FishingRodId;
};

function storageKey(uid: string): string {
  return `${STORAGE_PREFIX}:${uid}`;
}

export async function loadPersistedRodProgression(
  uid: string,
): Promise<RodProgressionSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedRodProgression;
    if (parsed.version !== 1) return null;
    return {
      playerRods: parsed.playerRods ?? {},
      parts: parsed.parts ?? 0,
      storedWonder: parsed.storedWonder ?? 0,
      equippedRodId: parsed.equippedRodId,
    };
  } catch {
    return null;
  }
}

export async function persistRodProgression(
  uid: string,
  snapshot: RodProgressionSnapshot,
): Promise<void> {
  try {
    const payload: PersistedRodProgression = {
      version: 1,
      savedAt: Date.now(),
      playerRods: snapshot.playerRods,
      parts: snapshot.parts,
      storedWonder: snapshot.storedWonder,
      equippedRodId: snapshot.equippedRodId,
    };
    await AsyncStorage.setItem(storageKey(uid), JSON.stringify(payload));
  } catch {
    // Persistence is optional — in-memory + Firestore remain authoritative.
  }
}

export async function clearPersistedRodProgression(uid: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(storageKey(uid));
  } catch {
    // ignore
  }
}
