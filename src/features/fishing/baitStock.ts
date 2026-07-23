export type BaitStock = {
  scaleBait: number;
  glimmerdustBait: number;
};

/** UI bait id → consumable inventory count (basic is free / infinite). */
export function stockForUiBaitId(baitId: string, stock: BaitStock): number | null {
  if (baitId === "bait_mid") return stock.scaleBait;
  if (baitId === "bait_premium") return stock.glimmerdustBait;
  return null;
}
