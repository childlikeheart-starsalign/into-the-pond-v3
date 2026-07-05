import type { EconomyLedgerEntry } from "./types";

export const CONSUMABLE_BAIT_KEYS = [
  "feather_bait",
  "scale_bait",
  "glimmerdust_bait",
  "random_bait",
] as const;

export type ConsumableBaitKey = (typeof CONSUMABLE_BAIT_KEYS)[number];

const TIER_TO_BAIT_KEY: Record<string, ConsumableBaitKey> = {
  basic: "feather_bait",
  rare: "scale_bait",
  epic: "glimmerdust_bait",
};

export function emptyBaitInventory(): Record<ConsumableBaitKey, number> {
  return {
    feather_bait: 0,
    scale_bait: 0,
    glimmerdust_bait: 0,
    random_bait: 0,
  };
}

export function baitKeyFromCraftMetadata(
  metadata: Record<string, unknown>,
): ConsumableBaitKey | null {
  if (typeof metadata.baitKey === "string" && isConsumableBaitKey(metadata.baitKey)) {
    return metadata.baitKey;
  }
  if (typeof metadata.tier === "string") {
    return TIER_TO_BAIT_KEY[metadata.tier] ?? null;
  }
  return null;
}

function isConsumableBaitKey(value: string): value is ConsumableBaitKey {
  return (CONSUMABLE_BAIT_KEYS as readonly string[]).includes(value);
}

/** Replay bait stacks from ledger audit rows (bait_craft + cast_create). */
export function foldBaitInventoryFromLedger(
  entries: EconomyLedgerEntry[],
): Record<ConsumableBaitKey, number> {
  const baits = emptyBaitInventory();

  for (const entry of entries) {
    const metadata = (entry.metadata ?? {}) as Record<string, unknown>;

    if (entry.actionType === "bait_craft") {
      const baitKey = baitKeyFromCraftMetadata(metadata);
      if (baitKey) baits[baitKey] += 1;
      continue;
    }

    if (entry.actionType === "cast_create" && metadata.baitDeducted === true) {
      const baitUsed = typeof metadata.baitUsed === "string" ? metadata.baitUsed.trim() : "";
      if (baitUsed && baitUsed !== "random_bait" && isConsumableBaitKey(baitUsed)) {
        baits[baitUsed] -= 1;
      }
    }
  }

  return baits;
}
