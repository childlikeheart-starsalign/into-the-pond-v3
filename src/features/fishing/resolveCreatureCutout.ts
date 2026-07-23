/**
 * Resolve a caught creature to its cutout ImageSource for the field-note plate.
 *
 * Common-sheet extracts used sheet labels (not catalog displayName) — see aliases.
 * Epic wind cutouts are not extracted yet; those IDs resolve to null (empty plate).
 */
import type { ImageSourcePropType } from "react-native";

import { getCreatureByTypeId } from "@/src/data/creatures/helpers";
import { cutoutSlugForCreature } from "@/src/features/fishing/creatureCutoutAliases";
import { CREATURE_CUTOUT_ASSETS } from "@/src/features/fishing/creatureCutoutAssets";

export {
  COMMON_CUTOUT_ALIASES,
  CREATURE_CUTOUT_GAPS,
  cutoutSlugForCreature,
  slugifyCreatureDisplayName,
} from "@/src/features/fishing/creatureCutoutAliases";

/** Soft-fail: missing art returns null (empty plate). */
export function resolveCreatureCutoutSource(
  creatureTypeId: string | undefined | null,
): ImageSourcePropType | null {
  const creature = getCreatureByTypeId(creatureTypeId);
  if (!creature) return null;
  const slug = cutoutSlugForCreature(creature);
  return CREATURE_CUTOUT_ASSETS[slug] ?? null;
}
