/**
 * Regenerates docs/data/creature-probabilities.json from live catalog + encounterEngine.
 *
 *   npm run generate:creature-probabilities
 *
 * Baseline steady-state probabilities only — live rates change with wonder gates,
 * collection progress (unseen reweighting), and pity counters.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CREATURES } from "../src/data/creatures/index.ts";
import {
  baseWeightForCreature,
  catchChance,
  effectiveWonderGate,
  sheetCWeightProfileForRod,
} from "../shared/sanctuary/fishing/encounterEngine.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, "docs/data/creature-probabilities.json");

const EXPECTED_CREATURE_COUNT = 150;
const BASELINE_WONDER = 100;

/** Mirrors shared/sanctuary/rods/catalog.ts rodTypeKey → FishingRodId. */
const ROD_TO_DOMAIN = {
  basic: "basic",
  rare1: "rare_fire",
  rare2: "rare_water",
  rare3: "rare_wind",
  rare4: "rare_electric",
  rare5: "rare_wildcard",
  epic1: "epic_fire",
  epic2: "epic_water",
  epic3: "epic_wind",
  epic4: "epic_electric",
};

function round6(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function toRef(creature) {
  return {
    creatureTypeId: creature.creatureTypeId,
    displayName: creature.displayName,
    poolTier: creature.poolTier,
    elementType: creature.elementType,
    rodRequired: creature.rodRequired,
    peakWonderGate: creature.peakWonderGate,
    sub_tier: creature.sub_tier,
  };
}

function assertCatalogIntegrity() {
  if (CREATURES.length !== EXPECTED_CREATURE_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_CREATURE_COUNT} creatures, got ${CREATURES.length}`,
    );
  }

  const ids = CREATURES.map((c) => c.creatureTypeId);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Duplicate creatureTypeId values in catalog");
  }
}

function buildPoolsByRod() {
  const pools = new Map();
  for (const creature of CREATURES) {
    const key = creature.rodRequired;
    if (!pools.has(key)) pools.set(key, []);
    pools.get(key).push(toRef(creature));
  }
  return pools;
}

function probabilityForCreature(creature, poolsByRod, baitTier) {
  const pool = poolsByRod
    .get(creature.rodRequired)
    .filter((p) => BASELINE_WONDER >= effectiveWonderGate(p.peakWonderGate, baitTier));

  if (!pool.some((p) => p.creatureTypeId === creature.creatureTypeId)) {
    return 0;
  }

  const rodId = ROD_TO_DOMAIN[creature.rodRequired];
  const element = pool[0].elementType;
  const tier = pool[0].poolTier;
  const catchP = catchChance(tier, element, BASELINE_WONDER, baitTier);
  const profile = sheetCWeightProfileForRod(rodId);
  const weights = pool.map((p) => baseWeightForCreature(p, profile, 1));
  const total = weights.reduce((sum, w) => sum + w, 0);
  const idx = pool.findIndex((p) => p.creatureTypeId === creature.creatureTypeId);
  return catchP * (weights[idx] / total);
}

function buildPoolCatchRates(poolsByRod) {
  const poolCatchRates = {};

  for (const [rodType, pool] of poolsByRod) {
    const eligible = pool.filter(
      (p) => BASELINE_WONDER >= effectiveWonderGate(p.peakWonderGate, null),
    );
    if (eligible.length === 0) continue;

    const element = eligible[0].elementType;
    const tier = eligible[0].poolTier;

    poolCatchRates[rodType] = {
      noBait: round6(catchChance(tier, element, BASELINE_WONDER, null)),
      basicBait: round6(catchChance(tier, element, BASELINE_WONDER, "basic")),
      midBait: round6(catchChance(tier, element, BASELINE_WONDER, "rare")),
      premiumBait: round6(catchChance(tier, element, BASELINE_WONDER, "epic")),
      poolSize: eligible.length,
    };
  }

  return poolCatchRates;
}

function buildOutput() {
  assertCatalogIntegrity();

  const poolsByRod = buildPoolsByRod();

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      generator: "scripts/generate-creature-probabilities.mjs",
      assumptions: {
        currentWonder: BASELINE_WONDER,
        caughtIds: "empty (all unseen)",
        pity: "none",
        withBaitTier: "basic (+5% catch bonus)",
        formula: "P(creature per cast) = P(catch | rod pool) × P(creature | catch, Sheet C weights)",
        note:
          "Baseline steady-state only. Live rates change with wonder gates, collection progress, and pity.",
      },
      poolCatchRates: buildPoolCatchRates(poolsByRod),
    },
    creatures: CREATURES.map((creature) => ({
      creatureTypeId: creature.creatureTypeId,
      name: creature.displayName,
      description: creature.visualMetaphor,
      tier: creature.poolTier,
      subTier: creature.sub_tier,
      element: creature.elementType,
      rodRequired: creature.rodRequired,
      peakWonderGate: creature.peakWonderGate,
      probabilityNoBait: round6(probabilityForCreature(creature, poolsByRod, null)),
      probabilityWithBait: round6(probabilityForCreature(creature, poolsByRod, "basic")),
    })),
  };
}

const output = buildOutput();

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`);

console.log(
  `Wrote ${output.creatures.length} creatures → ${path.relative(ROOT, OUT_PATH)}`,
);
