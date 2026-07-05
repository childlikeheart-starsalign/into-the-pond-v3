# Rod progression — source of truth

`shared/sanctuary/progression/` is the **canonical configuration and pure logic** for rod progression v2. Server callables, Craft Bench UI, and analytics should import from here — not duplicate costs, lesson clusters, or state rules.

## Authority model

| Layer                                  | Role                                                                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **`shared/sanctuary/progression/`**    | Craft costs, durations, module→rod map, parts awards, subscription craft gate, fishing permissions, `evaluateCraftableStates` |
| **Firestore `users/{uid}/playerRods`** | Runtime source of truth per user (written only by server callables)                                                           |
| **Client `rodProgressionStore`**       | Optimistic cache reconciled against Firestore snapshots (Phase 1+)                                                            |

## Modules

| File                       | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `craftCosts.ts`            | Parts, storedWonder, per-rod craft timers                 |
| `moduleRodMap.ts`          | Lesson clusters, module→rare rod assignment               |
| `partsAwards.ts`           | +1 diary, +1 revisit, +5 cluster bonus                    |
| `craftStates.ts`           | Internal state → parent UX labels                         |
| `subscriptionCraftGate.ts` | Which rods craftable per subscription tier                |
| `fishingPermissions.ts`    | Element + max pool tier per domain rod                    |
| `evaluateCraftable.ts`     | Pure progression engine                                   |
| `types.ts`                 | `PlayerRodState`, `PlayerRodRecord`, Firestore DTO shapes |

## Run self-test

```bash
npx tsx -e "import { runRodProgressionSelfTest } from './shared/sanctuary/progression/evaluateCraftable.test.ts'; runRodProgressionSelfTest(); console.log('ok');"
```
