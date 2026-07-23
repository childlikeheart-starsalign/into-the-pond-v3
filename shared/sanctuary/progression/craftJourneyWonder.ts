/**
 * Journey economy Wonder projections (Phase 1 lock-in).
 * Runtime diary awards still use `DIARY_WONDER_BY_DEPTH` ranges; journey scenarios
 * use these fixed per-diary amounts until product overrides depth mapping.
 * @see docs/craft-journey-assumptions.md §3.3
 */
export const JOURNEY_DIARY_STORED_WONDER = 8;
export const JOURNEY_DIARY_CURRENT_WONDER = 2;

export function projectJourneyDiaryWonder(diaryCount: number): {
  storedWonder: number;
  currentWonder: number;
} {
  if (!Number.isFinite(diaryCount) || diaryCount < 0) {
    throw new Error("diaryCount must be a non-negative finite number");
  }
  return {
    storedWonder: diaryCount * JOURNEY_DIARY_STORED_WONDER,
    currentWonder: diaryCount * JOURNEY_DIARY_CURRENT_WONDER,
  };
}
