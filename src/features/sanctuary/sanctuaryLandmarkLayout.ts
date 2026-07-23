import type { NormalizedBox } from "@/src/features/fishing/fishingModalLayout";

/**
 * Invisible tap targets on the sanctuary afternoon artboard (9:16).
 * Measured from the cottage-hill landmarks on the reference mockup.
 */
export const SANCTUARY_REF_SIZE = {
  width: 900,
  height: 1600,
} as const;

export const SANCTUARY_LANDMARK_LAYOUT: {
  pond: NormalizedBox;
  well: NormalizedBox;
  /** Wooden craft bench on the grassy slope, right of the stone well. */
  craftBench: NormalizedBox;
  craftBenchGlow: NormalizedBox;
} = {
  pond: { left: 0.28, top: 0.78, width: 0.44, height: 0.12 },
  // Height halved vs original 0.14; top re-centered on the stone well.
  well: { left: 0.5, top: 0.495, width: 0.14, height: 0.07 },
  craftBench: { left: 0.61, top: 0.49, width: 0.16, height: 0.09 },
  craftBenchGlow: { left: 0.58, top: 0.47, width: 0.22, height: 0.13 },
};

/** Device-px nudge for craft bench hit/glow after normalized layout. */
export const CRAFT_BENCH_HIT_OFFSET_PX = { left: 25, top: 0 } as const;

/** Device-px nudge for well hit after normalized layout. */
export const WELL_HIT_OFFSET_PX = { left: 4, top: 6 } as const;
