# Invariant 10 — Duplicate Compensation Calculated Once Per Cast

Engine decides outcome once; one `economyLedger` row per cast carries all wonder + material deltas. See [Invariant 3](economy-invariant3-verification.md) (idempotency), [Invariant 4](economy-invariant4-verification.md) (atomic commit), [Invariant 7](economy-invariant7-verification.md) (immutable ledger), [Invariant 8](economy-invariant8-verification.md) (one claim per `castId`), [Invariant 10 audit](economy-invariant10-audit.md), and [implementation plan](economy-invariant10-implementation-plan.md).

Inv 10 is **verification and hardening atop Inv 8**, not a greenfield economy path — duplicate consolation was already computed once in the engine and persisted in a single `commitEconomyAction` call before this work began.

## Automated gates

```bash
cd functions && npm run build
npm run lint:economy
```

Build runs (among others):

- `shared/sanctuary/fishing/encounterEngine.test.ts` — `DUPLICATE_CONSOLATION` unit assertions
- `applyFishingClaim.integration.test.ts` — duplicate/miss/catch single-ledger persistence
- `shared/sanctuary/economy/economy.test.ts` — duplicate ledger fold replay (Stage 7; Inv 4 + Inv 10)
- `claimEncounter.integration.test.ts` — full duplicate orchestration (Stage 8) + post-success idempotent retry (Inv 8 + 10h)
- `scripts/validate-invariant10-fishing-claim.mjs` — static single-commit guards

`lint:economy` additionally runs ESLint economy rules (including `grantDuplicateCompensation` ban in `no-client-reward-computation`), `scripts/test-fishing-claim-invariant10.mjs` (client static checks), and `validate-invariant10-fishing-claim.mjs`.

**Final gate result (Stage 10):** 56 tests pass; Invariant 10 static validation passes; client script `test-fishing-claim-invariant10.mjs` passes in `lint:economy`.

## Known behaviors (historical metadata + cap-at-persistence)

