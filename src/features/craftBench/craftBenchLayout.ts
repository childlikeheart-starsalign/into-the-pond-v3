import type { ViewStyle } from "react-native";

import type { NormalizedBox, NormalizedCircle } from "@/src/features/fishing/fishingModalLayout";

/**
 * Normalized layout regions measured from
 * `assets/Craft bench/craft-bench_rare-rods.png` (1080×1920).
 * Fractions are relative to the 9:16 artboard (same convention as Fishing modal).
 */

export const CRAFT_BENCH_REF_SIZE = {
  width: 1080,
  height: 1920,
} as const;

export type CraftBenchMemoLayout = {
  panel: NormalizedBox;
  title: NormalizedBox;
  status: NormalizedBox;
  wonderColumn: NormalizedBox;
  partsColumn: NormalizedBox;
  footer: NormalizedBox;
};

export const CRAFT_BENCH_RARE_LAYOUT: {
  backButton: NormalizedBox;
  helpButton: NormalizedBox;
  memo: CraftBenchMemoLayout;
  craftButton: NormalizedCircle;
  carousel: NormalizedBox;
  carouselArrowLeft: NormalizedBox;
  carouselArrowRight: NormalizedBox;
  carouselSlots: readonly NormalizedBox[];
} = {
  backButton: { left: 0.038, top: 0.048, width: 0.095, height: 0.052 },
  helpButton: { left: 0.867, top: 0.048, width: 0.095, height: 0.052 },
  memo: {
    panel: { left: 0.24, top: 0.118, width: 0.52, height: 0.205 },
    title: { left: 0.2, top: 0.06, width: 0.88, height: 0.2 },
    status: { left: 0.08, top: 0.4, width: 0.88, height: 0.18 },
    wonderColumn: { left: 0.22, top: 0.86, width: 0.4, height: 0.34 },
    partsColumn: { left: 0.74, top: 0.86, width: 0.4, height: 0.34 },
    footer: { left: 0.08, top: `1.59`, width: 0.88, height: 0.22 },
  },
  craftButton: { centerX: 0.5, centerY: 0.558, diameter: 0.205 },
  carousel: { left: 0.028, top: 0.808, width: 0.944, height: 0.155 },
  carouselArrowLeft: { left: 0.038, top: 0.832, width: 0.065, height: 0.105 },
  carouselArrowRight: { left: 0.897, top: 0.832, width: 0.065, height: 0.105 },
  carouselSlots: [
    { left: 0.105, top: 0.812, width: 0.175, height: 0.148 },
    { left: 0.305, top: 0.812, width: 0.175, height: 0.148 },
    { left: 0.505, top: 0.812, width: 0.175, height: 0.148 },
    { left: 0.705, top: 0.812, width: 0.175, height: 0.148 },
  ],
};

/** Child regions inside the memo panel (fractions of memo width/height). */
export function memoChildStyle(child: NormalizedBox): ViewStyle {
  return {
    position: "absolute",
    left: `${child.left * 100}%`,
    top: `${child.top * 100}%`,
    width: `${child.width * 100}%`,
    height: `${child.height * 100}%`,
  };
}
