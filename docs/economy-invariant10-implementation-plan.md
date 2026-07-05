# Invariant 10 — Duplicate Compensation Calculated Once Per Cast

**Status:** Planning only (no code changes in this document).

**Rule:** Engine decides outcome once; one ledger entry carries all deltas for that cast.

**Honest assessment:** Invariant 10 is **largely already satisfied** by the fishing claim path built for Invariants 1–4, 5, and 8. There is no `grantDuplicateCompensation` callable, duplicate consolation is computed once in `resolveFishingClaim`, and `applyFishingClaimInTransaction` commits wonder + materials in a **single** `commitEconomyAction` call keyed by `fishing_claim:{castId}`. Remaining work is **verification, metadata hardening, test coverage, and preventive guards** — not re-architecture.

---

## 1. Primary Objective

Ensure duplicate (and all fishing) consolation rewards are:

1. **Computed once** by the pure encounter engine (`resolveFishingClaimFromContext` → `resolveFishingClaim`).
2. **Persisted once** via a single `economyLedger` row per cast (`fishing_claim:{castId}`), carrying combined `deltaCurrentWonder` and `deltaMaterials` when applicable.
3. **Never split** across a second callable, second ledger entry, or client-side grant path.

DEV preview (`resolveDevFishingClaim`) must continue to run the same engine with **zero** persistence.

---

## 2. Systems to Migrate

| Priority | System                  | Entry points                                                                 | Current state                                                          | Gap                                                                                                                          |
| -------- | ----------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| —        | **Encounter engine**    | `shared/sanctuary/fishing/encounterEngine.ts`, `buildFishingClaimContext.ts` | `DUPLICATE_CONSOLATION` applied in-engine; one `FishingClaim` returned | None for Inv 10 core rule                                                                                                    |
| P1       | **Claim persistence**   | `functions/src/sanctuary/applyFishingClaim.ts`                               | Single `commitEconomyAction`; wonder + materials on same entry         | Metadata incomplete vs spec; dual build paths (wonder>0 vs manual zero-wonder); catch uses `fishing_miss_consolation` source |
| P1       | **Claim orchestration** | `functions/src/sanctuary/claimEncounter.ts`                                  | Engine → apply in one tx                                               | No duplicate-specific integration test                                                                                       |
| P2       | **DEV preview**         | `src/features/fishing/resolveDevFishingClaim.ts`                             | `previewOnly: true`; no `applyFishingClaim`                            | Needs explicit static assertion in Inv 10 gate                                                                               |
| P2       | **Client presentation** | `shared/sanctuary/fishing/fishingClaimPresentation.ts`                       | `duplicateReward` derived from claim fields only                       | OK — display-only                                                                                                            |
| P3       | **Preventive guards**   | `eslint-rules/`, `functions/scripts/`                                        | No ban on `grantDuplicateCompensation`                                 | Add grep/script ban                                                                                                          |
| —        | **Legacy reference**    | `docs/handoff/Oscar/reference/`                                              | Old `consolationReward` helper                                         | Handoff only; not production path                                                                                            |

**Not in scope:** `castClaim` no-op stub (Inv 8), creature subcollection writes (side effect after ledger commit, Inv 4), `compensateEconomyEntry` admin corrections (Inv 7).

---

## 3. Non-Negotiable Invariants

Preserve Invariants 1–9 and add **Invariant 10**:

