/**
 * ⚠️ OFF-LIMITS FOR SERVER / ECONOMY LOGIC
 *
 * Client-side creature pool data only. Cloud Functions must use encounterEngine.ts
 * for fishing outcomes — do not import this module from functions/src.
 */
import type { Creature } from "./types";
import { pool_basic } from "./pool_basic";
import { pool_rare_fire } from "./pool_rare_fire";
import { pool_rare_water } from "./pool_rare_water";
import { pool_rare_wind } from "./pool_rare_wind";
import { pool_rare_electric } from "./pool_rare_electric";
import { pool_rare_wildcard } from "./pool_rare_wildcard";
import { pool_epic_fire } from "./pool_epic_fire";
import { pool_epic_water } from "./pool_epic_water";
import { pool_epic_wind } from "./pool_epic_wind";
import { pool_epic_electric } from "./pool_epic_electric";

export const POOL = {
  common: pool_basic,
  rarefire: pool_rare_fire,
  rarewater: pool_rare_water,
  rarewind: pool_rare_wind,
  rareelectric: pool_rare_electric,
  rareany: pool_rare_wildcard,
  epicfire: pool_epic_fire,
  epicwater: pool_epic_water,
  epicwind: pool_epic_wind,
  epicelectric: pool_epic_electric,
};

const CREATURE_BY_TYPE_ID: Map<string, Creature> = (() => {
  const map = new Map<string, Creature>();
  for (const pool of Object.values(POOL)) {
    for (const creature of pool) {
      map.set(creature.creatureTypeId, creature);
    }
  }
  return map;
})();

/** Client lookup for claim celebration art / field notes. */
export function getCreatureByTypeId(creatureTypeId: string | undefined | null): Creature | null {
  if (!creatureTypeId) return null;
  return CREATURE_BY_TYPE_ID.get(creatureTypeId) ?? null;
}

/** Validates pool sizes match spec */
export function validatePoolCounts(): void {
  const expected = {
    common: 30,
    rarefire: 14,
    rarewater: 14,
    rarewind: 14,
    rareelectric: 14,
    rareany: 14,
    epicfire: 13,
    epicwater: 13,
    epicwind: 12,
    epicelectric: 12,
  };
  let valid = true;
  (Object.keys(expected) as Array<keyof typeof expected>).forEach((key) => {
    if (POOL[key].length !== expected[key]) {
      console.error(`Pool ${key}: expected ${expected[key]}, got ${POOL[key].length}`);
      valid = false;
    }
  });
  if (valid)
    console.log(
      `✓ All 10 pools validated. Total: ${Object.values(POOL).reduce((n, p) => n + p.length, 0)} creatures.`,
    );
}
