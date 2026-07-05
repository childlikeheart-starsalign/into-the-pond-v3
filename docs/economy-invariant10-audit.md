# Invariant 10 — Duplicate Compensation Baseline Audit

Duplicate consolation computed once in the encounter engine; persisted once per cast via `fishing_claim:{castId}` with combined wonder + materials on a single ledger entry.

## Flow trace

```
claimCast (functions/src/index.ts L723–733)
  → executeClaimCast (claimEncounter.ts L181–185)
    → executeClaimCastInTransaction (claimEncounter.ts L112–178)
      → tx: daily reset patch (exempt)
      → resolveClaimCastId from activeCast | lastClaimedCastId
      → tx: readIdempotencyInTransaction fishing_claim:{castId}
      → resolveFishingClaimFromContext (buildFishingClaimContext.ts L40–41)
        → resolveFishingClaim (encounterEngine.ts L110–207)
      → applyFishingClaimInTransaction (applyFishingClaim.ts L40–154)
        → commitEconomyAction (applyFishingClaim.ts L68–125)
        → if committed: creatures / fishingClaims / analytics
```

## Engine path

`DUPLICATE_CONSOLATION` is the sole authority for duplicate wonder + materials. `resolveFishingClaim` returns one `FishingClaim` with `outcome`, `wonderAwarded`, and `materialsAwarded` — no second compensation pass.

| Step             | Location                             | Behavior                                                 |
| ---------------- | ------------------------------------ | -------------------------------------------------------- |
| Constants        | `encounterEngine.ts` L38–42          | `common`/`rare`/`epic`/`poolComplete` tiers              |
| Duplicate branch | `encounterEngine.ts` L169–190        | `isDuplicate` → lookup `DUPLICATE_CONSOLATION[poolTier]` |
| Catch branch     | `encounterEngine.ts` L193–207        | `wonderAwarded: 0`, `materialsAwarded: 0`                |
| Context wrapper  | `buildFishingClaimContext.ts` L40–41 | Rod/bait filter → `resolveFishingClaim` (no extra math)  |

```typescript
// encounterEngine.ts L38–42, L172–187
export const DUPLICATE_CONSOLATION = {
  common: { materials: 1, wonder: 1, spiritEcho: false },
  rare: { materials: 2, wonder: 2, spiritEcho: false },
  epic: { materials: 3, wonder: 4, spiritEcho: true },
  poolComplete: { materials: 0, wonder: 10, spiritEcho: true },
} as const;
// … isDuplicate → wonderAwarded: dup.wonder, materialsAwarded: dup.materials
```

Unit coverage: `shared/sanctuary/fishing/encounterEngine.test.ts` L107–122 asserts duplicate outcome and `wonderAwarded === 1`; does **not** assert `materialsAwarded` against `DUPLICATE_CONSOLATION`.

## Persistence path

One `commitEconomyAction` per cast; idempotency key `fishing_claim:{castId}` (`callableIdempotencyKeys.ts` L12–13).

| Concern         | Location                                | Status                                                           |
| --------------- | --------------------------------------- | ---------------------------------------------------------------- |
| Single commit   | `applyFishingClaim.ts` L68              | Exactly one `commitEconomyAction` call                           |
| Combined deltas | `applyFishingClaim.ts` L77–93, L103–116 | `deltaMaterials: { feather: materials }` on same entry as wonder |
| Wonder > 0 path | `applyFishingClaim.ts` L77–93           | `applyWonderEarnInMemory` + `buildEconomyLedgerEntry`            |
| Wonder = 0 path | `applyFishingClaim.ts` L103–116         | Manual `EconomyLedgerEntry` (materials-only miss/catch)          |
| Creature grant  | `applyFishingClaim.ts` L127–136         | Subcollection write only when `committed && outcome === "catch"` |
| User patch      | `applyFishingClaim.ts` L56–64           | `activeCast: null`, `lastClaimedCastId`, inventory feather bump  |

`wonderSource` mapping (`applyFishingClaim.ts` L48–49): `duplicate` → `fishing_duplicate_consolation`; all other outcomes (including **catch**) → `fishing_miss_consolation`.

## `grantDuplicateCompensation` absence

```
rg grantDuplicateCompensation functions/src src shared eslint-rules
→ 0 matches in production code (only docs/economy-invariant10-implementation-plan.md)
```

No separate callable, helper, or second ledger write path for duplicate compensation exists.