| ID      | Rule                                                                                                                                                              |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **10a** | Outcome (catch / miss / duplicate) decided **once** per cast by `resolveFishingClaim`                                                                             |
| **10b** | Duplicate consolation (`wonderAwarded`, `materialsAwarded`) comes **only** from `DUPLICATE_CONSOLATION` in the engine — never recomputed at persistence           |
| **10c** | Exactly **one** `economyLedger` row per cast: `idempotencyKey = fishing_claim:{castId}`                                                                           |
| **10d** | That row carries **all** economy deltas for the claim: `deltaCurrentWonder` + `deltaMaterials.feather` (and future material keys if added)                        |
| **10e** | Catch path: `wonderAwarded = 0`, `materialsAwarded = 0`; creature grant is a **non-ledger** side effect (`users/{uid}/creatures/{id}`) after `committed === true` |
| **10f** | No separate `grantDuplicateCompensation` (or equivalent) callable, helper, or second ledger write                                                                 |
| **10g** | DEV preview uses same engine but **never** calls `applyFishingClaimInTransaction` or `commitEconomyAction` for fishing                                            |
| **10h** | Idempotent retry returns cached claim summary — no second wonder/material grant (inherits Inv 3 + 8)                                                              |

---

## 4. Implementation Rules

After **each** stage:

1. `cd functions && npm run build`
2. Typecheck is included in build (`tsc`)
3. Run tests (build runs unit + integration tests)
4. Verify previous behaviour (Inv 1–9 gates still pass)
5. Continue only if gate passes

Root economy lint (after Stage 3):

```bash
npm run lint:economy
```

Do **not** batch stages into one PR.

---

## 5. Backwards Compatibility

- Existing ledger rows with `{ claimId }` metadata remain valid; new fields (`outcome`, `creatureTypeId`, `duplicate`) are **additive**
- No backfill required for historical claims
- `wonderTransactions` dual-write continues for wonder-earning duplicate/miss paths (Inv 7 transition)
- Client `toClientClaimSummary` shape unchanged
- `inventoryChanges` in the user spec is **not** part of `EconomyLedgerEntry` today; creature adds stay as subcollection writes (document as intentional — Inv 4 side effect, not a second economy delta)

---

## Current State vs Spec (Baseline)

### Already correct

```
claimCast (index.ts)
  → executeClaimCastInTransaction (claimEncounter.ts)
    → resolveFishingClaimFromContext (buildFishingClaimContext.ts → encounterEngine.ts)
    → applyFishingClaimInTransaction (applyFishingClaim.ts)
      → commitEconomyAction (single ledger entry, fishing_claim:{castId})
      → if committed: creatures / fishingClaims / analytics
```