See [economy-known-behaviors.md — Topics 1 & 6](economy-known-behaviors.md#topic-1--historical-fishing-metadata-preinv-10).

---

### Stage 0 — Baseline audit

**Files changed:** `docs/economy-invariant10-audit.md`

**Migration summary:** Traced engine → single `commitEconomyAction` path; confirmed no `grantDuplicateCompensation`; inventoried 10a–10h with metadata/test gaps.

**Invariants verified:** 10a–10h inventory complete

**Remaining legacy paths:** `castClaim` no-op stub; handoff `consolationReward` reference only

**Risks discovered:** Catch ledger `source` mislabeled; sparse metadata; no integration test for duplicate persistence

**Recommended next migration:** Stage 1 metadata + unified entry builder

---

### Stage 1 — Metadata + unified entry builder

**Files changed:**

- `functions/src/sanctuary/applyFishingClaim.ts` — `fishingClaimWonderSource`, `buildFishingClaimLedgerResult`, single `commitEconomyAction` path
- `shared/sanctuary/economy/types.ts` — `EconomyLedgerMetadata` extended with `outcome`, `creatureTypeId`, `duplicate`
- `shared/sanctuary/types.ts` — `WonderSource` includes `fishing_catch`
- Synced copies under `functions/src/sanctuary/` via build sync scripts

**Migration summary:**

- `fishingClaimWonderSource`: `duplicate` → `fishing_duplicate_consolation`, `miss` → `fishing_miss_consolation`, `catch` → `fishing_catch`
- `buildFishingClaimLedgerResult` unifies wonder>0 and wonder=0 branches; both use `buildEconomyLedgerEntry`
- Ledger metadata on every fishing claim entry: `{ claimId, outcome, creatureTypeId, duplicate }`
- `deltaMaterials: { feather: claim.materialsAwarded }` on same entry as `deltaCurrentWonder`

**Invariants verified:** 10b, 10c, 10d, 10e

**Remaining legacy paths:** Historical ledger rows without `outcome`/`creatureTypeId`/`duplicate` metadata

**Risks discovered:** None (WonderSource sync covered by `validate-sync-integrity`)

**Recommended next migration:** Stage 2 integration tests

---

### Stage 2 — Integration tests

**Files changed:**

- `functions/src/sanctuary/applyFishingClaim.integration.test.ts` (new)
- `functions/package.json` — test wired into `build` script
- `shared/sanctuary/fishing/encounterEngine.test.ts` — `DUPLICATE_CONSOLATION.common` materials assertion

**Tests in `applyFishingClaim.integration.test.ts`:**

| Test name                                                                                  |
| ------------------------------------------------------------------------------------------ |
| `applyFishingClaimInTransaction duplicate commits single ledger with wonder and materials` |
| `applyFishingClaimInTransaction duplicate idempotent retry writes no ledger`               |
| `applyFishingClaimInTransaction catch commits zero wonder/materials and writes creature`   |
| `applyFishingClaimInTransaction miss with materials only writes ledger without wonder`     |

**Migration summary:** Mock-transaction proofs that duplicate writes exactly one ledger row with combined deltas; catch writes creature subcollection only (non-ledger); idempotent retry writes zero ledger rows.

**Invariants verified:** 10c, 10d, 10e, 10h

**Remaining legacy paths:** None on fishing claim persistence path

**Risks discovered:** None

**Recommended next migration:** Stage 3 static guards

---

### Stage 3 — Static guards

**Files changed:**

- `functions/scripts/validate-invariant10-fishing-claim.mjs` (new)
- `functions/package.json` — script in `build` chain (before sync/tsc)
- Root `package.json` — `lint:economy` includes `validate-invariant10-fishing-claim.mjs`
- `eslint-rules/no-client-reward-computation.js` — `grantDuplicateCompensation` in `BANNED_IMPORTS`

**Script checks:**

1. `grantDuplicateCompensation` — 0 matches in `functions/src`, `src/`, `shared/` (excludes `docs/handoff/`)
2. `applyFishingClaim.ts` — exactly one `commitEconomyAction(` call
3. `resolveDevFishingClaim.ts` — must not reference `applyFishingClaim`, `commitEconomyAction`, or `applyFishingClaimInTransaction`
4. `applyFishingClaim.ts` / `claimEncounter.ts` — no `grantDuplicate` or `actionType: "compensation"` paired with fishing duplicate logic
5. Stage 1 helpers present (`fishingClaimWonderSource` / `fishing_catch`)
6. Stage 9 analytics tag: `duplicate: claim.outcome === "duplicate"` in sanctuaryAnalytics block

**Invariants verified:** 10f, 10g

**Remaining legacy paths:** Admin `compensateEconomyEntry` (allowed, Inv 7)

**Risks discovered:** None

**Recommended next migration:** Stage 4 verification doc (this file)

---

### Stage 4 — Verification doc

**Files changed:** This document; cross-link in `docs/economy-invariant10-audit.md`

**Gate commands:**

```bash
cd functions && npm run build   # 53 tests
npm run lint:economy
```

**Invariants verified:** 10a–10h + Invariants 1–9 preserved

**Remaining legacy paths:** `castClaim` stub; handoff `consolationReward` reference only; historical ledger rows without new metadata fields; creature grant remains subcollection side effect (not `inventoryChanges` on ledger — intentional Inv 4)

**Recommended next migration:** Stage 5 client guard + analytics tag + cross-links

---

### Stage 5 — Client guard + cross-links + analytics tag

**Files changed:**

- `scripts/test-fishing-claim-invariant10.mjs` (new) — client static checks mirroring Inv 8 pattern
- `package.json` — `lint:economy` chain includes `test-fishing-claim-invariant10.mjs` after invariant8 script
- `functions/src/sanctuary/applyFishingClaim.ts` — `sanctuaryAnalytics` write includes `duplicate: claim.outcome === "duplicate"`
- Cross-links: `docs/economy-invariant8-verification.md`, `docs/economy-invariant5-verification.md`, `docs/economy-invariant3-verification.md`
- `docs/economy-invariant10-audit.md` — gaps section updated for Stage 5 closed items

**Client static checks (`test-fishing-claim-invariant10.mjs`):**

| File                        | Assert                                                                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resolveDevFishingClaim.ts` | Contains `previewOnly: true`; uses `resolveFishingClaimFromContext`; does not reference `applyFishingClaim`, `applyFishingClaimInTransaction`, or `commitEconomyAction` |
| `fishingServerCast.ts`      | Does not reference `grantDuplicateCompensation`; uses `claimCast` not `castClaim`; no import of `requestCastClaim` or `castClaim.ts`                                    |

**Migration summary:** Production analytics tag for duplicate claims; client-side regression guard wired into `lint:economy`; cross-links to related invariant verification docs.

**Invariants verified:** 10f, 10g (client layer); production monitoring for duplicate rate

**Remaining legacy paths:** `castClaim` stub; historical ledger rows without new metadata fields; creature grant remains subcollection side effect (not `inventoryChanges` on ledger — intentional Inv 4)

**Risks discovered:** None

**Recommended next migration:** Stage 6 final gate (this file)

---

### Stage 6 — Final gate

**Files changed:** This document; `docs/economy-invariant10-audit.md`; cross-links in [Invariant 4](economy-invariant4-verification.md) and [Invariant 7](economy-invariant7-verification.md) verification docs

**Final commands:**

```bash
cd functions && npm run build   # 53 tests
npm run lint:economy
```

**Invariants verified:** 10a–10h + Invariants 1–9 preserved

**Remaining legacy paths:** `castClaim` stub; handoff `consolationReward` reference only; historical ledger rows without new metadata fields; creature grant remains subcollection side effect (not `inventoryChanges` on ledger — intentional Inv 4)

**Recommended next migration:** Stage 7 ledger replay fold proof (Inv 4 + Inv 10)

---

### Stage 7 — Ledger replay fold (duplicate fishing)

**Files changed:**

- `shared/sanctuary/economy/economy.test.ts` — `duplicate fishing ledger entry folds wonder and materials from single row`
- This document — Stage 7 section + test matrix row
- Cross-links in [Invariant 4](economy-invariant4-verification.md) and [Invariant 7](economy-invariant7-verification.md) ledger replay sections

**Final commands:**

```bash
cd functions && npm run build   # 54 tests
npm run lint:economy
```

**Migration summary:** Proves that folding **one** duplicate `fishing_claim` ledger row (built via `applyWonderEarnInMemory` + `buildEconomyLedgerEntry`, matching `applyFishingClaim`) yields exactly one wonder grant (+1 current/stored/lifetime from 500→501) and one feather materials delta via `projectEconomyCommit` + `additionalUserPatch` — no second ledger entry required for materials.

**Invariants verified:** 10d (combined deltas on one row); Inv 4 replay/deterministic balance; Inv 7 append-only fold semantics

**Remaining legacy paths:** `castClaim` stub; historical ledger rows without new metadata fields; creature grant remains subcollection side effect (not `inventoryChanges` on ledger — intentional Inv 4)

**Risks discovered:** None

**Recommended next migration:** Stage 8 full duplicate orchestration test + `castClaim` deprecation

---

### Stage 8 — Full duplicate orchestration + castClaim deprecation

**Files changed:**

- `functions/src/sanctuary/claimEncounter.integration.test.ts` — `MockTransaction.seedCreatures`; `executeClaimCastInTransaction duplicate outcome commits single ledger entry`
- `functions/src/index.ts` — `@deprecated` JSDoc on `castClaim` (use `claimCast`; no economy writes)
- This document; `docs/economy-invariant10-audit.md`

**Tests in `claimEncounter.integration.test.ts`:**

| Test name                                                                     |
| ----------------------------------------------------------------------------- |
| `executeClaimCastInTransaction duplicate outcome commits single ledger entry` |

**Final commands:**

```bash
cd functions && npm run build   # 55 tests
npm run lint:economy
```

**Migration summary:** End-to-end orchestration from `executeClaimCastInTransaction` through engine → `applyFishingClaimInTransaction` → single ledger commit for duplicate outcome. Full basic pool seeded (includes `puddle-dart`, `bubble-mote`) for deterministic duplicate on `dup_0`. `castClaim` marked deprecated for backwards compat only.

**Invariants verified:** 10a–10h (orchestration layer)

**Remaining legacy paths:** Historical ledger rows without `outcome`/`creatureTypeId`/`duplicate` metadata; handoff `consolationReward` reference only; `castClaim` callable retained but deprecated

**Recommended next migration:** Stage 9 production monitoring hardening

---

### Stage 9 — Production monitoring

**Files changed:**

- `shared/sanctuary/analytics/events.ts` — `fishing_claim` type includes `duplicate?`, `rarityIndicator?`
- `functions/src/sanctuary/applyFishingClaim.integration.test.ts` — duplicate test asserts `sanctuaryAnalytics` write
- `functions/scripts/validate-invariant10-fishing-claim.mjs` — guard for `duplicate: claim.outcome === "duplicate"` in analytics block
- This document — Stage 9 section; test matrix 10g monitoring note

**Production query:**

```
users/{uid}/sanctuaryAnalytics where type == "fishing_claim" && duplicate == true
```

**Final commands:**

```bash
cd functions && npm run build   # 55 tests
npm run lint:economy
```

**Invariants verified:** 10g (monitoring layer); analytics tag on duplicate claims

**Recommended next migration:** Stage 10 program closure

---

### Stage 10 — Program closure

**Files changed:**

- `functions/src/sanctuary/claimEncounter.integration.test.ts` — removed redundant duplicate test (one orchestration test with ledger + analytics + no creature writes)
- `src/services/firebase/castClaim.ts` — `@deprecated` on `requestCastClaim` (fishing uses `claimCast` via `fishingServerCast`)
- `scripts/test-fishing-claim-invariant10.mjs` — asserts `fishingServerCast` uses `claimCast`, not legacy `castClaim` callable
- `docs/economy-invariant8-verification.md` — `castClaim` deprecation marked done
- This document; `docs/economy-invariant10-audit.md`

**Final commands:**

```bash
cd functions && npm run build   # 56 tests
npm run lint:economy
```

**Invariants verified:** 10a–10h + Invariants 1–9 preserved; legacy `castClaim` paths **removed** (2026-06-29)

**Remaining legacy paths:** Historical ledger rows without new metadata; handoff `consolationReward` reference only

**Recommended next migration:** Invariant 9 craft or next economy subsystem (well, craft, bait) — not more Inv 10 stages

**Inv 10 program complete (Stages 0–10).**

---

## Invariant 10a–10h test matrix

| ID      | Rule                                                                                      | How verified                                                                                      | Test / file                                                                                                                                                                                                                                                 |
| ------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **10a** | Outcome decided once per cast by `resolveFishingClaim`                                    | Single engine call in `executeClaimCastInTransaction`; no second compensation pass at persistence | `claimEncounter.ts` flow; `encounterEngine.test.ts`; `claimEncounter.integration.test.ts` — `executeClaimCastInTransaction duplicate outcome commits single ledger entry`                                                                                   |
| **10b** | Duplicate consolation only from `DUPLICATE_CONSOLATION` — never recomputed at persistence | `applyFishingClaim` reads `claim.wonderAwarded` / `claim.materialsAwarded` only                   | `encounterEngine.test.ts` — `duplicate when entire pool is already caught` asserts `DUPLICATE_CONSOLATION.common` wonder + materials                                                                                                                        |
| **10c** | Exactly one `economyLedger` row: `fishing_claim:{castId}`                                 | One `commitEconomyAction` per claim                                                               | `applyFishingClaim.integration.test.ts` — duplicate/catch/miss each assert `ledgerWrites.length === 1`; `claimEncounter.integration.test.ts` — duplicate orchestration; `validate-invariant10-fishing-claim.mjs` — single `commitEconomyAction`             |
| **10d** | Row carries all economy deltas (`deltaCurrentWonder` + `deltaMaterials.feather`)          | Combined on same ledger entry; ledger fold reproduces balances from one row                       | `applyFishingClaim.integration.test.ts` — duplicate asserts wonder=1 + feather=1 on one entry; `economy.test.ts` — `duplicate fishing ledger entry folds wonder and materials from single row`                                                              |
| **10e** | Catch: wonder=0, materials=0; creature is non-ledger side effect                          | Engine returns zeros; creature `tx.set` gated on `committed && outcome === "catch"`               | `applyFishingClaim.integration.test.ts` — catch test; `encounterEngine.test.ts` — catch branch                                                                                                                                                              |
| **10f** | No `grantDuplicateCompensation` or equivalent second write                                | Grep ban + ESLint import ban                                                                      | `validate-invariant10-fishing-claim.mjs`; `eslint-rules/no-client-reward-computation.js`                                                                                                                                                                    |
| **10g** | DEV preview: engine only, no persistence; production duplicate monitoring                 | No economy imports in dev preview module; `sanctuaryAnalytics.duplicate` tag on duplicate claims  | `validate-invariant10-fishing-claim.mjs` — `resolveDevFishingClaim.ts` isolation + analytics duplicate guard; `scripts/test-fishing-claim-invariant10.mjs` — `previewOnly: true`; query `sanctuaryAnalytics` where `type==fishing_claim && duplicate==true` |
| **10h** | Idempotent retry → cached summary, no second grant                                        | Idempotency hit before ledger write                                                               | `applyFishingClaim.integration.test.ts` — duplicate idempotent retry; `claimEncounter.integration.test.ts` — `executeClaimCastInTransaction post-success retry returns idempotency cache`                                                                   |

---

## Manual validation checklist

- [ ] **Balance integrity:** After duplicate claim, `currentWonder` increases by `DUPLICATE_CONSOLATION` tier wonder only; `inventory.baitMaterials.feather` increases by tier materials only — no double bump on retry
- [ ] **Ledger integrity:** One `/economyLedger/` doc per `castId`; metadata includes `outcome`, `creatureTypeId`, `duplicate`; `source` is `fishing_duplicate_consolation` / `fishing_miss_consolation` / `fishing_catch` as appropriate
- [ ] **Duplicate retry:** Claim same cast twice (network retry) → same `ClaimSummary`, zero additional ledger rows
- [ ] **Catch path:** New creature in `users/{uid}/creatures/{id}`; ledger row has zero wonder and zero materials
- [ ] **Miss path:** Materials-only ledger when `wonderAwarded === 0`; no `wonderTransactions` dual-write
- [ ] **DEV preview:** `resolveDevFishingClaim` returns `previewOnly: true`; no Firestore economy writes
- [ ] **Analytics:** `sanctuaryAnalytics` fishing_claim events include `duplicate: true` when outcome is duplicate
- [ ] **No split compensation:** Confirm no second callable or helper grants duplicate wonder/materials outside `claimCast`
- [ ] **Gates green:** `cd functions && npm run build` and `npm run lint:economy` pass
