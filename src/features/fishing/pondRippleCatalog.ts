/** Static catalog composition for Pond Ripple — not live cast odds. */

import { POOL } from "@/src/data/creatures/helpers";

export type PondRippleDisplayTier = "empty" | "common" | "rare" | "epic";

export type PondRippleCreatureTier = "common" | "rare" | "epic";

export type PondRippleActiveTier = "free" | "wooden" | "fiberglass" | "lifetime";

/**
 * Lifetime unlocks all three catalog bands (same as Fiberglass).
 * Product: gate full `catalogRarityRingUi` allowlist rollout on on9 confirmation
 * that this is intentional — do not flip the flag to `all` without that note.
 */
export const LIFETIME_UNLOCKS_ALL_CATALOG_BANDS = true as const;

/** Decorative “empty water” share — not live ENCOUNTER_RATES miss %. */
export const POND_RIPPLE_EMPTY_SHARE = 0.2;

/** Remaining circle filled by catalog creature bands. */
export const POND_RIPPLE_CATCH_SHARE = 1 - POND_RIPPLE_EMPTY_SHARE;

/** Live catalog poolTier counts (150 creatures) — SSoT for creature-band proportions. */
export const POND_RIPPLE_CATALOG_COUNTS = {
  common: 30,
  rare: 70,
  epic: 50,
  total: 150,
} as const;

/** Catalog-only fractions (sum to 1) — used before scaling into CATCH_SHARE. */
export const POND_RIPPLE_CATALOG_FRACTIONS = {
  common: POND_RIPPLE_CATALOG_COUNTS.common / POND_RIPPLE_CATALOG_COUNTS.total,
  rare: POND_RIPPLE_CATALOG_COUNTS.rare / POND_RIPPLE_CATALOG_COUNTS.total,
  epic: POND_RIPPLE_CATALOG_COUNTS.epic / POND_RIPPLE_CATALOG_COUNTS.total,
} as const;

/** Full-circle display ratios (empty + scaled catalog). Sum to 1. */
export const POND_RIPPLE_RATIOS = {
  empty: POND_RIPPLE_EMPTY_SHARE,
  common: POND_RIPPLE_CATALOG_FRACTIONS.common * POND_RIPPLE_CATCH_SHARE,
  rare: POND_RIPPLE_CATALOG_FRACTIONS.rare * POND_RIPPLE_CATCH_SHARE,
  epic: POND_RIPPLE_CATALOG_FRACTIONS.epic * POND_RIPPLE_CATCH_SHARE,
} as const;

/** Outer → inner illuminate order (epic outermost, miss/empty innermost). Width ratios unchanged. */
export const POND_RIPPLE_BAND_ORDER: PondRippleDisplayTier[] = ["epic", "rare", "common", "empty"];

/** Creature bands only (subscription unlock axis). */
export const POND_RIPPLE_CREATURE_BAND_ORDER: PondRippleCreatureTier[] = ["common", "rare", "epic"];

/**
 * Radial stroke widths proportional to full-circle ratios (thickness = share).
 * Sum equals STROKE_BUDGET — used by CatalogRarityRing and asserted in tests.
 */
export const POND_RIPPLE_STROKE_BUDGET = 48;

export const POND_RIPPLE_STROKE_WIDTHS: Record<PondRippleDisplayTier, number> = {
  empty: POND_RIPPLE_RATIOS.empty * POND_RIPPLE_STROKE_BUDGET,
  common: POND_RIPPLE_RATIOS.common * POND_RIPPLE_STROKE_BUDGET,
  rare: POND_RIPPLE_RATIOS.rare * POND_RIPPLE_STROKE_BUDGET,
  epic: POND_RIPPLE_RATIOS.epic * POND_RIPPLE_STROKE_BUDGET,
};

