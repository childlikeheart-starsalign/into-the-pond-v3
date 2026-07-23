# Probability tables — implementation spec

Engineering will implement directly from these tables. Show your maths.

**Legend:** CURRENT = matches live code today. TARGET = new design to build.

**Methodology note (how Sheet B was built):** `creatures150.ts` has no existing rarity/sub-tier field, so sub-tier assignment is an authored design decision, not extracted data. It was built in three passes: (1) a naive "modules 1–2 → common, 3–4 → mid, 5 → top" rule, which broke down on pools where creatures aren't evenly spread across modules (e.g. `rare3` landed 10 of 14 creatures in mid-rare); (2) a rank-based fix — sort each rod's own creatures by `(moduleId, lessonId)` and cut proportionally to the target ratio, independent of which specific modules are represented; (3) verified that average `moduleId` increases monotonically common→mid→top for all 9 pools, and that all 120 rare+epic creatures are assigned with none missing or duplicated. Full per-creature assignment is in the attached `05b-creature-subtiers.csv`.

---

## ✅ Sheet D amendment (1.1) — rare-element 40W clamp (live)

Naive ladder walk would zero rare-element gates with mid/premium bait. **Locked fix:** when `peakWonderGate === 40`, `effectiveWonderGate` always returns **40** (removed tiers have no gate effect). Wildcard premium → 0W and epic premium → 40W remain intentional Sheet D behavior.

| Rod type      | Base gate | `bait_basic` | `bait_mid`        | `bait_premium`    |
| ------------- | --------- | ------------ | ----------------- | ----------------- |
| basic         | 0W        | 0W           | 0W                | 0W                |
| rare element  | 40W       | 40W          | **40W** (clamped) | **40W** (clamped) |
| rare wildcard | 65W       | 65W          | 40W               | **0W**            |
| epic (any)    | 90W       | 90W          | 65W               | **40W**           |

---

## Sheet A — Wonder gate tiers

Derived directly from the four distinct `peakWonderGate` values in `catalog.ts` — there are exactly four, one per tier.

| Tier | Min currentWonder | Maps to creature peakWonderGate             |
| ---- | ----------------- | ------------------------------------------- |
| 0    | 0                 | 0 (basic — always open)                     |
| 1    | 40                | 40 (rare element: fire/water/wind/electric) |
| 2    | 65                | 65 (rare wildcard)                          |
| 3    | 90                | 90 (epic: all four)                         |

---

## Sheet B — Creature sub-tier assignment

Assign each creature in `creatures150.ts` to a sub-tier within its pool.

**Target split per element rare pool (~14):** common-rare ~6, mid-rare ~5, top-rare ~3. Achieved exactly (6/5/3) for all five 14-count pools (`rare1`–`rare5`) via the rank-based method above.

**Epic pools (13 or 12 creatures)** don't have an explicit target split in the brief — scaled proportionally from the rare ratio (6:5:3 of 14): `epic1`/`epic2` (13 creatures) → 6/4/3; `epic3`/`epic4` (12 creatures) → 5/4/3.

Full 150-row assignment (including the 30 basic-pool creatures, marked `uniform`) is in **`05b-creature-subtiers.csv`**. Sample rows:

| creatureTypeId          | rodRequired | poolTier | elementType | sub_tier    | notes                                                |
| ----------------------- | ----------- | -------- | ----------- | ----------- | ---------------------------------------------------- |
| puddle-dart             | basic       | common   | fire        | uniform     | Basic pool has no sub-tier — flat weight per Sheet C |
| ember-darter            | rare1       | rare     | fire        | common-rare | lesson 1.1                                           |
| forge-wraith            | rare1       | rare     | fire        | mid-rare    | lesson 3.6                                           |
| solstice-runner         | rare1       | rare     | fire        | top-rare    | lesson 5.1                                           |
| _(...147 more rows...)_ |             |          |             |             | see attached CSV                                     |

---

## Sheet C — Base weights by rod type × sub-tier

Weights are **per-creature**, solved algebraically so `Σ(tier weight × tier count) / Σ(all weights)` hits the brief's target conditional-on-catch frequencies exactly. **Assumption (flagged):** "target frequency" is interpreted as _per successful catch_, not per cast — a per-cast reading would also fold in the catch% roll from `CURRENT_ENGINE_SUMMARY.md`, which is a separate mechanic this weight table doesn't control. Both readings are shown in the worked example below so either can be adopted.

