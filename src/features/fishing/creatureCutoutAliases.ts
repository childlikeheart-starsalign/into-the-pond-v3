/**
 * Catalog displayName slug → cutout filename slug when they differ
 * (common sheet 0–29 reading-order extract).
 */
import type { Creature } from "@/src/data/creatures/types";

export const COMMON_CUTOUT_ALIASES: Readonly<Record<string, string>> = {
  reed_tail: "whisper_minnow",
  cloud_fin: "dandelion_drift",
  hinge_glider: "lantern_fry",
  amber_ring: "paperfin",
  shore_ghost: "reed_glider",
  knot_swimmer: "static_eel",
  petal_dart: "cloud_guppy",
  chalk_line: "ember_loop",
  tide_pup: "dew_belly",
  mirror_leaf: "zephyr_tail",
  blink_swimmer: "firefly_nib",
  gilt_minnow: "moonscale",
  rust_belly: "lily_wisp",
  soft_arch: "drift_scribe",
  hollow_bell: "glowmoth",
  coil_spark: "blueglass",
  fog_glider: "leafling",
  pool_penny: "pulse_jelly",
  wick_fin: "hushfin",
  loop_drifter: "stone_nibble",
  bone_float: "ripple_wing",
  green_bead: "lantern_jell",
  pine_needle: "breeze_dot",
  faint_arc: "quill_flicker",
  river_coin: "mistgill",
  dusk_mote: "dreamweaver",
};

/** Epic wind — no cutout sheet in CreatureAssets yet. */
export const CREATURE_CUTOUT_GAPS = [
  "gale-witness",
  "storm-anchor",
  "sky-sovereign",
  "elder-breath",
  "word-root",
  "voice-elder",
  "fracture-calm",
  "resonance-elder",
  "canopy-sovereign",
  "breath-sovereign",
  "gust-sovereign",
  "deepwind-elder",
] as const;

export function slugifyCreatureDisplayName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function cutoutSlugForCreature(creature: Creature): string {
  const catalogSlug = slugifyCreatureDisplayName(creature.displayName);
  return COMMON_CUTOUT_ALIASES[catalogSlug] ?? catalogSlug;
}
