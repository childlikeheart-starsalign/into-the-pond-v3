# Invariant 5 — Baseline Audit (Formula Duplicates)

Audit date: 2026-06-22. Canonical source: `shared/sanctuary/`.

## Duplicate Map

| Hand-maintained duplicate                                                               | Canonical                                     | Drift notes                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `functions/src/sanctuary/wonderRules.ts`                                                | `shared/sanctuary/wonder/rules.ts`            | Logic identical; import path only (`../types` vs `./types`)                                                                                                                                                 |
| `functions/src/sanctuary/wonderLedger.ts`                                               | `shared/sanctuary/wonder/ledger.ts`           | Functions copy missing `cloneAccount`, `investStoredWonderForRod`, `spendCurrentWonderForBait`, `createEmptyWonderAccount`; has legacy positional `applyWonderSpend` overload — **shared is authoritative** |
| `BAIT_CRAFT_COSTS` in `functions/src/index.ts` (~L69)                                   | `shared/sanctuary/bait/catalog.ts`            | Values identical                                                                                                                                                                                            |
| `src/data/creatures/helpers.ts` (`catchChance`, `consolationReward`, `selectCandidate`) | `shared/sanctuary/fishing/encounterEngine.ts` | Duplicate formulas; client `selectCandidate` unseeded vs shared seeded                                                                                                                                      |
| `src/data/creatures/types.ts` (`ENCOUNTER_RATES`, consolation constants)                | `shared/sanctuary/fishing/encounterEngine.ts` | Duplicate constants                                                                                                                                                                                         |
| `functions/src/sanctuary/progression/*.ts` (8 files)                                    | `shared/sanctuary/progression/*`              | Synced by `sync-progression-module.js`; no AUTO-GENERATED header yet                                                                                                                                        |
| `functions/src/sanctuary/well/*.ts` (6 files)                                           | `shared/sanctuary/well/*`                     | Synced by `sync-well-module.js`; no AUTO-GENERATED header yet                                                                                                                                               |

## Already Synced (verify only)

| Module                                         | Script                   | Golden test                               |
| ---------------------------------------------- | ------------------------ | ----------------------------------------- |
| Fishing (`encounterEngine.ts`, etc.)           | `sync-fishing-module.js` | `encounterEngine.test.ts`                 |
| Economy formulas (`applyLedgerEntry.ts`, etc.) | `sync-economy-module.js` | `economy.test.ts`                         |
| Hand-written economy orchestration             | —                        | `commitEconomyAction.integration.test.ts` |

## Formula Consumers (functions)

| Consumer                                 | Formula source today                     | Commit path                                 |
| ---------------------------------------- | ---------------------------------------- | ------------------------------------------- |
| `index.ts` — diary, practice, bait craft | `wonderRules`, inline `BAIT_CRAFT_COSTS` | `commitEconomyAction`                       |
| `well/submitWellReflection.ts`           | `wonderRules`                            | `commitEconomyAction`                       |
| `progression/recordLessonCompletion.ts`  | `wonderRules`                            | `commitEconomyAction`                       |
| `claimEncounter.ts` / fishing            | `encounterEngine` (synced)               | `applyFishingClaim` → `commitEconomyAction` |
| `progression/craftCallables.ts`          | `craftCosts` (synced)                    | `commitEconomyAction`                       |

## Formula Consumers (client)

| Consumer                      | Formula source today                        |
| ----------------------------- | ------------------------------------------- |
| `inMemoryWonderRepository.ts` | `@/shared/sanctuary/wonder/rules` (correct) |
| `wellDevPreview.ts`           | `@/shared/sanctuary/wonder/rules` (correct) |
| `practiceCatalog.ts`          | `@/src/domain/sanctuary` → shared (correct) |
| `src/data/creatures/index.ts` | Re-exports duplicate helpers (to fix)       |

## Migration Order

1. Wonder rules + ledger sync
2. Bait catalog sync
3. Client claim math ban
4. Sync integrity enforcement + progression/well headers
5. Progression/economy verification
6. Regression tests
7. Verification doc
