# Probability tables — implementation spec

Engineering will implement directly from these tables. Show your maths.

**Legend:** CURRENT = matches live code today. TARGET = new design to build.

---

## Sheet A — Wonder gate tiers (define for bait tier removal)

| Tier | Min currentWonder | Maps to creature peakWonderGate |
| ---- | ----------------- | ------------------------------- |
| 0    |                   |                                 |
| 1    |                   |                                 |
| 2    |                   |                                 |
| 3    |                   |                                 |

---

## Sheet B — Creature sub-tier assignment

Assign each creature in `creatures150.ts` to a sub-tier within its pool.

**Target split per element rare pool (~14):** common-rare ~6, mid-rare ~5, top-rare ~3.

| creatureTypeId | rodRequired | poolTier | elementType | sub_tier | notes |
| -------------- | ----------- | -------- | ----------- | -------- | ----- |
|                |             |          |             |          |       |

_(continue for all creatures, or attach a separate CSV)_

---

## Sheet C — Base weights by rod type × sub-tier

| Rod type     | Sub-tier      | Base weight | Target frequency (e.g. 1 in 15 casts) | Worked example |
| ------------ | ------------- | ----------- | ------------------------------------- | -------------- |
| basic        | (uniform)     |             | most sessions                         |                |
| rare element | common-rare   |             |                                       |                |
| rare element | mid-rare      |             | ~1 in 6                               |                |
| rare element | top-rare      |             | ~1 in 15                              |                |
| epic element | common-rare   |             |                                       |                |
| epic element | mid-rare      |             | ~1 in 3                               |                |
| epic element | top-rare      |             | ~1 in 6                               |                |
| wildcard     | (per element) |             | lower than dedicated rod              |                |

**Formula:**

```
P(creature) = (baseWeight × baitModifier × pityModifier) / Σ(eligible weights)
```

Include one **fully worked numeric example** for: rare_fire @ 45W, bait_mid, 0 pity.

---

## Sheet D — Bait modifiers

| Bait UI ID     | Catch chance modifier | Wonder gate tiers removed |
| -------------- | --------------------- | ------------------------- |
| `bait_basic`   | +5%                   | 0                         |
| `bait_mid`     | +12%                  | 1                         |
| `bait_premium` | +20%                  | 2                         |

**Interaction with CURRENT engine:** Note any row that differs from `CURRENT_ENGINE_SUMMARY.md`.

---

## Sheet E — Pity rules

| Counter                 | Trigger                               | Effect                                                        | Resets when |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------- | ----------- |
| consecutiveChanceMisses | 10 misses (exclude wonder_gate)       | Guarantee catch on next eligible roll                         |             |
| epicTopRareDryStreak    | 20 casts without top-rare on epic rod | +15% top-rare weight per subsequent cast until top-rare lands |             |

**Proposed Firestore field (for engineers):**

```json
"fishingPity": {
  "consecutiveChanceMisses": 0,
  "epicTopRareDryStreak": { "epic_fire": 0 }
}
```

---

## Sheet F — Rod type × Creature sub-tier × Base × Bait × Pity (master table)

| Rod type | Sub-tier | Base weight | Bait modifier | Pity-adjusted weight | Notes |
| -------- | -------- | ----------- | ------------- | -------------------- | ----- |
|          |          |             |               |                      |       |

---

## Submission checklist

- [ ] Sub-tier assignment covers all 150 creatures (or separate CSV attached)
- [ ] Weights sum to explain target frequencies
- [ ] Bait modifiers documented
- [ ] Pity rules with reset conditions
- [ ] At least one worked probability example with numbers
