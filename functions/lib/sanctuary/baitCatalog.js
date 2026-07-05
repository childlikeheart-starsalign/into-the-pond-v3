"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BAIT_CRAFT_COSTS = void 0;
exports.createEmptyBaitInventory = createEmptyBaitInventory;
exports.canCraftBait = canCraftBait;
exports.craftBait = craftBait;
exports.consumeBait = consumeBait;
exports.BAIT_CRAFT_COSTS = {
  basic: { currentWonder: 3, materials: { feather: 1 } },
  rare: { currentWonder: 8, materials: { scale: 2 } },
  epic: { currentWonder: 15, materials: { glimmerdust: 3 } },
};
function createEmptyBaitInventory() {
  return {
    basic: 0,
    rare: 0,
    epic: 0,
    materials: { feather: 0, scale: 0, glimmerdust: 0 },
  };
}
function canCraftBait(tier, currentWonder, inventory) {
  const cost = exports.BAIT_CRAFT_COSTS[tier];
  if (currentWonder < cost.currentWonder) return false;
  for (const [material, needed] of Object.entries(cost.materials)) {
    const key = material;
    if ((inventory.materials[key] ?? 0) < (needed ?? 0)) return false;
  }
  return true;
}
function craftBait(userId, jobId, tier, inventory, now = Date.now()) {
  const cost = exports.BAIT_CRAFT_COSTS[tier];
  if (!canCraftBait(tier, Number.MAX_SAFE_INTEGER, inventory)) {
    // wonder checked separately at repository layer
  }
  const nextMaterials = { ...inventory.materials };
  for (const [material, needed] of Object.entries(cost.materials)) {
    const key = material;
    nextMaterials[key] = (nextMaterials[key] ?? 0) - (needed ?? 0);
  }
  const nextInventory = {
    ...inventory,
    materials: nextMaterials,
    [tier]: inventory[tier] + 1,
  };
  const job = {
    id: jobId,
    userId,
    tier,
    currentWonderCost: cost.currentWonder,
    materialsConsumed: cost.materials,
    startedAt: now,
    status: "completed",
  };
  return { inventory: nextInventory, job };
}
function consumeBait(inventory, tier) {
  if (inventory[tier] <= 0) return null;
  return { ...inventory, [tier]: inventory[tier] - 1 };
}
