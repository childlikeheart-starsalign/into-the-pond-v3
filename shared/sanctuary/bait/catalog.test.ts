import assert from "node:assert/strict";
import test from "node:test";

import { BAIT_CRAFT_COSTS, canCraftBait, createEmptyBaitInventory } from "./catalog";

test("BAIT_CRAFT_COSTS tiers match expected wonder and materials", () => {
  assert.deepEqual(BAIT_CRAFT_COSTS.basic, {
    currentWonder: 3,
    materials: { feather: 1 },
  });
  assert.deepEqual(BAIT_CRAFT_COSTS.rare, {
    currentWonder: 8,
    materials: { scale: 2 },
  });
  assert.deepEqual(BAIT_CRAFT_COSTS.epic, {
    currentWonder: 15,
    materials: { glimmerdust: 3 },
  });
});

test("canCraftBait rejects insufficient wonder or materials", () => {
  const inventory = createEmptyBaitInventory();
  inventory.materials.feather = 1;
  assert.equal(canCraftBait("basic", 2, inventory), false);
  assert.equal(canCraftBait("basic", 3, inventory), true);
  assert.equal(canCraftBait("rare", 8, inventory), false);
});
