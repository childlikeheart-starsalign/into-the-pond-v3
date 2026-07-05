import type { SanctuaryResonance, SanctuaryResonanceLevel } from "../types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ResonanceInput = {
  lastReflectionAt: number | null;
  now?: number;
};

/** Phase 4 — ambient pause without deducting Wonder. */
export function computeSanctuaryResonance(
  userId: string,
  input: ResonanceInput,
): SanctuaryResonance {
  const now = input.now ?? Date.now();
  const lastReflectionAt = input.lastReflectionAt;

  if (!lastReflectionAt) {
    return dormantResonance(userId, now, null);
  }

  const daysSince = Math.floor((now - lastReflectionAt) / MS_PER_DAY);
  let level: SanctuaryResonanceLevel = "vibrant";
  if (daysSince >= 7) level = "dormant";
  else if (daysSince >= 3) level = "quiet";

  return {
    userId,
    level,
    daysSinceLastReflection: daysSince,
    gardenPaused: level !== "vibrant",
    fishingSpotsQuiet: level === "dormant",
    rodResonanceWeak: level !== "vibrant",
    lastReflectionAt,
    updatedAt: now,
  };
}

function dormantResonance(
  userId: string,
  now: number,
  lastReflectionAt: number | null,
): SanctuaryResonance {
  return {
    userId,
    level: "dormant",
    daysSinceLastReflection: lastReflectionAt
      ? Math.floor((now - lastReflectionAt) / MS_PER_DAY)
      : 999,
    gardenPaused: true,
    fishingSpotsQuiet: true,
    rodResonanceWeak: true,
    lastReflectionAt,
    updatedAt: now,
  };
}
