export type SanctuaryBloomKind = "flower" | "lantern" | "firefly" | "pondGlow";

export type SanctuaryBloom = {
  id: string;
  lessonId: string;
  ritualId: string;
  kind: SanctuaryBloomKind;
  /** Normalized x on the 9:16 artboard (0–1). */
  x: number;
  /** Normalized y on the 9:16 artboard (0–1). */
  y: number;
  createdAt: string;
  /** False until the user has seen the bloom appear in sanctuary. */
  seenArrival: boolean;
};

export type SanctuaryCultivation = {
  blooms: SanctuaryBloom[];
  reflectionCount: number;
};

export const EMPTY_CULTIVATION: SanctuaryCultivation = {
  blooms: [],
  reflectionCount: 0,
};

export function normalizeCultivation(value: unknown): SanctuaryCultivation {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_CULTIVATION, blooms: [] };
  }

  const candidate = value as Partial<SanctuaryCultivation>;
  const blooms = Array.isArray(candidate.blooms) ? candidate.blooms : [];

  return {
    reflectionCount:
      typeof candidate.reflectionCount === "number" ? candidate.reflectionCount : blooms.length,
    blooms,
  };
}
