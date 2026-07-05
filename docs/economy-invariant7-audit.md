# Invariant 7 — Immutable Ledger Baseline Audit

Append-only `economyLedger`; corrections via `compensation` entries only. Builds on Invariants 1–6 (commit primitive + idempotency).

## Ledger write inventory

| Location                                                                              | Operation                            | Notes                                                        |
| ------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| [`commitEconomyAction.ts`](../functions/src/sanctuary/economy/commitEconomyAction.ts) | `tx.set(economyLedger/{id}, entry)`  | **Only** write path; no `merge`, no `update`                 |
| [`commitEconomyAction.ts`](../functions/src/sanctuary/economy/commitEconomyAction.ts) | `tx.set(wonderTransactions/{id}, …)` | Legacy dual-write when `legacyWonderTransactionAmount !== 0` |

No other `collection("economyLedger")` or `collection("wonderTransactions")` references under `functions/src`.

## Call sites (all via `commitEconomyAction`)

| Subsystem         | File                        | Idempotency key                | Entry builder                                                                |
| ----------------- | --------------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| Well reflection   | `submitWellReflection.ts`   | `wellAnswerKey(localDate)`     | `buildEconomyLedgerEntry`                                                    |
| Fishing claim     | `applyFishingClaim.ts`      | `fishingClaimKey(castId)`      | `buildEconomyLedgerEntry` or manual with `ledgerEntryIdForKey` (zero-wonder) |
| Lesson complete   | `recordLessonCompletion.ts` | `lessonCompleteKey(lessonId)`  | `buildEconomyLedgerEntry`                                                    |
| Rod craft start   | `craftCallables.ts`         | `craftStartKey(rodId)`         | `buildEconomyLedgerEntry`                                                    |
| Rod craft collect | `craftCallables.ts`         | `craftCollectKey(rodId)`       | `buildEconomyLedgerEntry`                                                    |
| Bait craft        | `index.ts`                  | `baitCraftKey(requestId)`      | `buildEconomyLedgerEntry`                                                    |
| Practice          | `index.ts`                  | `practiceKey(localDate, kind)` | `buildEconomyLedgerEntry`                                                    |
| Diary reflection  | `index.ts`                  | `diaryKey(requestId)`          | `buildEconomyLedgerEntry`                                                    |

## Document ID conventions

| Collection           | Doc ID today                                           | Deterministic?                  |
| -------------------- | ------------------------------------------------------ | ------------------------------- |
| `economyLedger`      | `ledger_${idempotencyDocId(idempotencyKey)}`           | Yes — via `ledgerEntryIdForKey` |
| `wonderTransactions` | `metadata.wonderTransactionId` (e.g. `tx_${claim.id}`) | No — differs from ledger ID     |
| `economyIdempotency` | `idempotencyDocId(idempotencyKey)`                     | Yes                             |

## Client reads

No `economyLedger` or `wonderTransactions` reads under `src/` (grep clean). Safe to evolve server-side shapes.

## Firestore rules (pre–Invariant 7)

- `economyLedger`: `allow write: if false` (covers create/update/delete for client SDK)
- `wonderTransactions`: same

## Gaps addressed by Invariant 7

1. Rules use `write: false` — split to explicit `create, update, delete: if false` for clarity
2. No static validator banning ledger `update` / merge outside commit path
3. No runtime assertion `entry.id === ledgerEntryIdForKey(idempotencyKey)`
4. No compensation helper or admin callable
5. `wonderTransactions` dual-write lacks `ledgerEntryId` / `idempotencyKey` cross-reference
6. No backfill script for historical `wonderTransactions` → `economyLedger`

## Out of scope (not ledger rows)

See [economy-known-behaviors.md — Authority matrix & Topic 4](economy-known-behaviors.md#authority-matrix).
