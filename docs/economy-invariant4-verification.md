# Invariant 4 — Atomic Balance + Ledger Verification

Every wonder/inventory economy mutation commits user projection and `economyLedger` row in the **same** Firestore transaction—or not at all.

See also [Invariant 7 — Immutable Ledger](economy-invariant7-verification.md) for append-only ledger rules, compensation entries, and `wonderTransactions` migration, and [Invariant 10](economy-invariant10-verification.md) (fishing duplicate consolation: wonder + materials on one atomic ledger row per cast).

## Automated gates

```bash
cd functions && npm run build
```

Build runs:

- `scripts/validate-economy-atomicity.js` — rejects legacy split-commit helpers and direct economy `tx.set` outside allowlist
- `shared/sanctuary/economy/economy.test.ts` — ledger fold + `assertLedgerMatchesAccount`
- `src/sanctuary/economy/commitEconomyAction.integration.test.ts` — tx abort / idempotency hit writes nothing

## Authoritative write path

[`commitEconomyAction`](functions/src/sanctuary/economy/commitEconomyAction.ts):

1. Idempotency read
2. Fresh user read
3. Build ledger entry + next account
4. `assertNonNegativeAccount` + `assertLedgerMatchesAccount`
5. `tx.set` user projection + `economyLedger` + optional `wonderTransactions` + idempotency doc

## commitEconomyAction call sites

| Callable           | File                                             |
| ------------------ | ------------------------------------------------ |
| Well reflection    | `submitWellReflection.ts`                        |
| Fishing claim      | `applyFishingClaim.ts`                           |
| Lesson complete    | `recordLessonCompletion.ts`                      |
| Rod craft start    | `craftCallables.ts`                              |
| Rod craft collect  | `craftCallables.ts` (`craft_collect` audit)      |
| Rod equip          | `craftCallables.ts` (`rod_equip` audit)          |
| Create cast        | `createCastTransaction.ts` (`cast_create` audit) |
| Bait craft         | `index.ts`                                       |
| Practice           | `index.ts`                                       |
| Diary (non-lesson) | `index.ts`                                       |

## Exempt user patches (not ledger events)

Full table and rationale: [economy-known-behaviors.md — Topics 2–3](economy-known-behaviors.md#topic-2--lazy-daily-counter-reset).

Lazy counter reset on well + fishing paths; baits, progression, session state, and side effects remain exempt from ledger rows.

## Inventory atomicity

| Path              | `deltaParts`    | `deltaMaterials`              |
| ----------------- | --------------- | ----------------------------- |
| `craft_start`     | `-cost.parts`   | —                             |
| `lesson_complete` | `+partsAwarded` | —                             |
| `bait_craft`      | —               | material spends               |
| `fishing_claim`   | `0`             | `feather` (+ inventory patch) |

## Side-effect ordering (ledger anchor)

- **Fishing claim:** `commitEconomyAction` first — duplicate wonder + materials on a single ledger entry per `castId` ([Invariant 10](economy-invariant10-verification.md)); creature / `fishingClaims` / analytics only when `committed === true`
- **Lesson complete:** diary entry `lesson_diary:{lessonId}` in same tx as economy commit
- **Well / practice / diary:** side effects gated on `committed === true` (Invariant 3e + 4e)

## Manual atomicity checklist

1. **Insufficient wonder:** start craft with insufficient stored Wonder → no balance change, no ledger row
2. **Fishing claim retry:** same `castId` → one ledger row, one creature
3. **Lesson retry:** same `lessonId` → one ledger row, one diary doc (`lesson_diary:{lessonId}`)
4. **Idempotency hit:** second call → cached response, zero new writes

## Legacy helpers (must throw)

`earnWonder`, `spendCurrentWonder`, `persistWonderTransaction` in `wonderEconomy.ts` — deprecated; CI fails if called elsewhere.

## Ledger replay (optional spot-check)

For a test user, sum `economyLedger` `deltaCurrentWonder` / `deltaStoredWonder` and compare to `users/{uid}` projection. Full scheduled verifier is a follow-up; forward commits are atomic via `commitEconomyAction`.

Duplicate fishing claims: `economy.test.ts` — `duplicate fishing ledger entry folds wonder and materials from single row` ([Invariant 10](economy-invariant10-verification.md) Stage 7).
