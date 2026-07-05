# Invariant 6 — Baseline Audit (Server-Authoritative Rewards)

Audit date: 2026-06-22.

## Client reward computation paths

| Path                                                                                    | Computes rewards?                         | Action                                  |
| --------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------- |
| [`wellDevPreview.ts`](src/features/well/wellDevPreview.ts)                              | `wonderAmountForRule` for DEV             | Allow with `previewOnly: true` + banner |
| [`resolveDevFishingClaim.ts`](src/features/fishing/resolveDevFishingClaim.ts)           | `resolveFishingClaimFromContext`          | Already `previewOnly: true`             |
| [`inMemoryWonderRepository.ts`](src/repositories/sanctuary/inMemoryWonderRepository.ts) | `wonderAmountForRule` grants              | Restrict to `__DEV__` only              |
| [`practiceCatalog.ts`](src/features/sanctuary/practiceCatalog.ts)                       | `PRACTICE_WONDER_BY_KIND` min/max display | OK — range hint only                    |
| [`creatures/helpers.ts`](src/data/creatures/helpers.ts)                                 | Re-exports `catchChance`                  | Remove barrel exports                   |

## UI fallbacks (violations)

| Issue                                            | File                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `wonderAwarded ?? 12` hardcoded reveal           | [`TodaysFocusCardBack.tsx`](src/features/well/TodaysFocusCardBack.tsx) L125       |
| `result.wonderAwarded ?? 0` on practice complete | [`PracticeMomentScreen.tsx`](src/features/sanctuary/PracticeMomentScreen.tsx) L29 |

## Callable return gaps

| Callable                   | Returns authoritative amounts?                                 | Gap                                     |
| -------------------------- | -------------------------------------------------------------- | --------------------------------------- |
| `claimCast`                | `wonderAwarded`, `materialsAwarded` via `toClientClaimSummary` | None                                    |
| `submitWellReflection`     | `wonderAwarded`                                                | DEV path missing `previewOnly`          |
| `submitDiaryEntry`         | `wonderAwarded`, `partsAwarded` (lesson)                       | Client types optional                   |
| `completePractice`         | `wonderAwarded`                                                | Client types optional                   |
| `completeLessonReflection` | `wonderAwarded`, `partsAwarded`                                | OK                                      |
| `craftBait`                | tier, baitKey only                                             | Missing `wonderSpent`, `materialsSpent` |
| `startCraft`               | `wonderInvested`, `partsSpent`                                 | OK                                      |

## Optimistic updates

| Path                          | Status                                                                     |
| ----------------------------- | -------------------------------------------------------------------------- |
| `applyOptimisticEconomyPatch` | Parts/storedWonder spend only — OK                                         |
| Offline diary queue           | Stores `wonderAwarded: 0` until sync — OK; retry should update from server |
| `db/sync.ts`                  | Reads `wonderAwarded` from Firestore projection — OK                       |

## Production UI paths using server responses

- Well: [`WellModalContent.tsx`](src/features/well/WellModalContent.tsx) sets wonder from callable
- Fishing: [`sanctuary.tsx`](<app/(tabs)/sanctuary.tsx>) displays `completedClaim` from `claimServerCast`
- Practice: [`PracticeMomentScreen.tsx`](src/features/sanctuary/PracticeMomentScreen.tsx) via `completePractice`
