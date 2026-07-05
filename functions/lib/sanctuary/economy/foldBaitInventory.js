"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSUMABLE_BAIT_KEYS = void 0;
exports.emptyBaitInventory = emptyBaitInventory;
exports.baitKeyFromCraftMetadata = baitKeyFromCraftMetadata;
exports.foldBaitInventoryFromLedger = foldBaitInventoryFromLedger;
exports.CONSUMABLE_BAIT_KEYS = ["feather_bait", "scale_bait", "glimmerdust_bait", "random_bait"];
const TIER_TO_BAIT_KEY = {
  basic: "feather_bait",
  rare: "scale_bait",
  epic: "glimmerdust_bait",
};
function emptyBaitInventory() {
  return {
    feather_bait: 0,
    scale_bait: 0,
    glimmerdust_bait: 0,
    random_bait: 0,
  };
}
function baitKeyFromCraftMetadata(metadata) {
  if (typeof metadata.baitKey === "string" && isConsumableBaitKey(metadata.baitKey)) {
    return metadata.baitKey;
  }
  if (typeof metadata.tier === "string") {
    return TIER_TO_BAIT_KEY[metadata.tier] ?? null;
  }
  return null;
}
function isConsumableBaitKey(value) {
  return exports.CONSUMABLE_BAIT_KEYS.includes(value);
}
/** Replay bait stacks from ledger audit rows (bait_craft + cast_create). */
function foldBaitInventoryFromLedger(entries) {
  const baits = emptyBaitInventory();
  for (const entry of entries) {
    const metadata = entry.metadata ?? {};
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