| Check                                 | Result                                                                                                                                                                              |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grantDuplicateCompensation` exists?  | **No** (grep: 0 matches)                                                                                                                                                            |
| Duplicate wonder+materials in engine? | **Yes** — `DUPLICATE_CONSOLATION` in `encounterEngine.ts` L37–42, applied L171–189                                                                                                  |
| Single ledger entry for duplicate?    | **Yes** — `applyFishingClaim.ts` L68–125: one `commitEconomyAction` with `deltaMaterials: { feather: materials }` and wonder via `applyWonderEarnInMemory` when `wonderAwarded > 0` |
| Catch uses wonderAwarded=0?           | **Yes** — `encounterEngine.ts` L203–205                                                                                                                                             |
| DEV preview isolated?                 | **Yes** — `resolveDevFishingClaim.ts`: engine only, `previewOnly: true`, no Firestore economy writes                                                                                |
| Idempotency key                       | **Yes** — `fishingClaimKey(castId)` → `fishing_claim:{castId}`                                                                                                                      |

### Gaps vs user spec

| Spec item                                                  | Current                                                                     | Action                                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Ledger `metadata: { outcome, creatureTypeId, duplicate }`  | Only `{ claimId }` (+ `wonderTransactionId` on zero-wonder path)            | Stage 1                                                           |
| Unified entry builder                                      | Split: `buildEconomyLedgerEntry` when wonder>0; manual object when wonder=0 | Stage 1                                                           |
| `source` for catch                                         | `fishing_miss_consolation` (misleading)                                     | Stage 1 — add `fishing_catch` or use `actionType`-level semantics |
| `inventoryChanges` on ledger                               | Not in schema; creature via `tx.set` on subcollection                       | Document only — no schema change                                  |
| Integration test: duplicate → one ledger, wonder+materials | Missing                                                                     | Stage 2                                                           |
| Static ban on duplicate compensation callable              | Missing                                                                     | Stage 3                                                           |

---

## Staged PRs

### Stage 0 — Baseline audit doc

**Primary deliverable:** `docs/economy-invariant10-audit.md` (extract Current State section above + flow diagram).

**Files changed:**

- `docs/economy-invariant10-audit.md` (new)

**Migration summary:** Document engine → single ledger path, confirm no `grantDuplicateCompensation`, list metadata/test gaps.

**Invariants verified:** 10a–10h inventory complete

**Remaining legacy paths:** `castClaim` stub; handoff `consolationReward` reference only

**Risks discovered:** Catch ledger `source` mislabel; metadata too sparse for analytics/replay

**Recommended next migration:** Stage 1 metadata hardening

**Gate:**

```bash
cd functions && npm run build
```

---

### Stage 1 — Metadata + entry builder hardening

**Objective:** Align ledger metadata with spec; unify duplicate/miss/catch entry construction.

**Files changed:**

- `functions/src/sanctuary/applyFishingClaim.ts`
- `shared/sanctuary/economy/types.ts` — extend `EconomyLedgerMetadata` with optional `outcome`, `creatureTypeId`, `duplicate`
- `functions/src/sanctuary/economy/types.ts` (synced copy)

**Implementation sketch:**

1. Add helper `buildFishingClaimLedgerEntry({ uid, claim, castId, account, transactionId })` inside `applyFishingClaim.ts` (or shared if reused):
   - `actionType: "fishing_claim"`
   - `idempotencyKey: fishingClaimKey(castId)`
   - `deltaCurrentWonder: claim.wonderAwarded` (via `applyWonderEarnInMemory` when > 0)
   - `deltaMaterials: { feather: claim.materialsAwarded }`
   - `metadata: { claimId: claim.id, outcome: claim.outcome, creatureTypeId: claim.creatureTypeId, duplicate: claim.outcome === "duplicate" }`
   - `source`: map `duplicate` → `fishing_duplicate_consolation`, `miss` → `fishing_miss_consolation`, `catch` → new `fishing_catch` (add to `WonderSource` in `shared/sanctuary/types.ts` + sync)

2. Remove manual `EconomyLedgerEntry` object branch (L103–116); always use unified builder.

3. Keep creature write gated on `economyCommit.committed && claim.outcome === "catch"` (Inv 4e).

**Invariants verified:** 10b, 10c, 10d, 10e

**Remaining legacy paths:** Historical ledger rows without new metadata fields

**Risks discovered:** Adding `fishing_catch` WonderSource requires sync script + type parity check

**Recommended next migration:** Stage 2 integration tests

**Gate:**

```bash
cd functions && npm run build
npm run lint:economy
```

---

### Stage 2 — Integration tests for duplicate single-entry

**Objective:** Prove duplicate path writes exactly one ledger row with combined wonder + materials.

**Files changed:**

- `functions/src/sanctuary/applyFishingClaim.integration.test.ts` (new) **or** extend `claimEncounter.integration.test.ts`
- Optionally extend `shared/sanctuary/fishing/encounterEngine.test.ts`

**Test cases to add:**

| Test                                                                 | Assert                                                                                                                                                           |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `duplicate common pool seeds wonder=1 materials=1`                   | `encounterEngine.test.ts`: `materialsAwarded === DUPLICATE_CONSOLATION.common.materials`                                                                         |
| `applyFishingClaimInTransaction duplicate commits single ledger`     | Exactly 1 `/economyLedger/` write; `deltaCurrentWonder === 1`; `deltaMaterials.feather === 1`; `metadata.duplicate === true`; `metadata.outcome === "duplicate"` |
| `applyFishingClaimInTransaction duplicate idempotent retry`          | Second call: 0 ledger writes; same summary (Inv 3 + 10h)                                                                                                         |
| `applyFishingClaimInTransaction catch commits zero wonder/materials` | 1 ledger write; `deltaCurrentWonder === 0`; `deltaMaterials.feather === 0`; creature subcollection write present                                                 |
| `applyFishingClaimInTransaction miss with materials only`            | 1 ledger write; materials delta; no wonder tx when wonder=0                                                                                                      |
| `executeClaimCastInTransaction full duplicate flow` (optional)       | Mock tx with seeded roll → duplicate; verify ledger + no creature write                                                                                          |

**Mock pattern:** Reuse `MockTransaction` from `claimEncounter.integration.test.ts` / `commitEconomyAction.integration.test.ts`.

**Seed for deterministic duplicate:** From `encounterEngine.test.ts`:

```typescript
caughtIds: new Set(["puddle-dart", "bubble-mote"]),
castId: "dup_0",
rodUiId: "basic",
currentWonderAtClaim: 500,
```

**Invariants verified:** 10c, 10d, 10e, 10h

**Remaining legacy paths:** None on fishing claim path

**Risks discovered:** Integration tests must import synced engine constants to avoid drift

**Recommended next migration:** Stage 3 static guards

**Gate:**

```bash
cd functions && npm run build
```

Add new test file to `functions/package.json` build script if created as separate file.

---

### Stage 3 — Static lint / grep ban

**Objective:** Prevent regression to split duplicate compensation paths.

**Files changed:**

- `functions/scripts/validate-invariant10-fishing-claim.mjs` (new)
- `functions/package.json` — wire script into `build`
- Root `package.json` — add to `lint:economy` chain (optional)
- `eslint-rules/no-client-reward-computation.js` — ban client calls to hypothetical `grantDuplicateCompensation` (if added to BANNED list)

**Script checks:**

1. `rg grantDuplicateCompensation` → must be 0 matches in `functions/src`, `src/`, `shared/`
2. `applyFishingClaim.ts` must contain exactly one `commitEconomyAction` call
3. `resolveDevFishingClaim.ts` must not import `applyFishingClaim` or `commitEconomyAction`
4. No `actionType: "compensation"` paired with fishing duplicate metadata in fishing modules

**Invariants verified:** 10f, 10g

**Remaining legacy paths:** Admin `compensateEconomyEntry` (allowed, Inv 7)

**Risks discovered:** False positives if handoff docs scanned — exclude `docs/handoff/`

**Recommended next migration:** Stage 4 verification doc

**Gate:**

```bash
cd functions && npm run build
npm run lint:economy
```

---

### Stage 4 — Verification doc

**Primary deliverable:** `docs/economy-invariant10-verification.md`

**Files changed:**

- `docs/economy-invariant10-verification.md` (new)
- Cross-links in `docs/economy-invariant8-verification.md`, `docs/economy-invariant5-verification.md`

**Content:**

- Automated gate commands
- Stage deliverable summaries (mirror Inv 8 verification format)
- Test matrix mapping 10a–10h → test name
- Explicit statement: Inv 10 is verification/hardening atop Inv 8, not greenfield

**Final commands:**

```bash
cd functions && npm run build
npm run lint:economy
npm run test:firestore-rules   # if rules touched in prior invariants
```

**Invariants verified:** 10a–10h + Invariants 1–9 preserved

**Remaining legacy paths:** `castClaim` stub; historical ledger metadata without `outcome`/`duplicate`

**Recommended next migration:** Monitor production duplicate claims in analytics; consider ledger replay verifier tagging duplicate rows (Inv 4 Stage 3)

---

## Key File Reference

| Role                | Path                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| Pure engine         | `shared/sanctuary/fishing/encounterEngine.ts` — `resolveFishingClaim`, `DUPLICATE_CONSOLATION` |
| Context wrapper     | `shared/sanctuary/fishing/buildFishingClaimContext.ts` — `resolveFishingClaimFromContext`      |
| Claim orchestration | `functions/src/sanctuary/claimEncounter.ts` — `executeClaimCastInTransaction`                  |
| Ledger persistence  | `functions/src/sanctuary/applyFishingClaim.ts` — `applyFishingClaimInTransaction`              |
| Commit primitive    | `functions/src/sanctuary/economy/commitEconomyAction.ts`                                       |
| Idempotency key     | `shared/sanctuary/economy/callableIdempotencyKeys.ts` — `fishingClaimKey`                      |
| DEV preview         | `src/features/fishing/resolveDevFishingClaim.ts`                                               |
| Client summary      | `shared/sanctuary/fishing/fishingClaimPresentation.ts` — `toClientClaimSummary`                |

### Duplicate consolation constants (engine authority)

```typescript
// shared/sanctuary/fishing/encounterEngine.ts
export const DUPLICATE_CONSOLATION = {
  common: { materials: 1, wonder: 1, spiritEcho: false },
  rare: { materials: 2, wonder: 2, spiritEcho: false },
  epic: { materials: 3, wonder: 4, spiritEcho: true },
  poolComplete: { materials: 0, wonder: 10, spiritEcho: true },
} as const;
```

### Target ledger shape (persisted claims)

```typescript
{
  actionType: "fishing_claim",
  deltaCurrentWonder: claim.wonderAwarded,
  deltaMaterials: { feather: claim.materialsAwarded },
  // creature add: users/{uid}/creatures/{id} — NOT inventoryChanges on ledger
  metadata: {
    claimId: claim.id,
    outcome: claim.outcome,
    creatureTypeId: claim.creatureTypeId,
    duplicate: claim.outcome === "duplicate",
  },
  idempotencyKey: `fishing_claim:${castId}`,
}
```

---

# Execute Phase: Commit Primitive + Idempotency Layer

This section documents how Invariant 10 sits on the **completed** commit primitive work (Invariant 1 plan). Inv 10 does not introduce a new write path — it **constrains** the fishing claim path to single-entry semantics.

## Primary Objective

Single authoritative economy write path:

```
Callable → idempotency check (in tx) → pure engine (shared) → append ledger → project aggregates → commit
```

For fishing claims specifically:

```
claimCast → resolveFishingClaimFromContext (pure) → applyFishingClaimInTransaction → commitEconomyAction (one entry)
```

## Systems to Migrate (economy systems inventory)

| Subsystem          | File                                        | Idempotency key               | Inv 10 relevance                        |
| ------------------ | ------------------------------------------- | ----------------------------- | --------------------------------------- |
| Well reflection    | `submitWellReflection.ts`                   | `well_answer:{localDate}`     | N/A                                     |
| **Fishing claim**  | `applyFishingClaim.ts`, `claimEncounter.ts` | `fishing_claim:{castId}`      | **Primary**                             |
| Lesson complete    | `recordLessonCompletion.ts`                 | `lesson_complete:{lessonId}`  | N/A                                     |
| Rod craft start    | `craftCallables.ts`                         | `craft_start:{rodId}`         | N/A                                     |
| Bait craft         | `index.ts`                                  | `bait_craft:{requestId}`      | N/A                                     |
| Practice           | `index.ts`                                  | `practice:{localDate}:{kind}` | N/A                                     |
| Diary              | `index.ts`                                  | `diary:{requestId}`           | N/A                                     |
| Admin compensation | `compensateEconomyEntry.ts`                 | caller-supplied               | Must not be used for fishing duplicates |
| Cast create        | `createCastTransaction.ts`                  | `cast_create:{requestId}`     | No economy deltas                       |

## Non-Negotiable Invariants

- **Exactly-once delivery:** idempotency doc + ledger doc dedupe per `fishing_claim:{castId}`
- **Idempotent retries:** same key → cached `ClaimSummary`, no second wonder/material grant
- **Replay safety:** ledger fold reproduces balances; metadata enables outcome audit
- **Atomic commits:** ledger + user projection + idempotency in one tx (Inv 4)
- **Deterministic balance:** `assertLedgerMatchesAccount` before commit
- **Append-only ledger:** never update/merge ledger docs (Inv 7)
- **No duplicated/lost rewards:** one engine decision → one ledger row
- **No negative balances:** `assertNonNegativeAccount` (Inv 1)
- **No client-authoritative mutations:** server reads `activeCast` only (Inv 8)
- **Ledger as source of truth:** user balances are projections; fishing duplicate compensation is fully described by one ledger entry

## Implementation Rules

Incremental stages 0–4 above. After each migration:

1. `cd functions && npm run build`
2. `npm run lint:economy` (Stage 3+)
3. Confirm Inv 1–9 tests still pass
4. Do not proceed on red build

## Backwards Compatibility

- No database reset
- Additive metadata only
- `wonderTransactions` dual-write preserved for non-zero wonder fishing claims
- DEV preview unchanged

## Safety Requirements

- Never add a second economy write for duplicate consolation
- Never compute duplicate rewards outside `encounterEngine.ts`
- Creature subcollection writes only when `economyCommit.committed === true`
- Admin `compensation` entries must not replace fishing claim idempotency keys
- Sync integrity: engine changes require `npm run build` (sync-fishing-module.js)

## Validation Checklist

- [ ] `grantDuplicateCompensation` — 0 grep matches
- [ ] Duplicate outcome: engine `wonderAwarded` + `materialsAwarded` match `DUPLICATE_CONSOLATION`
- [ ] Duplicate persistence: exactly 1 ledger row with both deltas
- [ ] Catch persistence: wonder=0, materials=0, creature side effect only
- [ ] Miss persistence: materials (and wonder if non-zero) on same row
- [ ] Idempotent retry: no second ledger write
- [ ] DEV preview: no `applyFishingClaimInTransaction` import
- [ ] Metadata includes `outcome`, `creatureTypeId`, `duplicate` (post Stage 1)
- [ ] `cd functions && npm run build` green
- [ ] `npm run lint:economy` green (post Stage 3)

## Deliverables per Stage

| Stage | Files changed                                  | Migration summary             | Invariants verified | Remaining legacy    | Risks                   | Next               |
| ----- | ---------------------------------------------- | ----------------------------- | ------------------- | ------------------- | ----------------------- | ------------------ |
| 0     | `docs/economy-invariant10-audit.md`            | Baseline audit                | 10a–10h inventory   | castClaim stub      | Sparse metadata         | Stage 1            |
| 1     | `applyFishingClaim.ts`, economy metadata types | Unified builder + metadata    | 10b–10e             | Old ledger rows     | WonderSource sync       | Stage 2            |
| 2     | Integration tests                              | Duplicate single-entry proofs | 10c–10e, 10h        | —                   | Test seed drift         | Stage 3            |
| 3     | validate script, lint chain                    | Grep ban                      | 10f, 10g            | Admin compensation  | Handoff false positives | Stage 4            |
| 4     | `docs/economy-invariant10-verification.md`     | Final gate doc                | 10a–10h + 1–9       | Historical metadata | —                       | Production monitor |

---

## Related Documents

- [Invariant 8 audit](economy-invariant8-audit.md) — one claim per castId
- [Invariant 8 verification](economy-invariant8-verification.md) — idempotency ordering
- [Invariant 5 verification](economy-invariant5-verification.md) — canonical encounter formulas
- [Invariant 4 verification](economy-invariant4-verification.md) — atomic ledger commit
- [Invariant 6 audit](economy-invariant6-audit.md) — DEV preview isolation
- [Economy commit primitive plan](../.cursor/plans/economy_commit_primitive_invariant1.plan.md)
