import AsyncStorage from "@react-native-async-storage/async-storage";

import { DEFAULT_BAIT_ID, DEFAULT_ROD_ID } from "@/src/features/fishing/fishingData";

const STORAGE_KEY = "fishing:active-cast";

// Short dev timer. Replace with 2 * 60 * 60 * 1000 when ready for production.
export const FISHING_CAST_DURATION_MS = 2 * 60 * 1000;

export type ActiveFishingCast = {
  castStartTime: number;
  rodIdAtCast: string;
  baitIdAtCast: string;
};

export type FishingCastStatus =
  | {
      active: false;
      cast: null;
      elapsedMs: 0;
      remainingMs: 0;
      ready: false;
    }
  | {
      active: true;
      cast: ActiveFishingCast;
      elapsedMs: number;
      remainingMs: number;
      ready: boolean;
    };

function normalizeCast(value: unknown): ActiveFishingCast | null {
  if (!value || typeof value !== "object") return null;

  const cast = value as Partial<ActiveFishingCast>;
  const castStartTime =
    typeof cast.castStartTime === "number"
      ? cast.castStartTime
      : typeof cast.castStartTime === "string"
        ? Number.parseInt(cast.castStartTime, 10)
        : Number.NaN;

  if (!Number.isFinite(castStartTime) || castStartTime <= 0) {
    return null;
  }

  return {
    castStartTime,
    rodIdAtCast: typeof cast.rodIdAtCast === "string" ? cast.rodIdAtCast : DEFAULT_ROD_ID,
    baitIdAtCast: typeof cast.baitIdAtCast === "string" ? cast.baitIdAtCast : DEFAULT_BAIT_ID,
  };
}

export async function loadActiveFishingCast(): Promise<ActiveFishingCast | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return normalizeCast(JSON.parse(raw));
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function startFishingCast(
  input: Pick<ActiveFishingCast, "rodIdAtCast" | "baitIdAtCast">,
): Promise<ActiveFishingCast | null> {
  const existing = await loadActiveFishingCast();
  if (existing) return null;

  const cast: ActiveFishingCast = {
    castStartTime: Date.now(),
    rodIdAtCast: input.rodIdAtCast,
    baitIdAtCast: input.baitIdAtCast,
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cast));
  return cast;
}

export async function clearActiveFishingCast(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function getFishingCastStatus(
  cast: ActiveFishingCast | null,
  now = Date.now(),
): FishingCastStatus {
  if (!cast) {
    return {
      active: false,
      cast: null,
      elapsedMs: 0,
      remainingMs: 0,
      ready: false,
    };
  }

  const elapsedMs = Math.max(0, now - cast.castStartTime);
  const remainingMs = Math.max(0, FISHING_CAST_DURATION_MS - elapsedMs);

  return {
    active: true,
    cast,
    elapsedMs,
    remainingMs,
    ready: remainingMs === 0,
  };
}
