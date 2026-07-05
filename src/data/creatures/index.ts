export * from "./types";
export { pool_basic } from "./pool_basic";
export { pool_rare_fire } from "./pool_rare_fire";
export { pool_rare_water } from "./pool_rare_water";
export { pool_rare_wind } from "./pool_rare_wind";
export { pool_rare_electric } from "./pool_rare_electric";
export { pool_rare_wildcard } from "./pool_rare_wildcard";
export { pool_epic_fire } from "./pool_epic_fire";
export { pool_epic_water } from "./pool_epic_water";
export { pool_epic_wind } from "./pool_epic_wind";
export { pool_epic_electric } from "./pool_epic_electric";
export { POOL, validatePoolCounts } from "./helpers";

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
import type { Creature } from "./types";

export const CREATURES: Creature[] = [
  ...pool_basic,
  ...pool_rare_fire,
  ...pool_rare_water,
  ...pool_rare_wind,
  ...pool_rare_electric,
  ...pool_rare_wildcard,
  ...pool_epic_fire,
  ...pool_epic_water,
  ...pool_epic_wind,
  ...pool_epic_electric,
];

export const CREATURE_BY_ID = Object.fromEntries(
  CREATURES.map((c) => [c.creatureTypeId, c]),
) as Record<string, Creature>;
