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
  well: { left: 0.5, top: 0.46, width: 0.14, height: 0.14 },
  craftBench: { left: 0.61, top: 0.49, width: 0.16, height: 0.09 },
  craftBenchGlow: { left: 0.58, top: 0.47, width: 0.22, height: 0.13 },
};