/** Sequential illuminate timing — fixed total regardless of outcome (1.6–2.6s). */
export const POND_RIPPLE_SEQUENCE_PRE_BEAT_MS = 175;
export const POND_RIPPLE_SEQUENCE_BAND_MS = 375;
/** Recognition rest hold — color warmth only, no pulse/scale. */
export const POND_RIPPLE_SEQUENCE_RECOGNITION_MS = 750;
/** @deprecated Use POND_RIPPLE_SEQUENCE_RECOGNITION_MS */
export const POND_RIPPLE_SEQUENCE_HOLD_MS = POND_RIPPLE_SEQUENCE_RECOGNITION_MS;

// Duration is identical regardless of outcome — deliberate; do not make outcome-dependent.
// See docs/handoff/cast-finish-pure-field-note-implementation-plan.md §5.
export const POND_RIPPLE_SEQUENCE_TOTAL_MS =
  POND_RIPPLE_SEQUENCE_PRE_BEAT_MS +
  POND_RIPPLE_BAND_ORDER.length * POND_RIPPLE_SEQUENCE_BAND_MS +
  POND_RIPPLE_SEQUENCE_RECOGNITION_MS;

export function pondRippleSequenceDurationMs(): number {
  return POND_RIPPLE_SEQUENCE_TOTAL_MS;
}

/** Aggregate live creature pools by poolTier (catalog common → common display band). */
export function liveCatalogPoolTierCounts(): {
  common: number;
  rare: number;
  epic: number;
  total: number;
} {
  const all = Object.values(POOL).flat();
  let common = 0;
  let rare = 0;
  let epic = 0;
  for (const creature of all) {
    if (creature.poolTier === "common") common += 1;
    else if (creature.poolTier === "rare") rare += 1;
    else if (creature.poolTier === "epic") epic += 1;
  }
  return { common, rare, epic, total: all.length };
}

export function unlockedBandCount(activeTier: PondRippleActiveTier): 1 | 2 | 3 {
  if (activeTier === "free") return 1;
  if (activeTier === "wooden") return 2;
  // fiberglass | lifetime (LIFETIME_UNLOCKS_ALL_CATALOG_BANDS — confirm with on9 before flag→all)
  return 3;
}

export function isBandUnlocked(
  band: PondRippleDisplayTier,
  activeTier: PondRippleActiveTier,
): boolean {
  // Empty water is always unlocked — everyone can miss the pond.
  if (band === "empty") return true;
  const unlocked = unlockedBandCount(activeTier);
  const index = POND_RIPPLE_CREATURE_BAND_ORDER.indexOf(band);
  return index >= 0 && index < unlocked;
}

/** Map claim `rarityIndicator` → creature display tier for pulse target. */
export function rarityIndicatorToDisplayTier(
  rarity: "common" | "uncommon" | "rare" | "epic" | undefined,
): PondRippleCreatureTier {
  if (rarity === "epic") return "epic";
  if (rarity === "rare") return "rare";
  return "common";
}

/** Map claim outcome → ring pulse band (miss → empty water). */
export function outcomeToDisplayTier(claim: {
  outcome: string;
  rarityIndicator?: "common" | "uncommon" | "rare" | "epic";
}): PondRippleDisplayTier {
  if (claim.outcome === "miss") return "empty";
  return rarityIndicatorToDisplayTier(claim.rarityIndicator);
}

export function claimHasCreature(claim: {
  creatureTypeId?: string;
  creatureDisplayName?: string;
}): boolean {
  return Boolean(claim.creatureTypeId && claim.creatureDisplayName);
}

/**
 * Ceremony de-dupe key: creature id on catch/duplicate; `miss:${castId}` on miss.
 */
export function pondRippleCeremonyKey(claim: {
  outcome: string;
  creatureTypeId?: string;
  castId?: string | null;
}): string | null {
  if (claim.outcome === "miss") {
    const castId = claim.castId?.trim();
    return castId ? `miss:${castId}` : null;
  }
  return claim.creatureTypeId ?? null;
}

/**
 * Idempotent ceremony: animate once per unique ceremony key,
 * not once per claim-resolution / retrySafe redelivery.
 */
