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
if hasBait: chance = min(baseChance + baitBonus, maxWithBait)
```

| Profile      | base | divisor | maxNoBait | baitBonus | maxWithBait |
| ------------ | ---- | ------- | --------- | --------- | ----------- |
| common       | 0.55 | 600     | 0.70      | 0.00      | 0.70        |
| rare element | 0.14 | 500     | 0.20      | 0.06      | 0.26        |
| rare any     | 0.06 | 600     | 0.10      | 0.05      | 0.15        |
| epic element | 0.03 | 700     | 0.07      | 0.05      | 0.12        |

### Precomputed chances (CURRENT: all baits equivalent)

Today any bait ID (`bait_basic`, `bait_mid`, `bait_premium`) sets `hasBait = true` with the **same** bonus. Differentiated +5% / +12% / +20% is **TARGET only**.

| Wonder | Basic     | Rare element (pool open) | Rare5 (pool open) | Epic (pool open) |
| ------ | --------- | ------------------------ | ----------------- | ---------------- |
| 0      | 55% / 55% | gate                     | gate              | gate             |
| 25     | 59% / 59% | gate                     | gate              | gate             |
| 45     | 63% / 63% | 20% / 26%                | gate              | gate             |
| 65     | 70% / 70% | 20% / 26%                | 10% / 15%         | gate             |
| 90     | 70% / 70% | 20% / 26%                | 15% / 15%         | 7% / 12%         |

_(first number = no bait, second = any bait)_

**Pool opens when:** basic ≥0; rare element ≥40; wildcard ≥65; epic ≥90.

---

## Bait (CURRENT vs TARGET)

| Bait UI ID     | Tier  | CURRENT                    | TARGET (Task 5)                  |
| -------------- | ----- | -------------------------- | -------------------------------- |
| `bait_basic`   | basic | hasBait=true, shared bonus | +5% catch                        |
| `bait_mid`     | rare  | same                       | +12%, remove 1 wonder gate tier  |
| `bait_premium` | epic  | same                       | +20%, remove 2 wonder gate tiers |

---

## Cast & ownership

- Cast duration: **2 minutes** (`CAST_DURATION_MS`).
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

## Not implemented yet (Task 5)

- Weighted sub-tier selection
- Pity after 10 chance misses
- Epic top-rare dry streak (+15% per cast after 20)
- Per-bait catch % and wonder gate tier removal
