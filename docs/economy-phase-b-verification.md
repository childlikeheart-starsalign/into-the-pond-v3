# Economy Phase B — Ledger Gap Closure Verification

Verification date: 2026-06-29

Phase B uses the existing **`commitEconomyAction`** pipeline ([Invariant 4](economy-invariant4-verification.md), [Invariant 7](economy-invariant7-verification.md)) — not a parallel `functions/src/economy/ledger/*` tree.

## Gate 0 — Prod Firestore rules

| Check                                        | Result                                                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `npm run test:firestore-rules`               | **Pass** — 15/15 (Java auto-detect via `scripts/run-firestore-rules-test.mjs`)                |
| Prod vs repo                                 | **Match** — project `into-the-pond`; `cd functions && npm run get:firestore-rules >/dev/null` |
| `economyLedger` / `economyIdempotency` rules | Owner read; client write denied                                                               |

## Gate 1 — Build baseline

| Command                            | Result                |
| ---------------------------------- | --------------------- |
| `cd functions && npm run build`    | **Pass** — 70 tests   |
| `cd functions && npx tsc --noEmit` | **Pass** (after sync) |
| `npm run lint:economy`             | **Pass**              |

---

## Ledger call-site audit

All economy mutations write `users/{uid}/economyLedger` via `commitEconomyAction` (plus optional `wonderTransactions` dual-write when wonder delta ≠ 0).

| Callable          | File                        | actionType          | Status                   |
| ----------------- | --------------------------- | ------------------- | ------------------------ |
| Fishing claim     | `applyFishingClaim.ts`      | `fishing_claim`     | Pre-existing             |
| Well reflection   | `submitWellReflection.ts`   | `well_reflection`   | Pre-existing             |
| Lesson complete   | `recordLessonCompletion.ts` | `lesson_complete`   | Pre-existing             |
| Practice          | `index.ts`                  | `practice_complete` | Pre-existing             |
| Free diary        | `index.ts`                  | `diary_reflection`  | Pre-existing             |
| Rod craft start   | `craftCallables.ts`         | `craft_start`       | Pre-existing             |
| Bait craft        | `index.ts`                  | `bait_craft`        | Pre-existing             |
| **Collect craft** | `craftCallables.ts`         | `craft_collect`     | **Closed (Phase B gap)** |
| **Equip rod**     | `craftCallables.ts`         | `rod_equip`         | **Closed (Phase B gap)** |
| **Create cast**   | `createCastTransaction.ts`  | `cast_create`       | **Closed (Phase B gap)** |

### Intentional divergences from original Phase B task spec

- **No separate `duplicate_compensation` row** — [Invariant 10](economy-invariant10-verification.md): duplicate wonder + materials on one `fishing_claim` entry.
- **Schema** — `deltaMaterials: { feather, scale, glimmerdust }`, `timestamp: number`; rod/bait context in `metadata` (not top-level `rodStateChange` / `localDate`).
- **Audit-only entries** — `buildAuditOnlyLedgerEntry()` in `shared/sanctuary/economy/applyLedgerEntry.ts` (zero deltas, no `wonderTransactions` write).

---

## Admin reconciliation

- **`reconcileUser(uid)`** — `functions/src/sanctuary/economy/reconcileUser.ts` (read-only fold + drift report; no auto-correct).
- **`adminReconcileUser`** callable — gated by `assertEconomyAdminOrThrow` (same as `compensateEconomyEntry`).

**Caveat:** Pre-ledger balances and unmigrated `wonderTransactions` will show drift until Phase C backfill. `hasDrift === false` only for users whose full history is in `economyLedger`.

---

## Emulator manual checklist

When running against Firestore emulator + Functions:

1. Complete a lesson → one `lesson_complete` ledger row; same `lessonId` retry → no second row
2. Well reflection → `well_reflection`
3. Practice → `practice_complete`
4. Craft start → `craft_start` with negative `deltaStoredWonder` + `deltaParts`
5. Collect craft → `craft_collect` (zero deltas; metadata has rod state transition)
6. Equip rod → `rod_equip` (zero deltas)
7. Create cast → `cast_create` (zero deltas; bait in metadata)
8. Fishing duplicate → **single** `fishing_claim` row (not `duplicate_compensation`)
9. `adminReconcileUser({ uid })` → interpret drift (expect non-zero for legacy users)

---

## Phase C backfill plan (document only — do not run in Phase B)

**Sources:**

- `wonderTransactions` → reconstruct earn/spend entries
- `fishingClaims` → reconstruct `fishing_claim` entries predating Phase B
- `lessonProgress` → reconstruct `lesson_complete` entries

**Rules:**

- One-time admin script on staging copy of prod first
- Write entries with `metadata.backfilled: true`
- Run `adminReconcileUser` until `hasDrift === false` on staging
- Then run on production
- Not a Cloud Function; not part of this PR

**Gate before Phase C cutover:** reconciliation shows zero drift for at least one week of production data after backfill.

---

## Automated test coverage (Phase B additions)

| Area                                        | Test file                                  |
| ------------------------------------------- | ------------------------------------------ |
| `buildAuditOnlyLedgerEntry`                 | `shared/sanctuary/economy/economy.test.ts` |
| `craft_collect` / `rod_equip` audit commits | `commitEconomyAction.integration.test.ts`  |
| `cast_create` ledger + idempotency          | `createCast.integration.test.ts`           |
| Reconciliation fold/drift                   | `reconcileUser.test.ts`                    |

---

## Final gates (2026-06-29)

All gates in Gate 1 section pass. Firestore rules tests pass locally.
