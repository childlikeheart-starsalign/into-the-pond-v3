import assert from "node:assert/strict";
import test from "node:test";

import type { CreatureRef } from "../fishing/encounterEngine";
import { filterCreaturesByRodPermission } from "./rodFishingAccess";

const wildcardCreature: CreatureRef = {
  creatureTypeId: "prism-drifter",
  displayName: "Prism Drifter",
  poolTier: "rare",
  elementType: "any",
  rodRequired: "rare5",
  peakWonderGate: 65,
  sub_tier: "common-rare",
};

const commonFire: CreatureRef = {
  creatureTypeId: "puddle-dart",
  displayName: "Puddle Dart",
  poolTier: "common",
  elementType: "fire",
  rodRequired: "basic",
  peakWonderGate: 0,
  sub_tier: "uniform",
};

const commonWater: CreatureRef = {
  creatureTypeId: "bubble-mote",
  displayName: "Bubble Mote",
  poolTier: "common",
  elementType: "water",
  rodRequired: "basic",
  peakWonderGate: 0,
  sub_tier: "uniform",
};

const rareFire: CreatureRef = {
  creatureTypeId: "ember-koi",
  displayName: "Ember Koi",
  poolTier: "rare",
  elementType: "fire",
  rodRequired: "rare1",
  peakWonderGate: 40,
  sub_tier: "common-rare",
};

const catalog = [wildcardCreature, commonFire, commonWater, rareFire];

test("rare_wildcard includes elementType any creatures", () => {
  const filtered = filterCreaturesByRodPermission("rare_wildcard", catalog);
  assert.ok(filtered.some((c) => c.creatureTypeId === "prism-drifter"));
});

test("rare_fire excludes elementType any creatures", () => {
  const filtered = filterCreaturesByRodPermission("rare_fire", catalog);
  assert.ok(!filtered.some((c) => c.creatureTypeId === "prism-drifter"));
  assert.ok(filtered.some((c) => c.creatureTypeId === "ember-koi"));
});

test("basic rod still passes all common-tier creatures", () => {
  const filtered = filterCreaturesByRodPermission("basic", catalog);
  assert.deepEqual(filtered.map((c) => c.creatureTypeId).sort(), ["bubble-mote", "puddle-dart"]);
});