| Rod type                     | Sub-tier                   | Base weight (per creature) | Target frequency (per catch)                 | Worked check                           |
| ---------------------------- | -------------------------- | -------------------------- | -------------------------------------------- | -------------------------------------- |
| basic                        | uniform                    | 1                          | flat — most sessions                         | 1/30 ≈ 3.3% per creature, all 30 equal |
| rare element                 | common-rare                | 23                         | remainder (~76.7%)                           | 6×23=138; 138/180=76.7%                |
| rare element                 | mid-rare                   | 6                          | ~1 in 6 (16.7%)                              | 5×6=30; 30/180=16.7% ✓                 |
| rare element                 | top-rare                   | 4                          | ~1 in 15 (6.7%)                              | 3×4=12; 12/180=6.7% ✓                  |
| epic (13-count: epic1/epic2) | common-rare                | 3                          | remainder (50%)                              | 6×3=18; 18/36=50%                      |
| epic (13-count)              | mid-rare                   | 3                          | ~1 in 3 (33.3%)                              | 4×3=12; 12/36=33.3% ✓                  |
| epic (13-count)              | top-rare                   | 2                          | ~1 in 6 (16.7%)                              | 3×2=6; 6/36=16.7% ✓                    |
| epic (12-count: epic3/epic4) | common-rare                | 18                         | remainder (50%)                              | 5×18=90; 90/180=50%                    |
| epic (12-count)              | mid-rare                   | 15                         | ~1 in 3 (33.3%)                              | 4×15=60; 60/180=33.3% ✓                |
| epic (12-count)              | top-rare                   | 10                         | ~1 in 6 (16.7%)                              | 3×10=30; 30/180=16.7% ✓                |
| wildcard                     | (per element, 6/5/3 split) | same ratio as rare element | lower **overall** catch% than dedicated rods | see note below                         |

