# Catch probability — content guidelines (no UI)

**Status:** Locked product decision for Fishing Loop Gap 3.  
**Engineering:** Do **not** add numeric catch %, odds chips, or duration-based ring signals.

## Why nothing is built

Catch chance is computed server-side at claim (`catchChance` in `encounterEngine.ts`). The client deliberately never receives percentages (`toClientClaimSummary`).

A brief suggestion to let the ripple “linger” in a band as a soft probability signal **contradicts** an existing ceremony constraint: ring sequential illumination must have **identical total duration regardless of outcome**, so timing cannot leak the result before the reveal. Do not reopen that.

## Intentional qualitative signal (content discipline)

Rarity communication is **register**, not numbers:

1. **Creature field notes** — catalog `visualMetaphor` (shown as the cast-finish field note). Top-tier / epic creatures should read more reverent and unhurried; common creatures may stay everyday and light.
2. **Rod first-cast narration** — `resolveFirstCastPondLabel` / first-cast copy already weights epic rods more heavily than basic. Keep that gradient deliberate as new rods are added.
3. **Trust** comes from fairness over time (pity: guaranteed catch after 10 chance misses; epic top-rare dry-streak reweight), not from exposing the formula.

## Do not add

- Catch % labels, progress bars tied to odds, or bait “boost” percentages in player UI
- Ring / ripple timing that varies by expected rarity or outcome
- Soft “this cast feels lucky” UI that maps to live `ENCOUNTER_RATES`

## When pressure returns

Name it: any “just this once” soft probability signal for a rod or moment reopens suspense leakage and trust-via-readout debates already closed here. Prefer content register + pity, not UI.
