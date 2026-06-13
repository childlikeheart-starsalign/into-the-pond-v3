/**
 * Into the Pond — Full 150-Creature Bestiary Catalog
 * Version 2.0 — authoritative source of truth
 *
 * Pool distribution:
 *   Common (all elements)  ×30  — Basic rod, no bait, no Wonder gate
 *   Rare Fire              ×14  — Rare 1 rod, gate: 40W peak
 *   Rare Water             ×14  — Rare 2 rod, gate: 40W peak
 *   Rare Wind              ×14  — Rare 3 rod, gate: 40W peak
 *   Rare Electric          ×14  — Rare 4 rod, gate: 40W peak
 *   Rare Any-element       ×14  — Rare 5 rod, gate: 65W peak
 *   Epic Fire              ×13  — Epic 1 rod, gate: 90W peak
 *   Epic Water             ×13  — Epic 2 rod, gate: 90W peak
 *   Epic Wind              ×12  — Epic 3 rod, gate: 90W peak
 *   Epic Electric          ×12  — Epic 4 rod, gate: 90W peak
 *   TOTAL                  150
 *
 * Encounter rates (server-side, computed at claim time):
 *   Common:          base 55%, +currentWonder/600, max 70%, no bait bonus
 *   Rare element:    base 14%, +currentWonder/500, max 20%, +6% bait, max 26%
 *   Rare any:        base  6%, +currentWonder/600, max 10%, +5% bait, max 15%
 *   Epic element:    base  3%, +currentWonder/700, max  7%, +5% bait, max 12%
 *
 * Miss consolation (always guaranteed):
 *   Common miss   → +1 bait material
 *   Rare miss     → +1 bait material
 *   Epic miss     → +2 bait materials
 *
 * Duplicate consolation (pool already fully caught → full pool repeats):
 *   Duplicate common   → +1 mat + 1W
 *   Duplicate rare     → +2 mat + 2W
 *   Duplicate epic     → +3 mat + 4W + spirit echo
 *   Full pool complete → one-time: +10W + mastery badge + garden decoration
 *
 * Duplicate avoidance (apply in fishing service before random selection):
 *   const unseen = pool.filter(c => !caughtIds.has(c.creatureTypeId));
 *   const candidates = unseen.length > 0 ? unseen : pool; // allow repeats when complete
 */

export type ElementType = "fire" | "water" | "wind" | "electric" | "any";
export type PoolTier = "common" | "rare" | "epic";
export type RodType =
  | "basic"
  | "rare1"
  | "rare2"
  | "rare3"
  | "rare4"
  | "rare5"
  | "epic1"
  | "epic2"
  | "epic3"
  | "epic4";

export interface Creature {
  creatureTypeId: string;
  displayName: string;
  poolTier: PoolTier;
  elementType: ElementType;
  rodRequired: RodType;
  peakWonderGate: number; // min peakWonder to unlock pool
  lessonId: string; // for revisit routing
  moduleId: number;
  visualMetaphor: string;
  masteryTip: string;
  partnerEcho?: string;
  illustrationAssetKey: string;
  netSlotIndex: number; // 0–149, fixed gallery position
}

// ─── ENCOUNTER RATE CONSTANTS ────────────────────────────────────────────────
export const ENCOUNTER_RATES = {
  common: { base: 0.55, wonderDivisor: 600, maxNoBait: 0.7, baitBonus: 0.0, maxWithBait: 0.7 },
  rareElement: {
    base: 0.14,
    wonderDivisor: 500,
    maxNoBait: 0.2,
    baitBonus: 0.06,
    maxWithBait: 0.26,
  },
  rareAny: { base: 0.06, wonderDivisor: 600, maxNoBait: 0.1, baitBonus: 0.05, maxWithBait: 0.15 },
  epicElement: {
    base: 0.03,
    wonderDivisor: 700,
    maxNoBait: 0.07,
    baitBonus: 0.05,
    maxWithBait: 0.12,
  },
} as const;

export const WONDER_GATES: Record<RodType, number> = {
  basic: 0,
  rare1: 40,
  rare2: 40,
  rare3: 40,
  rare4: 40,
  rare5: 65,
  epic1: 90,
  epic2: 90,
  epic3: 90,
  epic4: 90,
};

export const DUPLICATE_CONSOLATION = {
  common: { materials: 1, wonder: 1 },
  rare: { materials: 2, wonder: 2 },
  epic: { materials: 3, wonder: 4, spiritEcho: true },
  poolComplete: { wonder: 10, badge: true, gardenDecoration: true },
} as const;

export const MISS_CONSOLATION = {
  common: { materials: 1 },
  rare: { materials: 1 },
  epic: { materials: 2 },
} as const;

// ─── CATALOG ─────────────────────────────────────────────────────────────────

