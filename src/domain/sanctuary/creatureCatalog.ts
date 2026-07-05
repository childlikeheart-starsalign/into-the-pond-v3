import { CREATURES } from "@/src/data/creatures/index";
import type { CreatureRef } from "../../../shared/sanctuary/fishing/encounterEngine";

/** App-side creature index for encounter engine (mirrors creatures150). */
export const CREATURE_REFS: CreatureRef[] = CREATURES.map((c) => ({
  creatureTypeId: c.creatureTypeId,
  displayName: c.displayName,
  poolTier: c.poolTier,
  elementType: c.elementType,
  rodRequired: c.rodRequired,
  peakWonderGate: c.peakWonderGate,
}));