## DEV preview

[`resolveDevFishingClaim.ts`](src/features/fishing/resolveDevFishingClaim.ts):

- L76–86: same `resolveFishingClaimFromContext` engine as production
- L88–91: returns `toClientClaimSummary` + `previewOnly: true`
- Does **not** import `applyFishingClaimInTransaction`, `applyFishingClaim`, or `commitEconomyAction`
- Optional Firestore/WMDB reads for wonder and caught IDs are display inputs only (L18–61)

## Invariant 10a–10h checklist

| ID      | Rule                                                                                      | Status   | Evidence / gap                                                                     |
| ------- | ----------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| **10a** | Outcome decided once per cast by `resolveFishingClaim`                                    | **Pass** | Single engine call in `executeClaimCastInTransaction` L156–166                     |
| **10b** | Duplicate consolation only from `DUPLICATE_CONSOLATION` — never recomputed at persistence | **Pass** | `applyFishingClaim.ts` reads `claim.wonderAwarded` / `claim.materialsAwarded` only |
| **10c** | Exactly one `economyLedger` row: `fishing_claim:{castId}`                                 | **Pass** | `fishingClaimKey(castId)` + one `commitEconomyAction`                              |
| **10d** | Row carries all economy deltas (`deltaCurrentWonder` + `deltaMaterials`)                  | **Pass** | Both fields on same entry (L92–93 or L109–112)                                     |
| **10e** | Catch: wonder=0, materials=0; creature is non-ledger side effect                          | **Pass** | Engine L204–205; creature `tx.set` gated L127–136                                  |
| **10f** | No `grantDuplicateCompensation` or equivalent second write                                | **Pass** | Grep: 0 matches in `functions/src`, `src/`, `shared/`                              |
| **10g** | DEV preview: engine only, no persistence                                                  | **Pass** | `resolveDevFishingClaim.ts`; no economy imports                                    |
| **10h** | Idempotent retry → cached summary, no second grant                                        | **Pass** | `claimEncounter.ts` L134–138; integration test L105–124                            |

## Gaps vs spec

**Closed in Stages 1–8** (see [verification doc](economy-invariant10-verification.md)): ledger metadata, unified entry builder, catch `fishing_catch` source, duplicate integration tests, static `grantDuplicateCompensation` ban, client static check (`test-fishing-claim-invariant10.mjs`), analytics `duplicate` tag on `sanctuaryAnalytics`, Stage 7 duplicate ledger fold test, Stage 8 full duplicate orchestration + `castClaim` server deprecation.

| Spec item                    | Current                                                      | Risk                                                           |
| ---------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| `inventoryChanges` on ledger | Not in schema; creature via subcollection `tx.set`           | Intentional (Inv 4 side effect) — document only                |
| Historical ledger rows       | Pre–Stage 1 rows lack `outcome`/`creatureTypeId`/`duplicate` | Analytics/replay gap for old claims only; no backfill required |

## Legacy paths

- **`castClaim` / `requestCastClaim`:** **Removed** (2026-06-29) — was no-op stub + unused client wrapper; fishing uses `claimCast` via `fishingServerCast.ts` / `serverActions.ts`. CI: `no-legacy-cast-claim` ESLint rule + `validateNoCastClaimCallable()`.
- **Handoff `consolationReward`** (`docs/handoff/Oscar/reference/files/src/features/creatures/creatures150.ts` L2644–2657): reference-only duplicate/miss helper; not imported by production claim path.
- **Client `consolationReward` in presentation** (`fishingClaimPresentation.ts` L28–35): display-only derivation from claim fields — not a grant path.

## Related invariants

- [Invariant 3 verification](economy-invariant3-verification.md) — `fishing_claim:{castId}` idempotency key and retry semantics
- [Invariant 4 verification](economy-invariant4-verification.md) — ledger + `activeCast` clear in same tx via `additionalUserPatch`
- [Invariant 7 verification](economy-invariant7-verification.md) — append-only `economyLedger`; `wonderTransactions` dual-write on wonder>0 paths
- [Invariant 8 audit](economy-invariant8-audit.md) — one claim per `castId`; idempotency ordering before `activeCast` check
- [Invariant 10 verification](economy-invariant10-verification.md) — Stages 0–10 complete; gate results and test matrix

## Recommended next

Migrate next economy subsystems (well, craft, bait) using the same commit primitive pattern.