export function shouldPlayPondRippleCeremony(
  ceremonyKey: string | null | undefined,
  lastAnimatedKey: string | null | undefined,
): boolean {
  if (!ceremonyKey) return false;
  return ceremonyKey !== lastAnimatedKey;
}

/** Warm threshold scrim — unified with fishing cast / claim chrome (never pure black). */
export const CLAIM_THRESHOLD_SCRIM = "rgba(31, 26, 23, 0.35)";

export type CatalogRarityRingFixture = {
  id: string;
  label: string;
  caughtTier: PondRippleDisplayTier;
  subscriptionTier: PondRippleActiveTier;
  claimedCreatureId: string;
};

/** 16 visual QA combos: 4 display tiers × 4 subscription tiers. */
export const CATALOG_RARITY_RING_FIXTURES: readonly CatalogRarityRingFixture[] =
  POND_RIPPLE_BAND_ORDER.flatMap((caughtTier) =>
    (["free", "wooden", "fiberglass", "lifetime"] as const).map((subscriptionTier) => ({
      id: `${caughtTier}-${subscriptionTier}`,
      label: `${caughtTier} · ${subscriptionTier}`,
      caughtTier,
      subscriptionTier,
      claimedCreatureId: `fixture-${caughtTier}-${subscriptionTier}`,
    })),
  );

/** Illuminate order — epic outer → miss inner. */
export function pondRippleIlluminateOrder(): readonly PondRippleDisplayTier[] {
  return POND_RIPPLE_BAND_ORDER;
}

export type PondRippleSequencePhaseEndsMs = {
  preBeatEnd: number;
  illuminateEnd: number;
  totalEnd: number;
};

/** Phase boundaries — no caughtTier param; duration must not leak outcome. */
export function pondRippleSequencePhaseEndsMs(): PondRippleSequencePhaseEndsMs {
  const preBeatEnd = POND_RIPPLE_SEQUENCE_PRE_BEAT_MS;
  const illuminateEnd = preBeatEnd + POND_RIPPLE_BAND_ORDER.length * POND_RIPPLE_SEQUENCE_BAND_MS;
  return {
    preBeatEnd,
    illuminateEnd,
    totalEnd: illuminateEnd + POND_RIPPLE_SEQUENCE_RECOGNITION_MS,
  };
}

/** When recognition + calmBeat start — same instant for all non-matching bands. */
export function pondRippleCalmBeatDelayMs(): number {
  return pondRippleSequencePhaseEndsMs().illuminateEnd;
}

const RECOGNITION_WARM: Record<Exclude<PondRippleDisplayTier, "empty">, string> = {
  common: "#5AB8AA",
  rare: "#B8A85A",
  epic: "#E8B84A",
};

const RECOGNITION_MIST = "#A8C4CE";

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

function lerpHex(base: string, target: string, warmth: number): string {
  const t = Math.max(0, Math.min(1, warmth));
  const a = parseHex(base);
  const b = parseHex(target);
  return toHex(lerpChannel(a.r, b.r, t), lerpChannel(a.g, b.g, t), lerpChannel(a.b, b.b, t));
}

/**
 * Recognition rest stroke — color temperature shift only (no scale/transform).
 * Miss uses cool mist-tone; catch tiers warm toward recognition palette.
 */
export function pondRippleRecognitionStroke(
  baseColor: string,
  caughtTier: PondRippleDisplayTier,
  warmth: number,
): string {
  const target = caughtTier === "empty" ? RECOGNITION_MIST : RECOGNITION_WARM[caughtTier];
  return lerpHex(baseColor, target, warmth);
}

/** Animated prop keys allowed during recognition rest — guards against pulse/scale regressions. */
export function recognitionRestAnimatedPropKeys(): readonly string[] {
  return ["opacity", "stroke", "fill"];
}

/** Target hue for recognition rest on the matched band. */
export function pondRippleRecognitionTargetColor(tier: PondRippleDisplayTier): string {
  if (tier === "empty") return RECOGNITION_MIST;
  return RECOGNITION_WARM[tier];
}
