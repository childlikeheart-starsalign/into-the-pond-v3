import type { BaitCraftJob, BaitInventory, BaitMaterial, BaitTier } from "../types";

export const BAIT_CRAFT_COSTS: Record<
  BaitTier,
  { currentWonder: number; materials: Partial<Record<BaitMaterial, number>> }
> = {
  basic: { currentWonder: 3, materials: { feather: 1 } },
  rare: { currentWonder: 8, materials: { scale: 2 } },
  epic: { currentWonder: 15, materials: { glimmerdust: 3 } },
};

export function createEmptyBaitInventory(): BaitInventory {
  return {
    basic: 0,
    rare: 0,
    epic: 0,
    materials: { feather: 0, scale: 0, glimmerdust: 0 },
  };
}

export function canCraftBait(
  tier: BaitTier,
  currentWonder: number,
  inventory: BaitInventory,
): boolean {
  const cost = BAIT_CRAFT_COSTS[tier];
  if (currentWonder < cost.currentWonder) return false;
  for (const [material, needed] of Object.entries(cost.materials)) {
    const key = material as BaitMaterial;
    if ((inventory.materials[key] ?? 0) < (needed ?? 0)) return false;
  }
  return true;
}

export function craftBait(
  userId: string,
  jobId: string,
  tier: BaitTier,
  inventory: BaitInventory,
  now = Date.now(),
): { inventory: BaitInventory; job: BaitCraftJob } | null {
  const cost = BAIT_CRAFT_COSTS[tier];
  if (!canCraftBait(tier, Number.MAX_SAFE_INTEGER, inventory)) {
    // wonder checked separately at repository layer
  }

  const nextMaterials = { ...inventory.materials };
  for (const [material, needed] of Object.entries(cost.materials)) {
    const key = material as BaitMaterial;
    nextMaterials[key] = (nextMaterials[key] ?? 0) - (needed ?? 0);
  }

  const nextInventory: BaitInventory = {
    ...inventory,
    materials: nextMaterials,
    [tier]: inventory[tier] + 1,
  };

  const job: BaitCraftJob = {
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

export function consumeBait(inventory: BaitInventory, tier: BaitTier): BaitInventory | null {
  if (inventory[tier] <= 0) return null;
  return { ...inventory, [tier]: inventory[tier] - 1 };
}