**Note on wildcard weight:** the brief says wildcard creatures should have "lower per-creature weight than dedicated rods," but wildcard's pool is never combined with the rare-element pools in a shared draw — it's always its own isolated `rare5` pool (per `CURRENT_ENGINE_SUMMARY.md`'s pool-size table), so an internal per-creature weight comparison across pools has no effect on outcomes. The actual mechanism that makes wildcard "lower value" is its catch-chance profile (`rareAny`: base 6%, cap 10%/15%) being lower than `rareElement`'s (base 14%, cap 20%/26%) — already defined and confirmed in Task 2's math. Recommend not adding a second, redundant weight discount on top of that.

**Formula:**

```
P(creature | catch) = (baseWeight × baitModifier × pityModifier) / Σ(eligible weights)
```

Bait modifier = **1.0** for this formula — per Sheet D, bait changes catch% and gate tiers, not which creature gets picked once a catch happens. Pity modifier = 1.0 except during an active `epicTopRareDryStreak` (see Sheet E).

### Fully worked example — `rare_fire` @ 45W, `bait_mid`, 0 pity

**Step 1 — catch%:** base=0.14, bonus=min(45/500, 0.20−0.14)=min(0.09, 0.06)=0.06 (capped) → baseChance=0.20. TARGET `bait_mid` modifier = +12% → **catch% = 32%**.

**Step 2 — given a catch, which creature?** Using rare-element weights (common=23, mid=6, top=4; Σ=180) with 0 pity (modifier=1.0):

- P(Forge Wraith, a mid-rare creature | catch) = 6/180 = **3.33%**
- Sanity check against tier target: P(any mid-rare | catch) = 30/180 = 16.7% = 1/6 ✓

**Step 3 — combined per-cast probability (if that's the intended reading):**
P(Forge Wraith on this specific cast) = catch% × P(creature|catch) = 0.32 × 0.0333 = **1.07%**, i.e. roughly **1 in 94 casts**.

---

## Sheet D — Bait modifiers

| Bait UI ID     | Catch chance modifier | Wonder gate tiers removed |
| -------------- | --------------------- | ------------------------- |
| `bait_basic`   | +5%                   | 0                         |
| `bait_mid`     | +12%                  | 1                         |
| `bait_premium` | +20%                  | 2                         |

**Interaction with live engine:** Sheet D catch% (+5/+12/+20) and gate-tier removal are **live** in `encounterEngine.ts`, with the rare-element **40W clamp** (1.1). Domain bait tiers map `basic` / `rare` (mid) / `epic` (premium).

---

## Sheet E — Pity rules

| Counter                                                                                                                                                                                   | Trigger                                                                                                                                  | Effect                                                                                                                                                                                      | Resets when                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `consecutiveChanceMisses`                                                                                                                                                                 | 10 consecutive misses with reason `chance` (wonder_gate misses don't increment or reset this — they're excluded entirely, per the brief) | Next eligible roll (pool open, gate met) is a guaranteed catch — bypasses the catch% roll entirely; normal weighted sub-tier selection (Sheet C) still applies to pick _which_ creature     | Fires back to 0 the moment a catch (guaranteed or natural) lands                |
| `epicTopRareDryStreak` (per epic rod: `epic_fire`, `epic_water`, `epic_wind`, `epic_electric` — tracked independently, since a dry streak on one epic rod shouldn't quietly buff another) | 20 epic casts on that rod without landing a top-rare creature                                                                            | From cast 21 onward: `adjustedTopWeight = baseTopWeight × (1 + 0.15 × max(0, castsPastThreshold))`, i.e. +15% additional on cast 21, +30% on cast 22, etc., stacking until a top-rare lands | Resets to 0 the instant a top-rare creature is caught on that specific epic rod |

**Worked pity example:** `epic_fire`, 25 casts since last top-rare (5 casts past the 20-cast threshold). Base top-rare weight = 2 (from Sheet C's 13-count epic profile). Adjusted weight = 2 × (1 + 0.15×5) = 2 × 1.75 = **3.5**. New Σ = 18 + 12 + 3.5 = 33.5 (common + mid unchanged, only top-rare's weight shifts). P(top-rare | catch) = 3.5/33.5 ≈ **10.4%**, up from the baseline 16.7%...

**Wait — that's _lower_, not higher, than baseline.** Flagging this: raising only the top-rare weight while everything else stays fixed pulls its _share_ up, but I need to double check the baseline denominator. Baseline: 18+12+6=36, top share=6/36=16.7%. Streak case: common=18, mid=12, top=3.5×... hold on, top-rare **count** is 3 creatures each with adjusted weight 3.5, so top contribution = 3×3.5=10.5, not 3.5. Corrected: Σ=18+12+10.5=40.5, P(top-rare|catch)=10.5/40.5=**25.9%** — correctly higher than the 16.7% baseline, as intended. (Leaving the arithmetic slip visible here deliberately, since it's exactly the kind of per-creature-vs-per-tier mixup that's easy to make when implementing this — worth a unit test that checks the streak pushes the tier probability _up_, not down.)

**Proposed Firestore field:**

```json
"fishingPity": {
  "consecutiveChanceMisses": 0,
  "epicTopRareDryStreak": {
    "epic_fire": 0,
    "epic_water": 0,
    "epic_wind": 0,
    "epic_electric": 0
  }
}
```

---

## Sheet F — Rod type × Creature sub-tier × Base × Bait × Pity (master table)

| Rod type        | Sub-tier    | Base weight                     | Bait modifier                                               | Pity-adjusted weight                      | Notes                                                            |
| --------------- | ----------- | ------------------------------- | ----------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| basic           | uniform     | 1                               | 1.0 (no effect — bait doesn't touch basic's flat weighting) | 1                                         | No pity system defined for basic                                 |
| rare element    | common-rare | 23                              | 1.0                                                         | 23                                        | Bait affects catch%/gate only, not weight                        |
| rare element    | mid-rare    | 6                               | 1.0                                                         | 6                                         |                                                                  |
| rare element    | top-rare    | 4                               | 1.0                                                         | 4                                         | No epic-style dry-streak pity defined for rare tier in the brief |
| rare wildcard   | common-rare | 23 (same ratio as rare element) | 1.0                                                         | 23                                        | Isolated pool — see Sheet C note                                 |
| rare wildcard   | mid-rare    | 6                               | 1.0                                                         | 6                                         |                                                                  |
| rare wildcard   | top-rare    | 4                               | 1.0                                                         | 4                                         |                                                                  |
| epic (13-count) | common-rare | 3                               | 1.0                                                         | 3                                         |                                                                  |
| epic (13-count) | mid-rare    | 3                               | 1.0                                                         | 3                                         |                                                                  |
| epic (13-count) | top-rare    | 2                               | 1.0                                                         | 2 → up to 2×(1+0.15n) during dry streak   | n = casts past the 20-cast threshold on that specific epic rod   |
| epic (12-count) | common-rare | 18                              | 1.0                                                         | 18                                        |                                                                  |
| epic (12-count) | mid-rare    | 15                              | 1.0                                                         | 15                                        |                                                                  |
| epic (12-count) | top-rare    | 10                              | 1.0                                                         | 10 → up to 10×(1+0.15n) during dry streak |                                                                  |

---

## Submission checklist

- [x] Sub-tier assignment covers all 150 creatures (separate CSV attached: `05b-creature-subtiers.csv`)
- [x] Weights sum to explain target frequencies (verified algebraically for every row, shown in Sheet C's "Worked check" column)
- [x] Bait modifiers documented (Sheet D) — flagged as fully TARGET, no overlap with CURRENT
- [x] Pity rules with reset conditions (Sheet E) — includes a caught-and-corrected arithmetic error in the worked example, left visible as a worked caution
- [x] At least one worked probability example with numbers (`rare_fire` @ 45W, `bait_mid`, 0 pity — Sheet C)
