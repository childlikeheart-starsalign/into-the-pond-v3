# Current fishing & craft engine — summary for content authors

Use this when filling the spreadsheet and probability tables. Mark rows **CURRENT** vs **TARGET** where they differ.

---

## Claim resolution order (`resolveFishingClaim`)

1. Build pool: creatures where `rodRequired` matches rod (`poolForRod`).
2. Filter by rod permission: element + max tier (`filterCreaturesByRodPermission`).
3. Wonder gate: keep only creatures where `currentWonderAtClaim >= peakWonderGate`.
4. **If pool empty** → miss, reason `wonder_gate`, message: _"The pond is still. Reflect, and return when you are ready."_
5. Compute catch **probability** from `ENCOUNTER_RATES` (not guaranteed).
6. **If roll fails** → miss (chance), consolation materials.
7. **If roll succeeds** → pick creature with **uniform random** among not-yet-caught (or full pool if all caught).
8. If picked creature already caught → duplicate outcome.

---

## Pool sizes (from `creatures150.ts`)

| Rod key         | Pool             | Count   | Creature `peakWonderGate` |
| --------------- | ---------------- | ------- | ------------------------- |
| `basic`         | common           | 30      | 0                         |
| `rare1`–`rare4` | rare element     | 14 each | 40                        |
| `rare5`         | rare any-element | 14      | 65                        |
| `epic1`–`epic2` | epic             | 13 each | 90                        |
| `epic3`–`epic4` | epic             | 12 each | 90                        |

There are **no creature sub-tiers** (common-rare / mid-rare / top-rare) in the catalog yet — Task 5 defines them.

---

## Catch chance formula

```
bonus = min(currentWonder / wonderDivisor, maxNoBait - base)
baseChance = min(base + bonus, maxNoBait)
chance = min(baseChance + sheetDCatchBonus(baitTier), 1)
```

Sheet D catch bonuses: no bait +0; basic +5%; mid (`rare`) +12%; premium (`epic`) +20%. Legacy shared `baitBonus` / `maxWithBait` caps are **retired**.

| Profile      | base | divisor | maxNoBait |
| ------------ | ---- | ------- | --------- |
| common       | 0.55 | 600     | 0.70      |
| rare element | 0.14 | 500     | 0.20      |
| rare any     | 0.06 | 600     | 0.10      |
| epic element | 0.03 | 700     | 0.07      |

### Precomputed chances (Sheet D live)

Example at 45W rare-element (baseChance capped at 20%): no bait 20%; basic 25%; mid 32%; premium 40%.

**Pool opens when** `currentWonder >= effectiveWonderGate(peakWonderGate, baitTier)`:

- Ladder: `[0, 40, 65, 90]`
- **1.1 clamp:** base gate **40W** (rare-element) never drops — mid/premium stay at 40
- Wildcard 65: mid → 40, premium → **0** (intentional Sheet D)
- Epic 90: mid → 65, premium → **40**

---

## Bait (Sheet D — live)

| Bait UI ID     | Domain tier | Catch% bonus | Gate tiers removed                          |
| -------------- | ----------- | ------------ | ------------------------------------------- |
| `bait_basic`   | basic       | +5%          | 0                                           |
| `bait_mid`     | rare        | +12%         | 1 (rare-element 40W clamped — no unlock)    |
| `bait_premium` | epic        | +20%         | 2 (wildcard may reach 0W; epic lands at 40) |

---

## Cast & ownership

- Cast duration: **2 hours** (`CAST_DURATION_MS` / `FISHING_CAST_DURATION_MS`).
- `createCast` rejects if rod not owned: `playerRods/{domainRodId}.state` must be `ready` or `equipped` (**basic** exempt).
- Locked rod → server error, no claim.

---

## Craft state machine

`locked → craftable → crafting → ready → equipped`  
Wildcard: `locked → ready` (gift) → `equipped` (no craft timer).

Firestore: `users/{uid}/playerRods/{domainRodId}` — see progression plan for fields.

---

## Messages (CURRENT placeholders)

| Outcome          | Copy                                                       |
| ---------------- | ---------------------------------------------------------- |
| wonder_gate miss | The pond is still. Reflect, and return when you are ready. |
| chance miss      | Not this time. The water remembers your patience.          |
| duplicate        | This one knows you already.                                |
| new catch        | _(none — Task 4)_                                          |

---

## Implemented (Phase 1 + Sheet D)

- Weighted sub-tier selection (Sheet C)
- Pity after 10 chance misses; epic top-rare dry streak (Sheet E)
- Per-bait catch % and wonder gate tier removal (Sheet D) with rare-element **40W clamp** (open item 1.1)
