import type { SanctuaryBloomKind } from "@/src/features/sanctuary/cultivationTypes";

type BloomSlot = {
  kind: SanctuaryBloomKind;
  x: number;
  y: number;
};

/** Artboard-relative placement for reflection blooms (576×1024 reference). */
export const BLOOM_SLOTS: BloomSlot[] = [
  { kind: "flower", x: 0.18, y: 0.68 },
  { kind: "flower", x: 0.82, y: 0.66 },
  { kind: "lantern", x: 0.72, y: 0.52 },
  { kind: "firefly", x: 0.28, y: 0.48 },
  { kind: "firefly", x: 0.62, y: 0.42 },
  { kind: "flower", x: 0.12, y: 0.58 },
  { kind: "lantern", x: 0.88, y: 0.54 },
  { kind: "firefly", x: 0.45, y: 0.38 },
];

export function slotForReflectionIndex(index: number): BloomSlot {
  return BLOOM_SLOTS[index % BLOOM_SLOTS.length] ?? BLOOM_SLOTS[0];
}

export function pondGlowOpacity(reflectionCount: number): number {
  return Math.min(0.55, 0.12 + reflectionCount * 0.08);
}
