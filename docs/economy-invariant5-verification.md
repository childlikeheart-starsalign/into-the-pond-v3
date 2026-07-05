# Invariant 5 — Canonical Formulas Verification

See also: [economy-invariant5-audit.md](./economy-invariant5-audit.md) (baseline duplicate map).

## Primary Objective

Reward and spend **formulas** exist in exactly one place under `shared/sanctuary/`. Cloud Functions receive AUTO-GENERATED copies via build sync. All economy **mutations** remain on `commitEconomyAction` with idempotency (Invariants 3–4).

## Canonical Formula Modules

| Module                    | Path                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wonder rules              | `shared/sanctuary/wonder/rules.ts`                                                                                                                                                   |
| Wonder ledger helpers     | `shared/sanctuary/wonder/ledger.ts`                                                                                                                                                  |
| Bait catalog              | `shared/sanctuary/bait/catalog.ts`                                                                                                                                                   |
| Fishing encounter         | `shared/sanctuary/fishing/encounterEngine.ts` — `DUPLICATE_CONSOLATION` is the sole authority for duplicate wonder + materials ([Invariant 10](economy-invariant10-verification.md)) |
| Craft costs / parts       | `shared/sanctuary/progression/craftCosts.ts`, `partsAwards.ts`                                                                                                                       |
| Economy ledger projection | `shared/sanctuary/economy/*` (except hand-written orchestration in functions)                                                                                                        |

## Build Sync Inventory

| Script                       | Destinations                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sync-wonder-module.js`      | `wonderRules.ts`, `wonderLedger.ts`                                                                                                                  |
| `sync-bait-module.js`        | `baitCatalog.ts`                                                                                                                                     |
| `sync-fishing-module.js`     | `encounterEngine.ts`, `fishingClaimPresentation.ts`, `castMapping.ts`, `buildFishingClaimContext.ts`, `random.ts`, `progression/rodFishingAccess.ts` |
| `sync-economy-module.js`     | `economy/*.ts` (skips `commitEconomyAction.ts`, `resolveCallableIdempotency.ts`)                                                                     |
| `sync-progression-module.js` | `progression/*.ts`, `progression/_sanctuaryTypes.ts`                                                                                                 |
| `sync-well-module.js`        | `well/*.ts`                                                                                                                                          |
| `validate-sync-integrity.js` | Hash-checks 30 synced pairs after all sync scripts                                                                                                   |

### Build order (`functions npm run build`)

```text
validate-firestore-rules-registry.js
validate-economy-atomicity.js
generate-creature-refs.js
sync-well-module.js
sync-progression-module.js
sync-wonder-module.js
sync-bait-module.js
sync-fishing-module.js
sync-economy-module.js
validate-sync-integrity.js
tsc
encounterEngine.test.ts
economy.test.ts
wonder/rules.test.ts
bait/catalog.test.ts
progression/evaluateCraftable.test.ts
commitEconomyAction.integration.test.ts
```

## Client Enforcement

| Rule                             | Scope                                                          |
| -------------------------------- | -------------------------------------------------------------- |
| `local/no-client-economy-writes` | No economy field writes to `users/{uid}` from client           |
| `local/no-client-claim-formulas` | No local definitions of `catchChance`, `ENCOUNTER_RATES`, etc. |

Run: `npm run lint:economy`

Creature **POOL data** remains in `src/data/creatures/`; claim math re-exports from `@/shared/sanctuary/fishing/encounterEngine`.

## Hand-Written Functions Files (allowed)

- `functions/src/sanctuary/economy/commitEconomyAction.ts`
- `functions/src/sanctuary/economy/resolveCallableIdempotency.ts`
- `functions/src/sanctuary/types.ts` (functions-local subset; full types via `progression/_sanctuaryTypes.ts`)
- `functions/src/sanctuary/wonderEconomy.ts` (legacy allowlist for atomicity validator)
- Orchestration: `claimEncounter.ts`, `craftCallables.ts`, `index.ts`, well callables

## Invariants Verified

### Invariant 5

- Wonder rules/ledger synced from shared with AUTO-GENERATED headers
- Bait costs synced; inline `BAIT_CRAFT_COSTS` removed from `index.ts`
- Client claim formulas banned; re-exports from shared only
- Build fails on synced file drift (`validate-sync-integrity.js`)
- Golden tests: wonder rules, bait catalog, fishing, economy, progression craft

### Invariants 1–4 (preserved)

- `validate-economy-atomicity.js` passes
- `economy.test.ts` + `commitEconomyAction.integration.test.ts` pass
- Idempotent callables unchanged; ledger + snapshot atomic commits

## Remaining Legacy Paths

| Path                               | Notes                                                   |
| ---------------------------------- | ------------------------------------------------------- |
| `wonderEconomy.ts`                 | Deprecated helpers; allowlisted for atomicity scan only |
| `functions/src/sanctuary/types.ts` | Hand-maintained subset; not full shared types sync      |

## Adding a New Formula Module

1. Add source under `shared/sanctuary/<module>/`
2. Add or extend a `sync-*-module.js` script with import rewrites + AUTO-GENERATED header
3. Register source→dest pair in `validate-sync-integrity.js` manifest
4. Add golden test in `shared/` and wire into `functions/package.json` build
5. Route all mutations through `commitEconomyAction` with idempotency keys

## Stage Deliverables Summary

| Stage | Result                                                                |
| ----- | --------------------------------------------------------------------- |
| 0     | `docs/economy-invariant5-audit.md`                                    |
| 1     | `sync-wonder-module.js`, `wonder/rules.test.ts`                       |
| 2     | `sync-bait-module.js`, `bait/catalog.test.ts`, `index.ts` import      |
| 3     | Client re-exports, `no-client-claim-formulas` ESLint rule             |
| 4     | `validate-sync-integrity.js`, progression/well AUTO-GENERATED headers |
| 5     | `evaluateCraftable.test.ts` wired in build                            |
| 6     | Full `functions npm run build` green (24 tests)                       |
| 7     | This document                                                         |