export const CREATURES: Creature[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // COMMON POOL — 30 creatures (slots 0–29)
  // All elements mixed. Basic rod. No Wonder gate. Free tier accessible.
  // Themes: first impressions of each lesson concept, surface-level insight
  // ═══════════════════════════════════════════════════════════════════════════

  {
    creatureTypeId: "puddle-dart",
    displayName: "Puddle Dart",
    poolTier: "common",
    elementType: "fire",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "1.1",
    moduleId: 1,
    visualMetaphor:
      "A coin-bright fish that skims just below the surface, startled by its own reflection",
    masteryTip:
      "Emotional flooding closes the thinking brain in seconds. Recognising the signs in yourself is the first skill.",
    illustrationAssetKey: "common_fire_puddle_dart",
    netSlotIndex: 0,
  },
  {
    creatureTypeId: "bubble-mote",
    displayName: "Bubble Mote",
    poolTier: "common",
    elementType: "water",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "1.2",
    moduleId: 1,
    visualMetaphor: "A perfectly round fish that rolls gently with every current, unhurried",
    masteryTip:
      "The infant brain develops from the bottom up. What looks like defiance is often just an immature nervous system.",
    illustrationAssetKey: "common_water_bubble_mote",
    netSlotIndex: 1,
  },
  {
    creatureTypeId: "moss-skipper",
    displayName: "Moss Skipper",
    poolTier: "common",
    elementType: "wind",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "1.3",
    moduleId: 1,
    visualMetaphor: "A flat green fish that rests on lily pads and drifts between them",
    masteryTip:
      "Co-regulation is not a technique. It is presence. Your child's nervous system is always reading yours.",
    illustrationAssetKey: "common_wind_moss_skipper",
    netSlotIndex: 2,
  },
  {
    creatureTypeId: "spark-pebble",
    displayName: "Spark Pebble",
    poolTier: "common",
    elementType: "electric",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "1.4",
    moduleId: 1,
    visualMetaphor: "A stone-shaped fish that briefly glows when it touches another",
    masteryTip:
      "Co-regulation in practice: your child can only borrow the calm they can sense in you. Make it available.",
    illustrationAssetKey: "common_electric_spark_pebble",
    netSlotIndex: 3,
  },
  {
    creatureTypeId: "reed-tail",
    displayName: "Reed Tail",
    poolTier: "common",
    elementType: "fire",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "1.5",
    moduleId: 1,
    visualMetaphor: "A slender amber fish with a long trailing fin that catches in slow currents",
    masteryTip:
      "Regulating yourself first is the hardest and most important thing. Not because you're calm. Because your child needs you to try.",
    partnerEcho: "The tail shows which way the water is moving.",
    illustrationAssetKey: "common_fire_reed_tail",
    netSlotIndex: 4,
  },
  {
    creatureTypeId: "cloud-fin",
    displayName: "Cloud Fin",
    poolTier: "common",
    elementType: "water",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "1.6",
    moduleId: 1,
    visualMetaphor:
      "A pale, diffuse fish whose edges are never quite sharp, like cloud reflected in water",
    masteryTip:
      "High-stress scenarios feel different when you have named them in advance. The cloud fin reminds us: anticipation is preparation.",
    illustrationAssetKey: "common_water_cloud_fin",
    netSlotIndex: 5,
  },
  {
    creatureTypeId: "hinge-glider",
    displayName: "Hinge Glider",
    poolTier: "common",
    elementType: "wind",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "2.1",
    moduleId: 2,
    visualMetaphor:
      "A jointed fish that folds mid-swim, changing direction with the ease of a door hinge",
    masteryTip:
      "The daily integration system works by attaching new habits to existing ones. Don't create new routines. Modify the ones you already have.",
    illustrationAssetKey: "common_wind_hinge_glider",
    netSlotIndex: 6,
  },
  {
    creatureTypeId: "amber-ring",
    displayName: "Amber Ring",
    poolTier: "common",
    elementType: "electric",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "2.2",
    moduleId: 2,
    visualMetaphor:
      "A circular fish that glows warm yellow, orbiting slowly around any object it finds",
    masteryTip:
      "Control backfires because it removes the child's experience of their own agency. You want to guide, not steer.",
    illustrationAssetKey: "common_electric_amber_ring",
    netSlotIndex: 7,
  },
  {
    creatureTypeId: "shore-ghost",
    displayName: "Shore Ghost",
    poolTier: "common",
    elementType: "fire",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "2.3",
    moduleId: 2,
    visualMetaphor: "A transparent fish only visible at the water's edge where light refracts",
    masteryTip:
      'The cooperation model begins with an invitation, not an instruction. "Can you help me with this?" is a different sentence than "Do this."',
    illustrationAssetKey: "common_fire_shore_ghost",
    netSlotIndex: 8,
  },
  {
    creatureTypeId: "knot-swimmer",
    displayName: "Knot Swimmer",
    poolTier: "common",
    elementType: "water",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "2.4",
    moduleId: 2,
    visualMetaphor: "A fish whose body loops gently as it swims, always finding a way to untangle",
    masteryTip: "Connection before instruction untangles resistance before it starts.",
    illustrationAssetKey: "common_water_knot_swimmer",
    netSlotIndex: 9,
  },
  {
    creatureTypeId: "petal-dart",
    displayName: "Petal Dart",
    poolTier: "common",
    elementType: "wind",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "2.5",
    moduleId: 2,
    visualMetaphor: "A flower-shaped fish that spins slowly as it drifts, petals catching water",
    masteryTip:
      'Handling "no" without escalation starts with not taking the "no" personally. It\'s developmental, not defiant.',
    partnerEcho: "Petals open when the water is warm.",
    illustrationAssetKey: "common_wind_petal_dart",
    netSlotIndex: 10,
  },
  {
    creatureTypeId: "chalk-line",
    displayName: "Chalk Line",
    poolTier: "common",
    elementType: "electric",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "2.6",
    moduleId: 2,
    visualMetaphor: "A fish that moves in perfectly straight lines, leaving a faint white trail",
    masteryTip:
      "Boundaries without threat are drawn clearly, consistently, and without drama. The line is visible. The line does not move.",
    illustrationAssetKey: "common_electric_chalk_line",
    netSlotIndex: 11,
  },
  {
    creatureTypeId: "tide-pup",
    displayName: "Tide Pup",
    poolTier: "common",
    elementType: "fire",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "2.7",
    moduleId: 2,
    visualMetaphor: "A round, playful fish that chases tidal ripples enthusiastically",
    masteryTip:
      "Integration means the learning lives in ordinary moments, not special ones. The tide pup doesn't wait for the perfect wave.",
    illustrationAssetKey: "common_fire_tide_pup",
    netSlotIndex: 12,
  },
  {
    creatureTypeId: "mirror-leaf",
    displayName: "Mirror Leaf",
    poolTier: "common",
    elementType: "water",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "2.8",
    moduleId: 2,
    visualMetaphor: "A leaf-shaped fish whose top surface perfectly mirrors the sky",
    masteryTip:
      "Boundaries without threat require you to have already decided. Decide before the moment arrives.",
    illustrationAssetKey: "common_water_mirror_leaf",
    netSlotIndex: 13,
  },
  {
    creatureTypeId: "blink-swimmer",
    displayName: "Blink Swimmer",
    poolTier: "common",
    elementType: "wind",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "2.9",
    moduleId: 2,
    visualMetaphor: "A fish that appears and disappears between blinks, quick as a thought",
    masteryTip:
      'Cooperation is built in micro-moments. A smile, a nod, a "I noticed that." These are the blinks of connection.',
    illustrationAssetKey: "common_wind_blink_swimmer",
    netSlotIndex: 14,
  },
  {
    creatureTypeId: "gilt-minnow",
    displayName: "Gilt Minnow",
    poolTier: "common",
    elementType: "electric",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "3.1",
    moduleId: 3,
    visualMetaphor: "A gold-flecked fish that catches light from unexpected angles",
    masteryTip:
      "The hidden cost of praise is invisible until it shows up in a child who is afraid to fail. Ask yourself what you are actually rewarding.",
    illustrationAssetKey: "common_electric_gilt_minnow",
    netSlotIndex: 15,
  },
  {
    creatureTypeId: "rust-belly",
    displayName: "Rust Belly",
    poolTier: "common",
    elementType: "fire",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "3.2",
    moduleId: 3,
    visualMetaphor:
      "A fish with a warm rust-coloured underside that turns up when it floats at rest",
    masteryTip:
      "How children interpret failure depends entirely on what adults say in the first moments after it happens.",
    illustrationAssetKey: "common_fire_rust_belly",
    netSlotIndex: 16,
  },
  {
    creatureTypeId: "soft-arch",
    displayName: "Soft Arch",
    poolTier: "common",
    elementType: "water",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "3.3",
    moduleId: 3,
    visualMetaphor: "A fish whose spine arches gently, absorbing every impact with graceful flex",
    masteryTip:
      'Reframing failure is not softening truth. "You haven\'t solved it yet" is both true and kinder than "you failed."',
    partnerEcho: "Flexibility is its whole design.",
    illustrationAssetKey: "common_water_soft_arch",
    netSlotIndex: 17,
  },
  {
    creatureTypeId: "hollow-bell",
    displayName: "Hollow Bell",
    poolTier: "common",
    elementType: "wind",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "3.4",
    moduleId: 3,
    visualMetaphor: "A bell-shaped fish that resonates a low tone when water moves through it",
    masteryTip:
      "Emotional processing after failure needs space before it needs words. The bell needs to ring before it can be quiet.",
    illustrationAssetKey: "common_wind_hollow_bell",
    netSlotIndex: 18,
  },
  {
    creatureTypeId: "coil-spark",
    displayName: "Coil Spark",
    poolTier: "common",
    elementType: "electric",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "3.5",
    moduleId: 3,
    visualMetaphor: "A tightly coiled fish that springs forward in brief, energetic bursts",
    masteryTip:
      'Building reflection loops: the simplest version is one question, asked consistently. "What was one thing today?"',
    illustrationAssetKey: "common_electric_coil_spark",
    netSlotIndex: 19,
  },
  {
    creatureTypeId: "fog-glider",
    displayName: "Fog Glider",
    poolTier: "common",
    elementType: "fire",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "3.6",
    moduleId: 3,
    visualMetaphor:
      "A fish visible only in misty water, barely distinguishable from the fog itself",
    masteryTip:
      "Real-life scenarios are rarely ideal. The fog glider finds its way without clear visibility. So can you.",
    illustrationAssetKey: "common_fire_fog_glider",
    netSlotIndex: 20,
  },
  {
    creatureTypeId: "pool-penny",
    displayName: "Pool Penny",
    poolTier: "common",
    elementType: "water",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "3.7",
    moduleId: 3,
    visualMetaphor: "A coin-flat fish that sinks slowly, catching light as it descends",
    masteryTip:
      "Real-life scenarios: the lesson that works on Monday may not work on Friday. Children change. Stay curious.",
    illustrationAssetKey: "common_water_pool_penny",
    netSlotIndex: 21,
  },
  {
    creatureTypeId: "wick-fin",
    displayName: "Wick Fin",
    poolTier: "common",
    elementType: "wind",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "3.8",
    moduleId: 3,
    visualMetaphor: "A thin, bright fish shaped like a candle flame, always vertical in the water",
    masteryTip:
      "Reducing resistance is about timing and tone as much as words. The same sentence, differently delivered, has a different outcome.",
    illustrationAssetKey: "common_wind_wick_fin",
    netSlotIndex: 22,
  },
  {
    creatureTypeId: "loop-drifter",
    displayName: "Loop Drifter",
    poolTier: "common",
    elementType: "electric",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "3.9",
    moduleId: 3,
    visualMetaphor: "A fish that swims in loose, unhurried loops, returning to the same spot",
    masteryTip:
      "Real-life scenarios are where integration happens. The loop drifter knows: return to the centre, and the practice continues.",
    partnerEcho: "Every loop brings it home.",
    illustrationAssetKey: "common_electric_loop_drifter",
    netSlotIndex: 23,
  },
  {
    creatureTypeId: "bone-float",
    displayName: "Bone Float",
    poolTier: "common",
    elementType: "fire",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "4.1",
    moduleId: 4,
    visualMetaphor:
      "A pale, angular fish that seems almost skeletal, moving with surprising lightness",
    masteryTip:
      "The hidden cost of pressure is a child who cannot access their own inner compass. Your approval should not be the compass.",
    illustrationAssetKey: "common_fire_bone_float",
    netSlotIndex: 24,
  },
  {
    creatureTypeId: "green-bead",
    displayName: "Green Bead",
    poolTier: "common",
    elementType: "water",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "4.2",
    moduleId: 4,
    visualMetaphor: "A round, deep-green fish that rolls along the pond floor like a bead",
    masteryTip:
      "How children interpret failure shapes what they believe about effort. The green bead collects, it doesn't conclude.",
    illustrationAssetKey: "common_water_green_bead",
    netSlotIndex: 25,
  },
  {
    creatureTypeId: "pine-needle",
    displayName: "Pine Needle",
    poolTier: "common",
    elementType: "wind",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "4.3",
    moduleId: 4,
    visualMetaphor:
      "A long, thin fish that floats with the precision of a compass needle, always pointing somewhere",
    masteryTip:
      'Emotional processing after failure: point toward "what next" only after the feeling has been fully acknowledged.',
    illustrationAssetKey: "common_wind_pine_needle",
    netSlotIndex: 26,
  },
  {
    creatureTypeId: "faint-arc",
    displayName: "Faint Arc",
    poolTier: "common",
    elementType: "electric",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "4.4",
    moduleId: 4,
    visualMetaphor:
      "A crescent-shaped fish that produces a barely visible arc of light when it moves",
    masteryTip:
      "Building reflection loops begins with the parent reflecting first. Your child learns the practice by watching you do it.",
    illustrationAssetKey: "common_electric_faint_arc",
    netSlotIndex: 27,
  },
  {
    creatureTypeId: "river-coin",
    displayName: "River Coin",
    poolTier: "common",
    elementType: "fire",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "4.5",
    moduleId: 4,
    visualMetaphor: "A flat golden fish tumbled smooth by current, warm to the touch",
    masteryTip:
      "Real-life scenarios: when the lesson meets the moment, something is always lost and something is always gained. That is learning.",
    illustrationAssetKey: "common_fire_river_coin",
    netSlotIndex: 28,
  },
  {
    creatureTypeId: "dusk-mote",
    displayName: "Dusk Mote",
    poolTier: "common",
    elementType: "water",
    rodRequired: "basic",
    peakWonderGate: 0,
    lessonId: "4.6",
    moduleId: 4,
    visualMetaphor: "A fish that appears only in the fading light, its colours most vivid at dusk",
    masteryTip:
      "Real-life scenarios at the end of a module: everything you've learned is already in practice, even when it doesn't feel like it.",
    partnerEcho: "It's always been here. You can see it now.",
    illustrationAssetKey: "common_water_dusk_mote",
    netSlotIndex: 29,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RARE FIRE — 14 creatures (slots 30–43)
  // Rod: Rare 1. Gate: 40W peak. Module 1–5 emotional regulation & stress themes
  // ═══════════════════════════════════════════════════════════════════════════

  {
    creatureTypeId: "ember-darter",
    displayName: "Ember Darter",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    lessonId: "1.1",
    moduleId: 1,
    visualMetaphor:
      "A rust-orange fish trailing heat shimmer, darting erratically through still water",
    masteryTip:
      "Emotional flooding closes the thinking brain. The darter shows you what flooding looks like from the outside — fast, reactive, unpatterned.",
    partnerEcho: "It moves fast when startled. So do we.",
    illustrationAssetKey: "rare_fire_ember_darter",
    netSlotIndex: 30,
  },
  {
    creatureTypeId: "cinder-veil",
    displayName: "Cinder Veil",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    lessonId: "1.5",
    moduleId: 1,
    visualMetaphor: "A translucent fish with ember-glow edges, visible only when perfectly still",
    masteryTip:
      "The regulated parent is not the one who never feels. It's the one who can feel without being swept away.",
    illustrationAssetKey: "rare_fire_cinder_veil",
    netSlotIndex: 31,
  },
  {
    creatureTypeId: "flare-scout",
    displayName: "Flare Scout",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    lessonId: "1.6",
    moduleId: 1,
    visualMetaphor: "A bold amber fish with spiny fins that flare visibly under pressure",
    masteryTip:
      "High-stress scenarios become manageable when you have rehearsed your response. The flare is recognisable. Your response can be too.",
    illustrationAssetKey: "rare_fire_flare_scout",
    netSlotIndex: 32,
  },
  {
    creatureTypeId: "hearthfin",
    displayName: "Hearthfin",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    lessonId: "2.3",
    moduleId: 2,
    visualMetaphor:
      "A warm, round-bellied fish that glows from within like a coal held to the light",
    masteryTip:
      "Warmth as a parenting strategy is not softness. It is the precondition for everything else.",
    partnerEcho: "Warmth draws things closer. Always.",
    illustrationAssetKey: "rare_fire_hearthfin",
    netSlotIndex: 33,
  },
  {
    creatureTypeId: "scorchtail",
    displayName: "Scorchtail",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    lessonId: "2.6",
    moduleId: 2,
    visualMetaphor: "A sleek fish whose tail briefly illuminates the water behind it as it turns",
    masteryTip:
      "Boundaries without threat: your follow-through is the boundary. The words are just the announcement.",
    partnerEcho: "Its trail is honest. So is yours.",
    illustrationAssetKey: "rare_fire_scorchtail",
    netSlotIndex: 34,
  },
  {
    creatureTypeId: "soot-drifter",
    displayName: "Soot Drifter",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    lessonId: "3.4",
    moduleId: 3,
    visualMetaphor:
      "A slow fish that moves through water like smoke, leaving soft grey particles that dissolve",
    masteryTip:
      "External motivation drifts away once the reward is removed. What remains when you take the reward away is the only motivation that lasts.",
    illustrationAssetKey: "rare_fire_soot_drifter",
    netSlotIndex: 35,
  },
  {
    creatureTypeId: "forge-wraith",
    displayName: "Forge Wraith",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    lessonId: "3.6",
    moduleId: 3,
    visualMetaphor:
      "A fish detectable only by the heat distortion it creates — the fish itself is invisible",
    masteryTip:
      "Most meaningful parenting happens invisibly. The child does not see the preparation, the restraint, the choosing not to react.",
    partnerEcho: "The hardest work leaves no visible trace.",
    illustrationAssetKey: "rare_fire_forge_wraith",
    netSlotIndex: 36,
  },
  {
    creatureTypeId: "cinderback",
    displayName: "Cinderback",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    lessonId: "3.9",
    moduleId: 3,
    visualMetaphor: "A fish with a blackened back and luminous belly, glowing upward from the dark",
    masteryTip:
      "Real-life scenarios require the parent to hold complexity: compassion and limit, presence and boundary, warmth and firmness.",
    illustrationAssetKey: "rare_fire_cinderback",
    netSlotIndex: 37,
  },
  {
    creatureTypeId: "heatwave-glide",
    displayName: "Heatwave Glide",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    lessonId: "4.1",
    moduleId: 4,
    visualMetaphor:
      "A fish that bends light around it, creating a wavering distortion as it passes",
    masteryTip:
      "The pressure to perform is passed through a parent's nervous system before it ever reaches words. Children read what you feel before they hear what you say.",
    illustrationAssetKey: "rare_fire_heatwave_glide",
    netSlotIndex: 38,
  },
  {
    creatureTypeId: "tinder-swift",
    displayName: "Tinder Swift",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    lessonId: "4.3",
    moduleId: 4,
    visualMetaphor:
      "A fast-burning fish that moves in brilliant short bursts, then rests completely",
    masteryTip:
      "Emotional processing after failure moves in cycles: the burst of feeling, then the rest, then the integration. Don't rush any stage.",
    illustrationAssetKey: "rare_fire_tinder_swift",
    netSlotIndex: 39,
  },
  {
    creatureTypeId: "ashwing",
    displayName: "Ashwing",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    lessonId: "4.4",
    moduleId: 4,
    visualMetaphor:
      "A wide, slow fish with wing-like fins dusted in soft grey ash, majestic and unhurried",
    masteryTip:
      'Reflection loops teach children that what happened is not the end of the story. There is always a "what did we learn?"',
    illustrationAssetKey: "rare_fire_ashwing",
    netSlotIndex: 40,
  },
  {
    creatureTypeId: "solstice-runner",
    displayName: "Solstice Runner",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    lessonId: "5.1",
    moduleId: 5,
    visualMetaphor: "A golden fish that always orients toward the brightest point in the water",
    masteryTip:
      "How identity is formed: children move toward the version of themselves they most often see reflected in the people who matter most.",
    illustrationAssetKey: "rare_fire_solstice_runner",
    netSlotIndex: 41,
  },
  {
    creatureTypeId: "blaze-tender",
    displayName: "Blaze Tender",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    lessonId: "5.3",
    moduleId: 5,
    visualMetaphor: "A careful fish that tends small, contained embers rather than burning freely",
    masteryTip:
      "Emotional stability under uncertainty: you do not need to have all the answers. You need to be a steady presence while the answers are still forming.",
    illustrationAssetKey: "rare_fire_blaze_tender",
    netSlotIndex: 42,
  },
  {
    creatureTypeId: "coal-sentinel",
    displayName: "Coal Sentinel",
    poolTier: "rare",
    elementType: "fire",
    rodRequired: "rare1",
    peakWonderGate: 40,
    lessonId: "5.5",
    moduleId: 5,
    visualMetaphor:
      "A dark, still fish that holds its position in the deepest heat, ancient and patient",
    masteryTip:
      'Meaning-driven motivation in a child needs a parent who can hold space for the question "why does this matter?" — even when the answer isn\'t immediate.',
    illustrationAssetKey: "rare_fire_coal_sentinel",
    netSlotIndex: 43,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RARE WATER — 14 creatures (slots 44–57)
  // Rod: Rare 2. Gate: 40W peak. Themes: connection, relationship, cooperation
  // ═══════════════════════════════════════════════════════════════════════════

  {
    creatureTypeId: "tide-whisper",
    displayName: "Tide Whisper",
    poolTier: "rare",
    elementType: "water",
    rodRequired: "rare2",
    peakWonderGate: 40,
    lessonId: "1.3",
    moduleId: 1,
    visualMetaphor:
      "A pale blue fish that pulses rhythmically, like a second heartbeat in the water",
    masteryTip:
      "Co-regulation: your child's nervous system cannot self-soothe until it has learned how through yours. You are the first practice.",
    partnerEcho: "It breathes with the water.",
    illustrationAssetKey: "rare_water_tide_whisper",
    netSlotIndex: 44,
  },
  {
    creatureTypeId: "mirror-minnow",
    displayName: "Mirror Minnow",
    poolTier: "rare",
    elementType: "water",
    rodRequired: "rare2",
    peakWonderGate: 40,
    lessonId: "1.4",
    moduleId: 1,
    visualMetaphor: "A silver fish that mimics the posture and pace of whatever moves near it",
    masteryTip:
      "Co-regulation in practice begins with mirroring. Match the pace, then slowly find the calm.",
    partnerEcho: "It reflects before it leads.",
    illustrationAssetKey: "rare_water_mirror_minnow",
    netSlotIndex: 45,
  },
  {
    creatureTypeId: "current-guide",
    displayName: "Current Guide",
    poolTier: "rare",
    elementType: "water",
    rodRequired: "rare2",
    peakWonderGate: 40,
    lessonId: "2.3",
    moduleId: 2,
    visualMetaphor:
      "A streamlined teal fish that always faces the current, unhurried by the flow against it",
    masteryTip:
      "Connection before instruction is the current you swim with, not against. It takes more effort to fight than to flow.",
    illustrationAssetKey: "rare_water_current_guide",
    netSlotIndex: 46,
  },
  {
    creatureTypeId: "still-pool",
    displayName: "Still Pool",
    poolTier: "rare",
    elementType: "water",
    rodRequired: "rare2",
    peakWonderGate: 40,
    lessonId: "2.5",
    moduleId: 2,
    visualMetaphor:
      "A perfectly flat, round fish that creates a ring of absolute calm wherever it rests",
    masteryTip:
      'Responding to "no" without escalation: the still pool is not empty. It is full of restraint.',
    partnerEcho: "Peace is something you prepare.",
    illustrationAssetKey: "rare_water_still_pool",
    netSlotIndex: 47,
  },
  {
    creatureTypeId: "flow-keeper",
    displayName: "Flow Keeper",
    poolTier: "rare",
    elementType: "water",
    rodRequired: "rare2",
    peakWonderGate: 40,
    lessonId: "2.7",
    moduleId: 2,
    visualMetaphor:
      "A long, elegant fish that moves through the water in continuous, unbroken curves",
    masteryTip:
      "Daily integration means finding the water's natural path, not digging a new channel. What already flows can carry more.",
    illustrationAssetKey: "rare_water_flow_keeper",
    netSlotIndex: 48,
  },
  {
    creatureTypeId: "ripple-sage",
    displayName: "Ripple Sage",
    poolTier: "rare",
    elementType: "water",
    rodRequired: "rare2",
    peakWonderGate: 40,
    lessonId: "3.7",
    moduleId: 3,
    visualMetaphor:
      "An older fish whose passage sends slow rings outward that persist long after it has gone",
    masteryTip:
      "What you practice in calm, you will have access to in chaos. The ripple travels further than the stone.",
    partnerEcho: "The ripples keep going even after the fish has moved on.",
    illustrationAssetKey: "rare_water_ripple_sage",
    netSlotIndex: 49,
  },
  {
    creatureTypeId: "deep-current",
    displayName: "Deep Current",
    poolTier: "rare",
    elementType: "water",
    rodRequired: "rare2",
    peakWonderGate: 40,
    lessonId: "3.8",
    moduleId: 3,
    visualMetaphor:
      "A fish known only by its directional pull — invisible, but its movement is unmistakable",
    masteryTip:
      "Reducing resistance: the deep current doesn't announce itself. Consistent, calm, directional. The child eventually follows.",
    illustrationAssetKey: "rare_water_deep_current",
    netSlotIndex: 50,
  },
  {
    creatureTypeId: "pool-weaver",
    displayName: "Pool Weaver",
    poolTier: "rare",
    elementType: "water",
    rodRequired: "rare2",
    peakWonderGate: 40,
    lessonId: "3.9",
    moduleId: 3,
    visualMetaphor:
      "A fish that creates intricate patterns on the water surface as it navigates beneath",
    masteryTip:
      "Real-life scenarios require you to hold multiple truths at once. Connection and limit. Flexibility and structure. The weaver holds many threads.",
    illustrationAssetKey: "rare_water_pool_weaver",
    netSlotIndex: 51,
  },
  {
    creatureTypeId: "heron-blue",
    displayName: "Heron Blue",
    poolTier: "rare",
    elementType: "water",
    rodRequired: "rare2",
    peakWonderGate: 40,
    lessonId: "4.2",
    moduleId: 3,
    visualMetaphor: "A tall, patient fish that stands still in shallow water for long periods",
    masteryTip:
      "How children interpret failure: the heron waits. It does not panic when the water is empty. It knows the next moment is coming.",
    illustrationAssetKey: "rare_water_heron_blue",
    netSlotIndex: 52,
  },
  {
    creatureTypeId: "glassfin",
    displayName: "Glassfin",
    poolTier: "rare",
    elementType: "water",
    rodRequired: "rare2",
    peakWonderGate: 40,
    lessonId: "4.5",
    moduleId: 4,
    visualMetaphor:
      "A completely transparent fish — all its internal workings visible through its body",
    masteryTip:
      'Real-life scenarios require transparency about your process. "I got frustrated just then" is a more useful sentence than pretending you didn\'t.',
    illustrationAssetKey: "rare_water_glassfin",
    netSlotIndex: 53,
  },
  {
    creatureTypeId: "spring-mouth",
    displayName: "Spring Mouth",
    poolTier: "rare",
    elementType: "water",
    rodRequired: "rare2",
    peakWonderGate: 40,
    lessonId: "5.1",
    moduleId: 5,
    visualMetaphor:
      "A fish with a wide, gentle mouth that creates a permanent small spring wherever it swims",
    masteryTip:
      "Identity formation: the child becomes what they are consistently told they are capable of. Your words are the spring. They keep running.",
    illustrationAssetKey: "rare_water_spring_mouth",
    netSlotIndex: 54,
  },
  {
    creatureTypeId: "salt-runner",
    displayName: "Salt Runner",
    poolTier: "rare",
    elementType: "water",
    rodRequired: "rare2",
    peakWonderGate: 40,
    lessonId: "5.2",
    moduleId: 5,
    visualMetaphor:
      "A fish from deep salt water that has learned to survive in fresh — adaptive, resilient",
    masteryTip:
      "The language that shapes identity is spoken in ordinary moments: the small corrections, the quiet affirmations, the tone of daily questions.",
    illustrationAssetKey: "rare_water_salt_runner",
    netSlotIndex: 55,
  },
  {
    creatureTypeId: "winter-swimmer",
    displayName: "Winter Swimmer",
    poolTier: "rare",
    elementType: "water",
    rodRequired: "rare2",
    peakWonderGate: 40,
    lessonId: "5.4",
    moduleId: 5,
    visualMetaphor:
      "A fish that thrives in cold, still water, moving steadily regardless of temperature",
    masteryTip:
      "Emotional stability under uncertainty means the parent does not need the situation to resolve in order to be present within it.",
    illustrationAssetKey: "rare_water_winter_swimmer",
    netSlotIndex: 56,
  },
  {
    creatureTypeId: "confluence",
    displayName: "Confluence",
    poolTier: "rare",
    elementType: "water",
    rodRequired: "rare2",
    peakWonderGate: 40,
    lessonId: "5.7",
    moduleId: 5,
    visualMetaphor:
      "A fish that appears at the meeting of two currents, thriving where others cannot navigate",
    masteryTip:
      "Long-term integration: the learning and the living eventually become the same water. The confluence is what that looks like.",
    partnerEcho: "Where two currents meet, something new is always possible.",
    illustrationAssetKey: "rare_water_confluence",
    netSlotIndex: 57,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RARE WIND — 14 creatures (slots 58–71)
  // Rod: Rare 3. Gate: 40W peak. Themes: language, agency, failure, reflection
  // ═══════════════════════════════════════════════════════════════════════════

  {
    creatureTypeId: "breath-dart",
    displayName: "Breath Dart",
    poolTier: "rare",
    elementType: "wind",
    rodRequired: "rare3",
    peakWonderGate: 40,
    lessonId: "1.2",
    moduleId: 1,
    visualMetaphor:
      "A near-weightless fish that moves only on surface tension and the pressure of breath",
    masteryTip:
      "The infant brain cannot process complex language under stress. Fewer words, softer tone, physical presence — this is the communication.",
    partnerEcho: "Light things require the gentlest touch.",
    illustrationAssetKey: "rare_wind_breath_dart",
    netSlotIndex: 58,
  },
  {
    creatureTypeId: "whisperfin",
    displayName: "Whisperfin",
    poolTier: "rare",
    elementType: "wind",
    rodRequired: "rare3",
    peakWonderGate: 40,
    lessonId: "3.1",
    moduleId: 3,
    visualMetaphor:
      "A fish whose fins are too fine to see — you know them by the movement they leave",
    masteryTip:
      "The hidden cost of praise runs beneath the surface. A child who only hears praise for results will quietly stop attempting things they might fail.",
    partnerEcho: "The finest things are easy to miss.",
    illustrationAssetKey: "rare_wind_whisperfin",
    netSlotIndex: 59,
  },
  {
    creatureTypeId: "drift-leaf",
    displayName: "Drift Leaf",
    poolTier: "rare",
    elementType: "wind",
    rodRequired: "rare3",
    peakWonderGate: 40,
    lessonId: "3.2",
    moduleId: 3,
    visualMetaphor:
      "A flat fish shaped exactly like a floating leaf, impossible to distinguish from one until it moves",
    masteryTip:
      "Children who interpret failure as evidence about their identity need a parent who can gently, consistently offer a different interpretation.",
    illustrationAssetKey: "rare_wind_drift_leaf",
    netSlotIndex: 60,
  },
  {
    creatureTypeId: "gust-runner",
    displayName: "Gust Runner",
    poolTier: "rare",
    elementType: "wind",
    rodRequired: "rare3",
    peakWonderGate: 40,
    lessonId: "3.3",
    moduleId: 3,
    visualMetaphor:
      "A fast aerodynamic fish that changes course as rapidly as wind through a doorway",
    masteryTip:
      'Reframing failure is speed work. The parent who gets there first — "you haven\'t figured it out yet" — sets the trajectory.',
    partnerEcho: "It doesn't go around. It goes through differently.",
    illustrationAssetKey: "rare_wind_gust_runner",
    netSlotIndex: 61,
  },
  {
    creatureTypeId: "language-lilt",
    displayName: "Language Lilt",
    poolTier: "rare",
    elementType: "wind",
    rodRequired: "rare3",
    peakWonderGate: 40,
    lessonId: "3.5",
    moduleId: 3,
    visualMetaphor: "A fish that moves in melodic undulations, as though swimming to spoken rhythm",
    masteryTip:
      'Language that builds agency asks before it tells. "What do you think would help?" is a different sentence than "here\'s what to do."',
    partnerEcho: "It moves to the rhythm of questions, not answers.",
    illustrationAssetKey: "rare_wind_language_lilt",
    netSlotIndex: 62,
  },
  {
    creatureTypeId: "zephyr-counsel",
    displayName: "Zephyr Counsel",
    poolTier: "rare",
    elementType: "wind",
    rodRequired: "rare3",
    peakWonderGate: 40,
    lessonId: "3.9",
    moduleId: 3,
    visualMetaphor:
      "A wise, slow fish that spirals outward and always returns to the same centre point",
    masteryTip:
      "Real-life scenarios are the curriculum. The counsel knows: the theory and the moment are the same lesson, at different speeds.",
    illustrationAssetKey: "rare_wind_zephyr_counsel",
    netSlotIndex: 63,
  },
  {
    creatureTypeId: "echo-bird",
    displayName: "Echo Bird",
    poolTier: "rare",
    elementType: "wind",
    rodRequired: "rare3",
    peakWonderGate: 40,
    lessonId: "4.1",
    moduleId: 4,
    visualMetaphor:
      "A wing-shaped fish that produces a faint, resonant hum that lingers after it passes",
    masteryTip:
      "Emotional processing after failure: sit with the feeling before offering the lesson. The echo must complete before the next sound.",
    partnerEcho: "Some things need to resonate before they can be understood.",
    illustrationAssetKey: "rare_wind_echo_bird",
    netSlotIndex: 64,
  },
  {
    creatureTypeId: "paper-crane-fish",
    displayName: "Paper Crane Fish",
    poolTier: "rare",
    elementType: "wind",
    rodRequired: "rare3",
    peakWonderGate: 40,
    lessonId: "4.2",
    moduleId: 4,
    visualMetaphor: "A folded, geometric fish that holds its shape perfectly in any current",
    masteryTip:
      "Interpreting failure: structure helps. A child with a consistent way to process difficulty navigates it more gracefully than one without.",
    illustrationAssetKey: "rare_wind_paper_crane_fish",
    netSlotIndex: 65,
  },
  {
    creatureTypeId: "wind-knot",
    displayName: "Wind Knot",
    poolTier: "rare",
    elementType: "wind",
    rodRequired: "rare3",
    peakWonderGate: 40,
    lessonId: "4.3",
    moduleId: 4,
    visualMetaphor:
      "A fish that ties itself into loose loops as it swims, always finding its way out",
    masteryTip:
      "Emotional processing after failure is a knot being untied, not a problem being solved. Patient hands, not forceful ones.",
    illustrationAssetKey: "rare_wind_wind_knot",
    netSlotIndex: 66,
  },
  {
    creatureTypeId: "canopy-drifter",
    displayName: "Canopy Drifter",
    poolTier: "rare",
    elementType: "wind",
    rodRequired: "rare3",
    peakWonderGate: 40,
    lessonId: "4.4",
    moduleId: 4,
    visualMetaphor:
      "A fish that lives at the very surface, in the shadow of the lily pad canopy above",
    masteryTip:
      "Reflection loops: the canopy is made of many leaves. Each reflection is one leaf. Together they create shelter.",
    illustrationAssetKey: "rare_wind_canopy_drifter",
    netSlotIndex: 67,
  },
  {
    creatureTypeId: "feather-wake",
    displayName: "Feather Wake",
    poolTier: "rare",
    elementType: "wind",
    rodRequired: "rare3",
    peakWonderGate: 40,
    lessonId: "4.6",
    moduleId: 4,
    visualMetaphor:
      "A fish that moves so lightly it leaves a wake of feather-light ripples, not waves",
    masteryTip:
      "Real-life scenarios teach us how little force is actually needed when connection is already present.",
    illustrationAssetKey: "rare_wind_feather_wake",
    netSlotIndex: 68,
  },
  {
    creatureTypeId: "voice-thread",
    displayName: "Voice Thread",
    poolTier: "rare",
    elementType: "wind",
    rodRequired: "rare3",
    peakWonderGate: 40,
    lessonId: "5.2",
    moduleId: 5,
    visualMetaphor: "A fish that swims in a perfect thread, unbroken from beginning to end",
    masteryTip:
      "The language that shapes identity is threaded through years of small moments. What you say today becomes the thread they carry.",
    partnerEcho: "Every word is a thread. Choose them like they will last — because they will.",
    illustrationAssetKey: "rare_wind_voice_thread",
    netSlotIndex: 69,
  },
  {
    creatureTypeId: "gust-elder",
    displayName: "Gust Elder",
    poolTier: "rare",
    elementType: "wind",
    rodRequired: "rare3",
    peakWonderGate: 40,
    lessonId: "5.3",
    moduleId: 5,
    visualMetaphor: "An old, wide fish that generates a permanent gentle breeze in all directions",
    masteryTip:
      "Emotional stability under uncertainty is held by parents who have processed enough of their own uncertainty to not be threatened by their child's.",
    illustrationAssetKey: "rare_wind_gust_elder",
    netSlotIndex: 70,
  },
  {
    creatureTypeId: "stillpoint-wing",
    displayName: "Stillpoint Wing",
    poolTier: "rare",
    elementType: "wind",
    rodRequired: "rare3",
    peakWonderGate: 40,
    lessonId: "5.6",
    moduleId: 5,
    visualMetaphor:
      "A wing-shaped fish that creates the eye of a tiny storm around it, perfectly calm at centre",
    masteryTip:
      "Meaning-driven motivation has a stillpoint at its centre: the moment a child discovers that the work matters to them, not because they were told it should.",
    illustrationAssetKey: "rare_wind_stillpoint_wing",
    netSlotIndex: 71,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RARE ELECTRIC — 14 creatures (slots 72–85)
  // Rod: Rare 4. Gate: 40W peak. Themes: cooperation, motivation, identity, independence
  // ═══════════════════════════════════════════════════════════════════════════

  {
    creatureTypeId: "spark-mote",
    displayName: "Spark Mote",
    poolTier: "rare",
    elementType: "electric",
    rodRequired: "rare4",
    peakWonderGate: 40,
    lessonId: "2.2",
    moduleId: 2,
    visualMetaphor: "A fish smaller than a fingernail, visible only by its own spark",
    masteryTip:
      "Control backfires not because children are defiant, but because agency is a developmental need. Remove the agency, increase the resistance.",
    partnerEcho: "Small things can carry a lot of charge.",
    illustrationAssetKey: "rare_electric_spark_mote",
    netSlotIndex: 72,
  },
  {
    creatureTypeId: "signal-dart",
    displayName: "Signal Dart",
    poolTier: "rare",
    elementType: "electric",
    rodRequired: "rare4",
    peakWonderGate: 40,
    lessonId: "2.4",
    moduleId: 2,
    visualMetaphor:
      "A fish that pulses a brief blue signal every few seconds, like a lighthouse in miniature",
    masteryTip:
      "Cooperation is built on reliable signals. The parent who is consistent creates a child who can relax.",
    illustrationAssetKey: "rare_electric_signal_dart",
    netSlotIndex: 73,
  },
  {
    creatureTypeId: "arc-scout",
    displayName: "Arc Scout",
    poolTier: "rare",
    elementType: "electric",
    rodRequired: "rare4",
    peakWonderGate: 40,
    lessonId: "2.8",
    moduleId: 2,
    visualMetaphor:
      "A fish that bounds in arcs above and below the surface, always landing exactly where it aimed",
    masteryTip:
      "Boundaries without threat have a clean arc: the boundary is stated, the consequence follows, and it ends there. No lectures. No lingering.",
    partnerEcho: "The arc always knows where it will land.",
    illustrationAssetKey: "rare_electric_arc_scout",
    netSlotIndex: 74,
  },
  {
    creatureTypeId: "volt-tender",
    displayName: "Volt Tender",
    poolTier: "rare",
    elementType: "electric",
    rodRequired: "rare4",
    peakWonderGate: 40,
    lessonId: "2.9",
    moduleId: 2,
    visualMetaphor: "A warm yellow fish that hums with gentle charge, only activating when touched",
    masteryTip:
      "Boundaries that remain tender are the ones children respect. Harshness teaches fear, not cooperation.",
    illustrationAssetKey: "rare_electric_volt_tender",
    netSlotIndex: 75,
  },
  {
    creatureTypeId: "resonance-fish",
    displayName: "Resonance Fish",
    poolTier: "rare",
    elementType: "electric",
    rodRequired: "rare4",
    peakWonderGate: 40,
    lessonId: "3.5",
    moduleId: 3,
    visualMetaphor:
      "A fish whose electric field creates standing wave patterns in the water around it",
    masteryTip:
      "Internal motivation resonates. You can hear it in a child who keeps going when nobody is watching. That sound was years in the making.",
    partnerEcho: "Real motivation creates its own field.",
    illustrationAssetKey: "rare_electric_resonance_fish",
    netSlotIndex: 76,
  },
  {
    creatureTypeId: "charge-keeper",
    displayName: "Charge Keeper",
    poolTier: "rare",
    elementType: "electric",
    rodRequired: "rare4",
    peakWonderGate: 40,
    lessonId: "4.2",
    moduleId: 4,
    visualMetaphor:
      "A capacitor-shaped fish that collects charge slowly over hours and releases it in one clear moment",
    masteryTip:
      "Children need full time to charge before they can reflect on failure. Pressing for the lesson too early discharges what hasn't yet been processed.",
    illustrationAssetKey: "rare_electric_charge_keeper",
    netSlotIndex: 77,
  },
  {
    creatureTypeId: "field-weaver",
    displayName: "Field Weaver",
    poolTier: "rare",
    elementType: "electric",
    rodRequired: "rare4",
    peakWonderGate: 40,
    lessonId: "5.1",
    moduleId: 5,
    visualMetaphor:
      "A fish that creates intricate invisible patterns in the water's electric field as it moves",
    masteryTip:
      "Identity is woven over years. The field weaver reminds us: every interaction contributes to the pattern, even the ones you don't notice.",
    partnerEcho: "The pattern is invisible until you step back far enough to see it.",
    illustrationAssetKey: "rare_electric_field_weaver",
    netSlotIndex: 78,
  },
  {
    creatureTypeId: "ground-pulse",
    displayName: "Ground Pulse",
    poolTier: "rare",
    elementType: "electric",
    rodRequired: "rare4",
    peakWonderGate: 40,
    lessonId: "3.6",
    moduleId: 3,
    visualMetaphor: "A fish that sends slow pulses through the pond floor, felt before it is seen",
    masteryTip:
      "Real-life scenarios: the grounded parent is felt before they are seen. Regulation travels through a room.",
    illustrationAssetKey: "rare_electric_ground_pulse",
    netSlotIndex: 79,
  },
  {
    creatureTypeId: "arc-tender",
    displayName: "Arc Tender",
    poolTier: "rare",
    elementType: "electric",
    rodRequired: "rare4",
    peakWonderGate: 40,
    lessonId: "2.1",
    moduleId: 2,
    visualMetaphor: "A gentle fish that produces contained, elegant arcs of light between its fins",
    masteryTip:
      "Daily integration: the arc between the lesson and the living is where the learning becomes real. Tend it daily.",
    illustrationAssetKey: "rare_electric_arc_tender",
    netSlotIndex: 80,
  },
  {
    creatureTypeId: "static-keeper",
    displayName: "Static Keeper",
    poolTier: "rare",
    elementType: "electric",
    rodRequired: "rare4",
    peakWonderGate: 40,
    lessonId: "4.6",
    moduleId: 4,
    visualMetaphor: "A fish surrounded by a visible halo of static charge that repels disturbance",
    masteryTip:
      "Real-life scenarios at module's end: the things you've learned have created a field around you. It is already affecting your child.",
    illustrationAssetKey: "rare_electric_static_keeper",
    netSlotIndex: 81,
  },
  {
    creatureTypeId: "fuse-swimmer",
    displayName: "Fuse Swimmer",
    poolTier: "rare",
    elementType: "electric",
    rodRequired: "rare4",
    peakWonderGate: 40,
    lessonId: "5.4",
    moduleId: 5,
    visualMetaphor: "A slow-burning fish that moves with the deliberate patience of a lit fuse",
    masteryTip:
      "Emotional stability under uncertainty is not instant. It is slow, deliberate, and deeply reliable.",
    illustrationAssetKey: "rare_electric_fuse_swimmer",
    netSlotIndex: 82,
  },
  {
    creatureTypeId: "bright-node",
    displayName: "Bright Node",
    poolTier: "rare",
    elementType: "electric",
    rodRequired: "rare4",
    peakWonderGate: 40,
    lessonId: "5.5",
    moduleId: 5,
    visualMetaphor:
      "A fish that acts as a node in a larger invisible network, brighter when connected",
    masteryTip:
      "Independent thinking in a child is supported by a parent who celebrates the disagreement rather than managing it.",
    illustrationAssetKey: "rare_electric_bright_node",
    netSlotIndex: 83,
  },
  {
    creatureTypeId: "current-arrow",
    displayName: "Current Arrow",
    poolTier: "rare",
    elementType: "electric",
    rodRequired: "rare4",
    peakWonderGate: 40,
    lessonId: "3.7",
    moduleId: 3,
    visualMetaphor:
      "A fish shaped exactly like an arrow, always pointing in the direction of greatest current",
    masteryTip:
      "Real-life scenarios: when in doubt, point toward connection. It is always the right current.",
    illustrationAssetKey: "rare_electric_current_arrow",
    netSlotIndex: 84,
  },
  {
    creatureTypeId: "zenith-mote",
    displayName: "Zenith Mote",
    poolTier: "rare",
    elementType: "electric",
    rodRequired: "rare4",
    peakWonderGate: 40,
    lessonId: "5.7",
    moduleId: 5,
    visualMetaphor:
      "A tiny fish at the very peak of the water column, charged with all the energy of the depth below",
    masteryTip:
      "Long-term integration: the energy of everything you've learned rises. The zenith mote is where it collects before becoming who you are.",
    partnerEcho: "Everything below it rises to meet it.",
    illustrationAssetKey: "rare_electric_zenith_mote",
    netSlotIndex: 85,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RARE ANY-ELEMENT — 14 creatures (slots 86–99)
  // Rod: Rare 5 (wildcard). Gate: 65W peak. Cross-theme, cross-element creatures.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    creatureTypeId: "prism-drifter",
    displayName: "Prism Drifter",
    poolTier: "rare",
    elementType: "any",
    rodRequired: "rare5",
    peakWonderGate: 65,
    lessonId: "1.1",
    moduleId: 1,
    visualMetaphor:
      "A fish that refracts all elements at once — fire, water, wind, electric all visible through its body",
    masteryTip:
      "When you understand emotional flooding, you begin to see it everywhere: in yourself, your child, your parents. The prism shows all colours at once.",
    partnerEcho: "All colours, all at once. None cancels the others.",
    illustrationAssetKey: "rare_any_prism_drifter",
    netSlotIndex: 86,
  },
  {
    creatureTypeId: "threshold-fish",
    displayName: "Threshold Fish",
    poolTier: "rare",
    elementType: "any",
    rodRequired: "rare5",
    peakWonderGate: 65,
    lessonId: "1.6",
    moduleId: 1,
    visualMetaphor:
      "A fish that exists precisely at the boundary between two depths, belonging to both",
    masteryTip:
      "High-stress scenarios are thresholds. The parent who recognises the doorway can choose how to cross it.",
    illustrationAssetKey: "rare_any_threshold_fish",
    netSlotIndex: 87,
  },
  {
    creatureTypeId: "double-current",
    displayName: "Double Current",
    poolTier: "rare",
    elementType: "any",
    rodRequired: "rare5",
    peakWonderGate: 65,
    lessonId: "2.3",
    moduleId: 2,
    visualMetaphor:
      "A fish that swims in two opposite directions simultaneously — one half, then the other, never splitting",
    masteryTip:
      "Connection before instruction holds two truths at once: I see you, and I still have to ask this of you.",
    illustrationAssetKey: "rare_any_double_current",
    netSlotIndex: 88,
  },
  {
    creatureTypeId: "compass-glide",
    displayName: "Compass Glide",
    poolTier: "rare",
    elementType: "any",
    rodRequired: "rare5",
    peakWonderGate: 65,
    lessonId: "2.8",
    moduleId: 2,
    visualMetaphor:
      "A fish with markings like compass points that always finds its way regardless of current",
    masteryTip:
      "Boundaries without threat work because they are oriented by values, not by emotion. The compass doesn't change because the water does.",
    partnerEcho: "True north doesn't shift with the weather.",
    illustrationAssetKey: "rare_any_compass_glide",
    netSlotIndex: 89,
  },
  {
    creatureTypeId: "convergence",
    displayName: "Convergence",
    poolTier: "rare",
    elementType: "any",
    rodRequired: "rare5",
    peakWonderGate: 65,
    lessonId: "3.4",
    moduleId: 3,
    visualMetaphor:
      "A fish that appears only where multiple different currents meet, thriving in complexity",
    masteryTip:
      "The motivation shift happens at a convergence: the moment external reward meets internal curiosity. The parent's job is to keep the space open until they meet.",
    illustrationAssetKey: "rare_any_convergence",
    netSlotIndex: 90,
  },
  {
    creatureTypeId: "deep-mirror",
    displayName: "Deep Mirror",
    poolTier: "rare",
    elementType: "any",
    rodRequired: "rare5",
    peakWonderGate: 65,
    lessonId: "3.5",
    moduleId: 3,
    visualMetaphor: "A fish whose scales reflect the entire pond back at you from a single angle",
    masteryTip:
      "Language that builds agency reflects the child's own capacity back to them before they can see it themselves.",
    illustrationAssetKey: "rare_any_deep_mirror",
    netSlotIndex: 91,
  },
  {
    creatureTypeId: "phase-swimmer",
    displayName: "Phase Swimmer",
    poolTier: "rare",
    elementType: "any",
    rodRequired: "rare5",
    peakWonderGate: 65,
    lessonId: "4.1",
    moduleId: 4,
    visualMetaphor:
      "A fish that moves through phases of visibility — solid, translucent, invisible, solid again",
    masteryTip:
      "The hidden cost of praise and pressure: a child under pressure moves in and out of their authentic self, depending on who is watching.",
    partnerEcho: "Real presence doesn't depend on who is watching.",
    illustrationAssetKey: "rare_any_phase_swimmer",
    netSlotIndex: 92,
  },
  {
    creatureTypeId: "echo-twin",
    displayName: "Echo Twin",
    poolTier: "rare",
    elementType: "any",
    rodRequired: "rare5",
    peakWonderGate: 65,
    lessonId: "4.3",
    moduleId: 4,
    visualMetaphor: "Two fish that move in perfect synchrony — always together, always distinct",
    masteryTip:
      "Emotional processing after failure is easier with a companion who doesn't try to fix, just stays. You are that companion for your child.",
    illustrationAssetKey: "rare_any_echo_twin",
    netSlotIndex: 93,
  },
  {
    creatureTypeId: "origin-spark",
    displayName: "Origin Spark",
    poolTier: "rare",
    elementType: "any",
    rodRequired: "rare5",
    peakWonderGate: 65,
    lessonId: "5.1",
    moduleId: 5,
    visualMetaphor:
      "A fish of uncertain origin — no element, no depth, no fixed colour — perpetually becoming",
    masteryTip:
      "Identity formation: the child is perpetually becoming. Your role is not to complete the picture but to hand them better brushes.",
    partnerEcho: "It isn't finished yet. Neither are they.",
    illustrationAssetKey: "rare_any_origin_spark",
    netSlotIndex: 94,
  },
  {
    creatureTypeId: "horizon-walker",
    displayName: "Horizon Walker",
    poolTier: "rare",
    elementType: "any",
    rodRequired: "rare5",
    peakWonderGate: 65,
    lessonId: "5.3",
    moduleId: 5,
    visualMetaphor: "A fish that swims along the exact line where light stops and depth begins",
    masteryTip:
      "Emotional stability under uncertainty: the parent who can stand at the horizon — not knowing what's coming, not afraid of it — teaches their child to do the same.",
    illustrationAssetKey: "rare_any_horizon_walker",
    netSlotIndex: 95,
  },
  {
    creatureTypeId: "memory-fish",
    displayName: "Memory Fish",
    poolTier: "rare",
    elementType: "any",
    rodRequired: "rare5",
    peakWonderGate: 65,
    lessonId: "5.4",
    moduleId: 5,
    visualMetaphor:
      "A fish that seems to remember every route it has ever swum, navigating by accumulated knowledge",
    masteryTip:
      "Independent thinking in a child is built on a rich memory of being listened to. Memory fish knows: every time you were heard, something was stored.",
    illustrationAssetKey: "rare_any_memory_fish",
    netSlotIndex: 96,
  },
  {
    creatureTypeId: "bridge-swimmer",
    displayName: "Bridge Swimmer",
    poolTier: "rare",
    elementType: "any",
    rodRequired: "rare5",
    peakWonderGate: 65,
    lessonId: "5.5",
    moduleId: 5,
    visualMetaphor:
      "A fish that spans two depth bands simultaneously, connecting what would otherwise not meet",
    masteryTip:
      'Meaning-driven motivation bridges the child\'s inner world to the outer one. The parent who asks "what matters to you?" builds that bridge.',
    illustrationAssetKey: "rare_any_bridge_swimmer",
    netSlotIndex: 97,
  },
  {
    creatureTypeId: "liminal-glide",
    displayName: "Liminal Glide",
    poolTier: "rare",
    elementType: "any",
    rodRequired: "rare5",
    peakWonderGate: 65,
    lessonId: "5.6",
    moduleId: 5,
    visualMetaphor:
      "A fish that exists between states — not quite surface, not quite deep, not quite any element",
    masteryTip:
      "Long-term integration lives in the liminal: between lesson and life, between intention and action, between knowing and being.",
    partnerEcho: "The in-between is where the real work happens.",
    illustrationAssetKey: "rare_any_liminal_glide",
    netSlotIndex: 98,
  },
  {
    creatureTypeId: "whole-current",
    displayName: "Whole Current",
    poolTier: "rare",
    elementType: "any",
    rodRequired: "rare5",
    peakWonderGate: 65,
    lessonId: "5.7",
    moduleId: 5,
    visualMetaphor:
      "A fish that moves the entire pond when it swims — all other currents respond to it",
    masteryTip:
      "When integration is complete, parenting is not a practice you do. It is the current you are. The whole pond moves with you.",
    partnerEcho: "When one thing becomes whole, everything else arranges around it.",
    illustrationAssetKey: "rare_any_whole_current",
    netSlotIndex: 99,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EPIC FIRE — 13 creatures (slots 100–112)
  // Rod: Epic 1. Gate: 90W peak. Deep emotional mastery, Module 3–5 themes.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    creatureTypeId: "magma-elder",
    displayName: "Magma Elder",
    poolTier: "epic",
    elementType: "fire",
    rodRequired: "epic1",
    peakWonderGate: 90,
    lessonId: "4.3",
    moduleId: 4,
    visualMetaphor:
      "A vast fish with cracked obsidian scales and deep orange light beneath, slow as continental drift",
    masteryTip:
      "How children interpret failure shapes their identity for decades. Your response in the hard moment is the lesson that outlasts the curriculum.",
    partnerEcho: "Deep things move slowly, but they move surely.",
    illustrationAssetKey: "epic_fire_magma_elder",
    netSlotIndex: 100,
  },
  {
    creatureTypeId: "pyrefish",
    displayName: "Pyrefish",
    poolTier: "epic",
    elementType: "fire",
    rodRequired: "epic1",
    peakWonderGate: 90,
    lessonId: "4.4",
    moduleId: 4,
    visualMetaphor:
      "A fish that burns from within, leaving the water measurably warmer where it passes",
    masteryTip:
      'Building reflection loops changes the temperature of your household. Small, consistent questions: "what did we learn?" "what would we do differently?"',
    illustrationAssetKey: "epic_fire_pyrefish",
    netSlotIndex: 101,
  },
  {
    creatureTypeId: "solarfin-sovereign",
    displayName: "Solarfin Sovereign",
    poolTier: "epic",
    elementType: "fire",
    rodRequired: "epic1",
    peakWonderGate: 90,
    lessonId: "5.2",
    moduleId: 5,
    visualMetaphor:
      "An enormous creature ringed by orbiting light fragments, older than the garden",
    masteryTip:
      "The language that shapes identity is not dramatic. It's the ten thousand ordinary sentences spoken at ordinary moments. These are the rings.",
    partnerEcho: "The oldest light is the steadiest.",
    illustrationAssetKey: "epic_fire_solarfin_sovereign",
    netSlotIndex: 102,
  },
  {
    creatureTypeId: "crucible-fish",
    displayName: "Crucible Fish",
    poolTier: "epic",
    elementType: "fire",
    rodRequired: "epic1",
    peakWonderGate: 90,
    lessonId: "3.4",
    moduleId: 3,
    visualMetaphor:
      "A fish shaped exactly like a crucible — a container for intense heat that transforms what is held inside",
    masteryTip:
      "The motivation shift happens inside the crucible of genuine challenge. A child who has never struggled has never had the chance to discover what they are made of.",
    illustrationAssetKey: "epic_fire_crucible_fish",
    netSlotIndex: 103,
  },
  {
    creatureTypeId: "phoenix-ray",
    displayName: "Phoenix Ray",
    poolTier: "epic",
    elementType: "fire",
    rodRequired: "epic1",
    peakWonderGate: 90,
    lessonId: "4.1",
    moduleId: 4,
    visualMetaphor: "A flat, manta-shaped fire creature that rises from darkness at the pond floor",
    masteryTip:
      "The hidden cost of pressure reveals itself in the teenager who cannot tolerate being wrong. The phoenix ray shows what is possible after the pressure lifts: full emergence.",
    illustrationAssetKey: "epic_fire_phoenix_ray",
    netSlotIndex: 104,
  },
  {
    creatureTypeId: "deep-ember",
    displayName: "Deep Ember",
    poolTier: "epic",
    elementType: "fire",
    rodRequired: "epic1",
    peakWonderGate: 90,
    lessonId: "3.1",
    moduleId: 3,
    visualMetaphor:
      "An ember that has sunk to the deepest point and still glows, cold water unable to extinguish it",
    masteryTip:
      "The cost of praise and pressure: the deep ember is what survives. A child whose inner motivation has been carefully tended cannot be extinguished by outcomes.",
    illustrationAssetKey: "epic_fire_deep_ember",
    netSlotIndex: 105,
  },
  {
    creatureTypeId: "furnace-elder",
    displayName: "Furnace Elder",
    poolTier: "epic",
    elementType: "fire",
    rodRequired: "epic1",
    peakWonderGate: 90,
    lessonId: "4.2",
    moduleId: 4,
    visualMetaphor:
      "An ancient furnace-shaped fish that creates heat through stillness rather than movement",
    masteryTip:
      "How children interpret failure: the furnace elder creates heat by holding, not by burning. Sometimes the most powerful response is simply staying present.",
    illustrationAssetKey: "epic_fire_furnace_elder",
    netSlotIndex: 106,
  },
  {
    creatureTypeId: "corona-wraith",
    displayName: "Corona Wraith",
    poolTier: "epic",
    elementType: "fire",
    rodRequired: "epic1",
    peakWonderGate: 90,
    lessonId: "5.1",
    moduleId: 5,
    visualMetaphor:
      "A fish surrounded by a permanent corona, like a total solar eclipse made animate",
    masteryTip:
      "Identity formation at depth: a child with a secure sense of self has an inner corona. External events cannot eclipse what is established at the centre.",
    partnerEcho: "What is at the centre holds, even when the light changes.",
    illustrationAssetKey: "epic_fire_corona_wraith",
    netSlotIndex: 107,
  },
  {
    creatureTypeId: "inferno-calm",
    displayName: "Inferno Calm",
    poolTier: "epic",
    elementType: "fire",
    rodRequired: "epic1",
    peakWonderGate: 90,
    lessonId: "1.6",
    moduleId: 1,
    visualMetaphor:
      "A creature of immense fire energy that moves with absolute, paradoxical stillness",
    masteryTip:
      "High-stress scenarios mastered: the parent who has worked through their own regulation carries the paradox — full capacity for intensity, full choice about how to move.",
    illustrationAssetKey: "epic_fire_inferno_calm",
    netSlotIndex: 108,
  },
  {
    creatureTypeId: "forge-sovereign",
    displayName: "Forge Sovereign",
    poolTier: "epic",
    elementType: "fire",
    rodRequired: "epic1",
    peakWonderGate: 90,
    lessonId: "5.5",
    moduleId: 5,
    visualMetaphor:
      "The master of the forge — a fish that creates, rather than reflects, its environment",
    masteryTip:
      "Meaning-driven motivation at its fullest: the child who has found their forge shapes their world rather than being shaped by it.",
    illustrationAssetKey: "epic_fire_forge_sovereign",
    netSlotIndex: 109,
  },
  {
    creatureTypeId: "stellar-drifter",
    displayName: "Stellar Drifter",
    poolTier: "epic",
    elementType: "fire",
    rodRequired: "epic1",
    peakWonderGate: 90,
    lessonId: "3.9",
    moduleId: 3,
    visualMetaphor:
      "A vast, slow fire creature that drifts with the gravity of stars, leaving warmth everywhere",
    masteryTip:
      "Real-life scenarios at depth: you have rehearsed enough now that the warmth is automatic. The stellar drifter doesn't try to be warm. It just is.",
    illustrationAssetKey: "epic_fire_stellar_drifter",
    netSlotIndex: 110,
  },
  {
    creatureTypeId: "radiance-keeper",
    displayName: "Radiance Keeper",
    poolTier: "epic",
    elementType: "fire",
    rodRequired: "epic1",
    peakWonderGate: 90,
    lessonId: "5.3",
    moduleId: 5,
    visualMetaphor: "A fish that stores light from the surface and releases it slowly in darkness",
    masteryTip:
      "Emotional stability under uncertainty: the radiance keeper stores light in good times and releases it when darkness comes. The practice builds the reservoir.",
    illustrationAssetKey: "epic_fire_radiance_keeper",
    netSlotIndex: 111,
  },
  {
    creatureTypeId: "prime-flame",
    displayName: "Prime Flame",
    poolTier: "epic",
    elementType: "fire",
    rodRequired: "epic1",
    peakWonderGate: 90,
    lessonId: "5.7",
    moduleId: 5,
    visualMetaphor:
      "The oldest fire creature in the pond — a flame so old it has become cool light",
    masteryTip:
      "Long-term integration of fire: the parent who has fully integrated regulation no longer has to manage their emotions. They have become them.",
    partnerEcho: "Old enough to be cool. Steady enough to be trusted.",
    illustrationAssetKey: "epic_fire_prime_flame",
    netSlotIndex: 112,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EPIC WATER — 13 creatures (slots 113–125)
  // Rod: Epic 2. Gate: 90W peak. Deep relational mastery, identity, long arc.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    creatureTypeId: "abyssal-calm",
    displayName: "Abyssal Calm",
    poolTier: "epic",
    elementType: "water",
    rodRequired: "epic2",
    peakWonderGate: 90,
    lessonId: "4.5",
    moduleId: 4,
    visualMetaphor: "A fish of absolute depth-blue that creates stillness in everything it passes",
    masteryTip:
      "Real-life scenarios fully integrated: the abyssal calm is not the absence of difficulty. It is a parent who can hold the difficulty without being changed by it.",
    partnerEcho: "The deepest water is the quietest.",
    illustrationAssetKey: "epic_water_abyssal_calm",
    netSlotIndex: 113,
  },
  {
    creatureTypeId: "tidal-elder",
    displayName: "Tidal Elder",
    poolTier: "epic",
    elementType: "water",
    rodRequired: "epic2",
    peakWonderGate: 90,
    lessonId: "5.4",
    moduleId: 5,
    visualMetaphor:
      "A vast creature whose movement reshapes the pond floor, slow and inevitable as tide",
    masteryTip:
      "Emotional stability under uncertainty at its fullest: the parent whose groundedness is geological. Not unchanging, but deeply reliable.",
    illustrationAssetKey: "epic_water_tidal_elder",
    netSlotIndex: 114,
  },
  {
    creatureTypeId: "origin-leviathan",
    displayName: "Origin Leviathan",
    poolTier: "epic",
    elementType: "water",
    rodRequired: "epic2",
    peakWonderGate: 90,
    lessonId: "5.7",
    moduleId: 5,
    visualMetaphor: "The oldest water creature — so large the pond accommodates itself around it",
    masteryTip:
      "Long-term integration: when what you've learned is no longer \"what you've learned\" but simply how you are. The leviathan doesn't swim the pond. The pond is its nature.",
    partnerEcho: "Some things are too old to be hurried.",
    illustrationAssetKey: "epic_water_origin_leviathan",
    netSlotIndex: 115,
  },
  {
    creatureTypeId: "deep-tide",
    displayName: "Deep Tide",
    poolTier: "epic",
    elementType: "water",
    rodRequired: "epic2",
    peakWonderGate: 90,
    lessonId: "1.3",
    moduleId: 1,
    visualMetaphor:
      "A tide-force creature felt from hundreds of feet below — a pull, not a presence",
    masteryTip:
      "Co-regulation at its deepest: you do not have to do anything visible. Your calm is a tide. It moves your child from below.",
    illustrationAssetKey: "epic_water_deep_tide",
    netSlotIndex: 116,
  },
  {
    creatureTypeId: "ancient-mirror",
    displayName: "Ancient Mirror",
    poolTier: "epic",
    elementType: "water",
    rodRequired: "epic2",
    peakWonderGate: 90,
    lessonId: "1.4",
    moduleId: 1,
    visualMetaphor: "A fish so old its scales reflect not what is in front of it but what was",
    masteryTip:
      "Co-regulation at depth: the parent who has learned to mirror recognises their own nervous system in their child's. This is the deepest empathy.",
    illustrationAssetKey: "epic_water_ancient_mirror",
    netSlotIndex: 117,
  },
  {
    creatureTypeId: "source-swimmer",
    displayName: "Source Swimmer",
    poolTier: "epic",
    elementType: "water",
    rodRequired: "epic2",
    peakWonderGate: 90,
    lessonId: "2.3",
    moduleId: 2,
    visualMetaphor: "A fish that swims against all currents toward the source — upstream, always",
    masteryTip:
      "Connection at depth: the parent who chooses connection even when it is inconvenient, even when it is not returned, is swimming to the source.",
    illustrationAssetKey: "epic_water_source_swimmer",
    netSlotIndex: 118,
  },
  {
    creatureTypeId: "bedrock-blue",
    displayName: "Bedrock Blue",
    poolTier: "epic",
    elementType: "water",
    rodRequired: "epic2",
    peakWonderGate: 90,
    lessonId: "2.7",
    moduleId: 2,
    visualMetaphor:
      "A creature that rests on the pond floor, immovable, the foundation of everything above",
    masteryTip:
      "Daily integration at depth: the bedrock is not glamorous. It is the consistent, invisible work that holds everything.",
    partnerEcho: "The most important things are the ones you don't notice because they never move.",
    illustrationAssetKey: "epic_water_bedrock_blue",
    netSlotIndex: 119,
  },
  {
    creatureTypeId: "estuary-sage",
    displayName: "Estuary Sage",
    poolTier: "epic",
    elementType: "water",
    rodRequired: "epic2",
    peakWonderGate: 90,
    lessonId: "3.8",
    moduleId: 3,
    visualMetaphor:
      "A creature that lives at the estuary — where river meets sea — navigating both without effort",
    masteryTip:
      "Reducing resistance at depth: the estuary sage has learned both grammars. It doesn't fight the transition. It becomes bilingual.",
    illustrationAssetKey: "epic_water_estuary_sage",
    netSlotIndex: 120,
  },
  {
    creatureTypeId: "pressure-drifter",
    displayName: "Pressure Drifter",
    poolTier: "epic",
    elementType: "water",
    rodRequired: "epic2",
    peakWonderGate: 90,
    lessonId: "4.1",
    moduleId: 4,
    visualMetaphor: "A deep-water fish built for pressure, more itself the deeper it goes",
    masteryTip:
      "The hidden cost of pressure inverted: the parent who has processed their own pressure history no longer transmits it. The pressure drifter is built for depth, not broken by it.",
    illustrationAssetKey: "epic_water_pressure_drifter",
    netSlotIndex: 121,
  },
  {
    creatureTypeId: "void-swimmer",
    displayName: "Void Swimmer",
    poolTier: "epic",
    elementType: "water",
    rodRequired: "epic2",
    peakWonderGate: 90,
    lessonId: "5.1",
    moduleId: 5,
    visualMetaphor:
      "A fish that navigates deepest darkness without light, oriented by memory and magnetism",
    masteryTip:
      "Identity at depth: a child with a stable sense of self can navigate darkness without external light. You built that compass.",
    illustrationAssetKey: "epic_water_void_swimmer",
    netSlotIndex: 122,
  },
  {
    creatureTypeId: "undertow-sage",
    displayName: "Undertow Sage",
    poolTier: "epic",
    elementType: "water",
    rodRequired: "epic2",
    peakWonderGate: 90,
    lessonId: "5.2",
    moduleId: 5,
    visualMetaphor:
      "A fish that moves beneath all visible currents, shaping them without being seen",
    masteryTip:
      "The language that shapes identity shapes the undertow. What you say consistently enough creates the current your child swims in for life.",
    illustrationAssetKey: "epic_water_undertow_sage",
    netSlotIndex: 123,
  },
  {
    creatureTypeId: "stillwater-elder",
    displayName: "Stillwater Elder",
    poolTier: "epic",
    elementType: "water",
    rodRequired: "epic2",
    peakWonderGate: 90,
    lessonId: "5.6",
    moduleId: 5,
    visualMetaphor:
      "The oldest still-water creature — its presence makes the whole pond more itself",
    masteryTip:
      "Meaning-driven motivation fully integrated: the stillwater elder does not seek to be noticed. Its depth makes the water worthwhile.",
    partnerEcho: "Some presences change everything around them just by being.",
    illustrationAssetKey: "epic_water_stillwater_elder",
    netSlotIndex: 124,
  },
  {
    creatureTypeId: "first-tide",
    displayName: "First Tide",
    poolTier: "epic",
    elementType: "water",
    rodRequired: "epic2",
    peakWonderGate: 90,
    lessonId: "5.7",
    moduleId: 5,
    visualMetaphor:
      "The original tide-creature — ancestor of all water in the garden, slow beyond reckoning",
    masteryTip:
      "Long-term integration of water: co-regulation becomes relationship. Relationship becomes culture. Culture becomes how your family moves through the world.",
    illustrationAssetKey: "epic_water_first_tide",
    netSlotIndex: 125,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EPIC WIND — 12 creatures (slots 126–137)
  // Rod: Epic 3. Gate: 90W peak. Deep language, identity, meaning mastery.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    creatureTypeId: "gale-witness",
    displayName: "Gale Witness",
    poolTier: "epic",
    elementType: "wind",
    rodRequired: "epic3",
    peakWonderGate: 90,
    lessonId: "4.6",
    moduleId: 4,
    visualMetaphor:
      "A fish that holds perfectly still facing the strongest current — not fighting, witnessing",
    masteryTip:
      "Building reflection loops: the gale witness does not run from difficulty. It turns toward it, witnesses it, and stays.",
    illustrationAssetKey: "epic_wind_gale_witness",
    netSlotIndex: 126,
  },
  {
    creatureTypeId: "storm-anchor",
    displayName: "Storm Anchor",
    poolTier: "epic",
    elementType: "wind",
    rodRequired: "epic3",
    peakWonderGate: 90,
    lessonId: "5.3",
    moduleId: 5,
    visualMetaphor: "A deep, dense fish that holds the pond in place when everything else moves",
    masteryTip:
      "Independent thinking at depth: the child anchored in their own values does not move when the storm insists they should. You built the anchor.",
    partnerEcho: "The anchor doesn't stop the storm. It keeps what matters still.",
    illustrationAssetKey: "epic_wind_storm_anchor",
    netSlotIndex: 127,
  },
  {
    creatureTypeId: "sky-sovereign",
    displayName: "Sky Sovereign",
    poolTier: "epic",
    elementType: "wind",
    rodRequired: "epic3",
    peakWonderGate: 90,
    lessonId: "5.6",
    moduleId: 5,
    visualMetaphor: "A vast, ethereal creature whose breathing is the pond's breathing",
    masteryTip:
      "Meaning-driven motivation fully integrated: the sky sovereign doesn't pursue meaning. It is the medium through which meaning moves.",
    partnerEcho: "To move everything, be still at the centre.",
    illustrationAssetKey: "epic_wind_sky_sovereign",
    netSlotIndex: 128,
  },
  {
    creatureTypeId: "elder-breath",
    displayName: "Elder Breath",
    poolTier: "epic",
    elementType: "wind",
    rodRequired: "epic3",
    peakWonderGate: 90,
    lessonId: "1.2",
    moduleId: 1,
    visualMetaphor:
      "The first breath that was ever breathed into a child — now a creature of vast, gentle power",
    masteryTip:
      "The infant brain at depth: the parent who truly understands early development holds a different kind of patience. Not tolerance. Genuine understanding.",
    illustrationAssetKey: "epic_wind_elder_breath",
    netSlotIndex: 129,
  },
  {
    creatureTypeId: "word-root",
    displayName: "Word Root",
    poolTier: "epic",
    elementType: "wind",
    rodRequired: "epic3",
    peakWonderGate: 90,
    lessonId: "3.5",
    moduleId: 3,
    visualMetaphor: "A fish shaped like a tree root, language and growth made aquatic",
    masteryTip:
      "Language that builds agency at depth: the words you have given your child are the roots. They hold even when the visible parts sway.",
    illustrationAssetKey: "epic_wind_word_root",
    netSlotIndex: 130,
  },
  {
    creatureTypeId: "voice-elder",
    displayName: "Voice Elder",
    poolTier: "epic",
    elementType: "wind",
    rodRequired: "epic3",
    peakWonderGate: 90,
    lessonId: "5.2",
    moduleId: 5,
    visualMetaphor:
      "A fish of great age whose passage makes the water carry voices across impossible distances",
    masteryTip:
      "The language that shapes identity at depth: the voice elder's words travel further than it knows. So do yours.",
    partnerEcho: "Your voice is still travelling. Somewhere, it's arriving right now.",
    illustrationAssetKey: "epic_wind_voice_elder",
    netSlotIndex: 131,
  },
  {
    creatureTypeId: "fracture-calm",
    displayName: "Fracture Calm",
    poolTier: "epic",
    elementType: "wind",
    rodRequired: "epic3",
    peakWonderGate: 90,
    lessonId: "4.1",
    moduleId: 4,
    visualMetaphor:
      "A fish that exists in the fractured silence after a storm — the specific calm after pressure releases",
    masteryTip:
      "The hidden cost of praise at depth: the fracture calm shows what remains after the pressure finally lifts. Not damage. Possibility.",
    illustrationAssetKey: "epic_wind_fracture_calm",
    netSlotIndex: 132,
  },
  {
    creatureTypeId: "resonance-elder",
    displayName: "Resonance Elder",
    poolTier: "epic",
    elementType: "wind",
    rodRequired: "epic3",
    peakWonderGate: 90,
    lessonId: "4.4",
    moduleId: 4,
    visualMetaphor:
      "A creature whose resonance has deepened through years until it now vibrates at the frequency of the pond itself",
    masteryTip:
      "Reflection loops at depth: the parent who has sustained them long enough notices the child beginning to maintain their own. The resonance has transferred.",
    illustrationAssetKey: "epic_wind_resonance_elder",
    netSlotIndex: 133,
  },
  {
    creatureTypeId: "canopy-sovereign",
    displayName: "Canopy Sovereign",
    poolTier: "epic",
    elementType: "wind",
    rodRequired: "epic3",
    peakWonderGate: 90,
    lessonId: "3.9",
    moduleId: 3,
    visualMetaphor:
      "The oldest canopy creature — wide as the whole surface, a living roof for everything below",
    masteryTip:
      "Real-life scenarios mastered: the canopy sovereign has learned every weather. It shelters not by avoiding but by covering.",
    illustrationAssetKey: "epic_wind_canopy_sovereign",
    netSlotIndex: 134,
  },
  {
    creatureTypeId: "breath-sovereign",
    displayName: "Breath Sovereign",
    poolTier: "epic",
    elementType: "wind",
    rodRequired: "epic3",
    peakWonderGate: 90,
    lessonId: "5.7",
    moduleId: 5,
    visualMetaphor:
      "The creature that holds all breath — first breath, last breath, everything between",
    masteryTip:
      "Long-term integration of wind: language has become care. Agency has become the air the child breathes. You breathed it first.",
    illustrationAssetKey: "epic_wind_breath_sovereign",
    netSlotIndex: 135,
  },
  {
    creatureTypeId: "gust-sovereign",
    displayName: "Gust Sovereign",
    poolTier: "epic",
    elementType: "wind",
    rodRequired: "epic3",
    peakWonderGate: 90,
    lessonId: "5.4",
    moduleId: 5,
    visualMetaphor:
      "A vast wind creature that moves the entire depth of the pond with one slow turn",
    masteryTip:
      "Emotional stability under uncertainty mastered: the gust sovereign moves the whole pond. Not violently. Completely.",
    illustrationAssetKey: "epic_wind_gust_sovereign",
    netSlotIndex: 136,
  },
  {
    creatureTypeId: "deepwind-elder",
    displayName: "Deepwind Elder",
    poolTier: "epic",
    elementType: "wind",
    rodRequired: "epic3",
    peakWonderGate: 90,
    lessonId: "5.1",
    moduleId: 5,
    visualMetaphor:
      "An ancient wind creature at the deepest point — wind that has never touched the surface",
    masteryTip:
      "Identity at depth: the child whose identity has been formed with care has wind in their deepest places — untouched by what the surface thinks of them.",
    partnerEcho: "What is at the deepest place is the realest place.",
    illustrationAssetKey: "epic_wind_deepwind_elder",
    netSlotIndex: 137,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EPIC ELECTRIC — 12 creatures (slots 138–149)
  // Rod: Epic 4. Gate: 90W peak. Deepest cooperation, independence, long-term integration.
  // ═══════════════════════════════════════════════════════════════════════════

  {
    creatureTypeId: "lightning-elder",
    displayName: "Lightning Elder",
    poolTier: "epic",
    elementType: "electric",
    rodRequired: "epic4",
    peakWonderGate: 90,
    lessonId: "5.5",
    moduleId: 5,
    visualMetaphor:
      "A vast electric creature that generates slow, beautiful arcs across the pond floor",
    masteryTip:
      "Independent thinking at its fullest: a child who disagrees with a parent and knows they are still loved. You built the circuit that can hold that charge.",
    partnerEcho: "The biggest electricity is the slowest.",
    illustrationAssetKey: "epic_electric_lightning_elder",
    netSlotIndex: 138,
  },
  {
    creatureTypeId: "aurora-wraith",
    displayName: "Aurora Wraith",
    poolTier: "epic",
    elementType: "electric",
    rodRequired: "epic4",
    peakWonderGate: 90,
    lessonId: "5.6",
    moduleId: 5,
    visualMetaphor:
      "A creature that cycles through all electric colours, never fixed, always becoming",
    masteryTip:
      "Meaning-driven motivation at depth: the aurora wraith finds its meaning in movement, not destination. So does a child with genuine intrinsic drive.",
    illustrationAssetKey: "epic_electric_aurora_wraith",
    netSlotIndex: 139,
  },
  {
    creatureTypeId: "zenith-sovereign",
    displayName: "Zenith Sovereign",
    poolTier: "epic",
    elementType: "electric",
    rodRequired: "epic4",
    peakWonderGate: 90,
    lessonId: "5.7",
    moduleId: 5,
    visualMetaphor:
      "A being of pure coherent light at the deepest point, absolutely still, absolutely present",
    masteryTip:
      "Long-term integration of electric: when what you've learned becomes how you love. The zenith is not a destination. It's a direction.",
    partnerEcho: "The deepest light doesn't flicker.",
    illustrationAssetKey: "epic_electric_zenith_sovereign",
    netSlotIndex: 149,
  },
  {
    creatureTypeId: "network-elder",
    displayName: "Network Elder",
    poolTier: "epic",
    elementType: "electric",
    rodRequired: "epic4",
    peakWonderGate: 90,
    lessonId: "5.1",
    moduleId: 5,
    visualMetaphor:
      "A creature at the centre of an invisible network — every other creature in the deep faintly responds to it",
    masteryTip:
      "Identity at depth is relational: your child's sense of self is formed in a network. Every node you've tended has strengthened the whole.",
    illustrationAssetKey: "epic_electric_network_elder",
    netSlotIndex: 140,
  },
  {
    creatureTypeId: "deep-circuit",
    displayName: "Deep Circuit",
    poolTier: "epic",
    elementType: "electric",
    rodRequired: "epic4",
    peakWonderGate: 90,
    lessonId: "2.2",
    moduleId: 2,
    visualMetaphor: "A complete circuit creature — no open ends, no loose charge, deeply whole",
    masteryTip:
      "Control fully released: the deep circuit is whole without external management. The child who has been trusted with their own agency eventually becomes one.",
    illustrationAssetKey: "epic_electric_deep_circuit",
    netSlotIndex: 141,
  },
  {
    creatureTypeId: "quiet-charge",
    displayName: "Quiet Charge",
    poolTier: "epic",
    elementType: "electric",
    rodRequired: "epic4",
    peakWonderGate: 90,
    lessonId: "2.4",
    moduleId: 2,
    visualMetaphor: "A fish that carries enormous charge invisibly, showing nothing on the surface",
    masteryTip:
      "Cooperation at depth: the parent whose energy is managed and directed creates a child who learns the same. The charge is enormous. The quiet is chosen.",
    illustrationAssetKey: "epic_electric_quiet_charge",
    netSlotIndex: 142,
  },
  {
    creatureTypeId: "grid-sovereign",
    displayName: "Grid Sovereign",
    poolTier: "epic",
    elementType: "electric",
    rodRequired: "epic4",
    peakWonderGate: 90,
    lessonId: "3.5",
    moduleId: 3,
    visualMetaphor:
      "The oldest electric creature — the grid from which all other electric life in the pond draws power",
    masteryTip:
      "Motivation shift at its fullest: the grid sovereign doesn't need to be plugged in. It is the source. This is what intrinsic motivation looks like at its deepest.",
    partnerEcho: "Everything that lights up here draws from the same source.",
    illustrationAssetKey: "epic_electric_grid_sovereign",
    netSlotIndex: 143,
  },
  {
    creatureTypeId: "field-sovereign",
    displayName: "Field Sovereign",
    poolTier: "epic",
    elementType: "electric",
    rodRequired: "epic4",
    peakWonderGate: 90,
    lessonId: "5.2",
    moduleId: 5,
    visualMetaphor:
      "A creature whose electric field now encompasses the whole pond — it is indistinguishable from the water itself",
    masteryTip:
      "The language that shapes identity, fully integrated: the field sovereign's words are the water now. The child swims in what you said.",
    illustrationAssetKey: "epic_electric_field_sovereign",
    netSlotIndex: 144,
  },
  {
    creatureTypeId: "arc-sovereign",
    displayName: "Arc Sovereign",
    poolTier: "epic",
    elementType: "electric",
    rodRequired: "epic4",
    peakWonderGate: 90,
    lessonId: "2.6",
    moduleId: 2,
    visualMetaphor:
      "The master of arcs — each one deliberate, beautiful, and landing exactly as intended",
    masteryTip:
      "Boundaries without threat, fully mastered: the arc sovereign's boundaries are so clear and so consistent they are no longer even noticed. They simply are.",
    illustrationAssetKey: "epic_electric_arc_sovereign",
    netSlotIndex: 145,
  },
  {
    creatureTypeId: "coherence-fish",
    displayName: "Coherence Fish",
    poolTier: "epic",
    elementType: "electric",
    rodRequired: "epic4",
    peakWonderGate: 90,
    lessonId: "4.4",
    moduleId: 4,
    visualMetaphor:
      "A fish whose entire electric output is coherent — all frequencies aligned, all energy unified",
    masteryTip:
      "Reflection loops fully integrated: the coherent parent models reflection without announcing it. The child absorbs the practice because it is simply what the family does.",
    illustrationAssetKey: "epic_electric_coherence_fish",
    netSlotIndex: 146,
  },
  {
    creatureTypeId: "resonant-sovereign",
    displayName: "Resonant Sovereign",
    poolTier: "epic",
    elementType: "electric",
    rodRequired: "epic4",
    peakWonderGate: 90,
    lessonId: "4.6",
    moduleId: 4,
    visualMetaphor:
      "A creature whose resonant frequency matches the deepest natural frequency of the pond itself",
    masteryTip:
      "Real-life scenarios mastered: the resonant sovereign no longer has to think about the lesson. The response is the frequency of its being.",
    illustrationAssetKey: "epic_electric_resonant_sovereign",
    netSlotIndex: 147,
  },
  {
    creatureTypeId: "deep-signal",
    displayName: "Deep Signal",
    poolTier: "epic",
    elementType: "electric",
    rodRequired: "epic4",
    peakWonderGate: 90,
    lessonId: "5.3",
    moduleId: 5,
    visualMetaphor:
      "A signal sent from the deepest point that takes years to arrive at the surface — but always arrives",
    masteryTip:
      "Emotional stability under uncertainty fully integrated: the signal was sent long ago. Your child is receiving it now, and will keep receiving it.",
    partnerEcho: "What you sent is still travelling. It will arrive when it's needed.",
    illustrationAssetKey: "epic_electric_deep_signal",
    netSlotIndex: 148,
  },
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

export const CREATURE_BY_ID = Object.fromEntries(
  CREATURES.map((c) => [c.creatureTypeId, c]),
) as Record<string, Creature>;

export const POOL = {
  common: CREATURES.filter((c) => c.poolTier === "common"),
  rarefire: CREATURES.filter((c) => c.poolTier === "rare" && c.elementType === "fire"),
  rarewater: CREATURES.filter((c) => c.poolTier === "rare" && c.elementType === "water"),
  rarewind: CREATURES.filter((c) => c.poolTier === "rare" && c.elementType === "wind"),
  rareelectric: CREATURES.filter((c) => c.poolTier === "rare" && c.elementType === "electric"),
  rareany: CREATURES.filter((c) => c.poolTier === "rare" && c.elementType === "any"),
  epicfire: CREATURES.filter((c) => c.poolTier === "epic" && c.elementType === "fire"),
  epicwater: CREATURES.filter((c) => c.poolTier === "epic" && c.elementType === "water"),
  epicwind: CREATURES.filter((c) => c.poolTier === "epic" && c.elementType === "wind"),
  epicelectric: CREATURES.filter((c) => c.poolTier === "epic" && c.elementType === "electric"),
};

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
  if (valid) console.log(`✓ All 10 pools validated. Total: ${CREATURES.length} creatures.`);
}

/** Select the next fishing candidate with duplicate-avoidance */
export function selectCandidate(pool: Creature[], caughtIds: Set<string>): Creature {
  const unseen = pool.filter((c) => !caughtIds.has(c.creatureTypeId));
  const candidates = unseen.length > 0 ? unseen : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Compute catch chance at claim time */
export function catchChance(
  poolTier: PoolTier,
  elementType: ElementType,
  currentWonder: number,
  hasBait: boolean,
): number {
  const r =
    elementType === "any"
      ? ENCOUNTER_RATES.rareAny
      : poolTier === "common"
        ? ENCOUNTER_RATES.common
        : poolTier === "rare"
          ? ENCOUNTER_RATES.rareElement
          : ENCOUNTER_RATES.epicElement;
  const bonus = Math.min(currentWonder / r.wonderDivisor, r.maxNoBait - r.base);
  const base = Math.min(r.base + bonus, r.maxNoBait);
  return hasBait ? Math.min(base + r.baitBonus, r.maxWithBait) : base;
}

/** Returns duplicate or miss consolation based on outcome */
export function consolationReward(
  poolTier: PoolTier,
  isDuplicate: boolean,
): { materials: number; wonder: number; spiritEcho?: boolean } {
  if (!isDuplicate)
    return MISS_CONSOLATION[poolTier as keyof typeof MISS_CONSOLATION] as {
      materials: number;
      wonder: number;
    };
  return DUPLICATE_CONSOLATION[poolTier as keyof typeof DUPLICATE_CONSOLATION] as {
    materials: number;
    wonder: number;
    spiritEcho?: boolean;
  };
}
