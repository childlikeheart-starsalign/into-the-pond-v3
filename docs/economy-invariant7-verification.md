# Invariant 7 — Immutable Ledger Verification

Append-only `economyLedger`; corrections via `compensation` entries only. See also [Invariant 4](economy-invariant4-verification.md) (atomic commit), [Invariant 8](economy-invariant8-verification.md) (fishing claim idempotency), [Invariant 10](economy-invariant10-verification.md) (fishing duplicate entries: append-only ledger rows with combined wonder + material deltas), and [baseline audit](economy-invariant7-audit.md).

## Automated gates

```bash
cd functions && npm run build
npm run test:firestore-rules   # root — rules immutability
npm run lint:economy           # root — client economy guards
```

Build runs:

- `validate-ledger-immutability.js` — bans ledger writes outside `commitEconomyAction` and merge/update on ledger
- `economy.test.ts` — compensation helpers + deterministic IDs; duplicate fishing fold ([Invariant 10](economy-invariant10-verification.md) Stage 7); checkpoint + tail fold equivalence
- `computeEconomyProjection.test.ts` — ledger read cap at 450+ entries; checkpoint tail path
- `commitEconomyAction.integration.test.ts` — per-subsystem ledger compliance + idempotency

## Firestore rules

`economyLedger`, `economyLedgerCheckpoint`, and `wonderTransactions`:

- `allow read: if isOwner(uid)`
- `allow create, update, delete: if false` (Admin SDK only)

`economyLedgerCheckpoint` stores a **folded prefix** of ledger sums. It does not mutate or delete ledger rows (Invariant 7 append-only audit trail preserved).

## Authoritative write path

[`commitEconomyAction`](../functions/src/sanctuary/economy/commitEconomyAction.ts):

1. Idempotency read
2. Fresh user read
3. `build()` → entry with `entry.id === ledgerEntryIdForKey(idempotencyKey)`
4. `assertNonNegativeAccount` + `assertLedgerMatchesAccount`
5. `tx.set` user projection (merge on user doc only)
6. `tx.set economyLedger/{id}` — **append-only, no merge**
7. Optional `wonderTransactions` dual-write (when `legacyWonderTransactionAmount !== 0` and `ECONOMY_LEDGER_ONLY` is not `true`)
8. `tx.set economyIdempotency`

Admin corrections: [`compensateEconomyEntry`](../functions/src/sanctuary/economy/compensateEconomyEntry.ts) callable with `economyAdmin` claim or `ECONOMY_ADMIN_UIDS` allowlist.

---

### Stage 0 — Baseline audit

**Files changed:** `docs/economy-invariant7-audit.md`

**Migration summary:** Documented single ledger write path, call-site inventory, ID conventions, gaps.

**Invariants verified:** 7a (inventory), 7b (call sites use deterministic builders)

**Remaining legacy mutation paths:** `wonderTransactions` dual-write in `commitEconomyAction`

**Risks discovered:** `functions/src/sanctuary/types.ts` WonderSource is hand-maintained separately from `shared/sanctuary/types.ts`

**Recommended next migration:** Stage 1 rules hardening

---

### Stage 1 — Firestore rules

**Files changed:** `firestore.rules`, `tests/firestore.rules.test.ts`

**Migration summary:** Explicit `create, update, delete: if false` for ledger subcollections; tests deny client update/delete and allow owner read.

**Invariants verified:** 7a (client cannot mutate ledger)

**Remaining legacy mutation paths:** Admin SDK append-only writes via `commitEconomyAction`

**Risks discovered:** None

**Recommended next migration:** Stage 2 code enforcement

---

### Stage 2 — Code enforcement

**Files changed:** `validate-ledger-immutability.js`, `functions/package.json`, `commitEconomyAction.ts`, `shared/sanctuary/economy/types.ts`

**Migration summary:** Static scan wired into build; runtime `IDEMPOTENCY_CONFLICT` if entry id/key mismatch.

**Invariants verified:** 7a, 7b, 7d

**Remaining legacy mutation paths:** Same dual-write

**Risks discovered:** Validator allowlists `compensateEconomyEntry.ts` for ledger reads only

**Recommended next migration:** Stage 3 compensation

---

### Stage 3 — Compensation primitive

**Files changed:** `shared/sanctuary/economy/compensation.ts`, `compensateEconomyEntry.ts`, `assertEconomyAdmin.ts`, `functions/src/index.ts`, `shared/sanctuary/types.ts`, `functions/src/sanctuary/types.ts`

**Migration summary:** `buildCompensationLedgerEntry`, admin callable, `economy_compensation` WonderSource.

**Invariants verified:** 7c (compensation metadata), 7d (idempotent compensation keys)

**Remaining legacy mutation paths:** None outside commit path

**Risks discovered:** Admin UIDs must be configured before production use

**Recommended next migration:** Subsystem verification stages 4–8

---

### Stage 4 — Well reflection

**Files changed:** `commitEconomyAction.integration.test.ts`

**Migration summary:** Verified `wellAnswerKey` + `buildEconomyLedgerEntry` in `submitWellReflection.ts`; integration test added.

**Invariants verified:** 7b, 7d, atomic commit (Inv 4)

**Remaining legacy mutation paths:** Dual-write when wonder moved

**Risks discovered:** None

**Recommended next migration:** Stage 5 fishing

---

### Stage 5 — Fishing claim

**Files changed:** `commitEconomyAction.integration.test.ts`

**Migration summary:** Zero-wonder path uses `ledgerEntryIdForKey`; no `wonderTransactions` when amount is 0. Duplicate consolation is one append-only ledger row with combined `deltaCurrentWonder` + `deltaMaterials` per cast — see [Invariant 10](economy-invariant10-verification.md).

**Invariants verified:** 7a, 7b, 7d

**Remaining legacy mutation paths:** Dual-write when `wonderAwarded > 0`

**Risks discovered:** None

**Recommended next migration:** Stage 6 lesson

---

### Stage 6 — Lesson reflection

**Files changed:** `commitEconomyAction.integration.test.ts`

**Migration summary:** `lessonCompleteKey` + `buildEconomyLedgerEntry` verified via integration test.

**Invariants verified:** 7b, dual-write cross-reference fields

**Remaining legacy mutation paths:** Dual-write

**Risks discovered:** None

**Recommended next migration:** Stage 7 craft

---

### Stage 7 — Rod craft

**Files changed:** `commitEconomyAction.integration.test.ts`

**Migration summary:** `craftStartKey` spend shape verified.

**Invariants verified:** 7b, negative balance guard (Inv 1)

**Remaining legacy mutation paths:** Dual-write on spend

**Risks discovered:** None

**Recommended next migration:** Stage 8 bait/practice/diary

---

### Stage 8 — Bait, practice, diary

**Files changed:** `commitEconomyAction.integration.test.ts`, `economy.test.ts`

**Migration summary:** `baitCraftKey`, `practiceKey`, `diaryKey` shapes verified in integration tests.

**Invariants verified:** 7b, 7d

**Remaining legacy mutation paths:** Dual-write

**Risks discovered:** None

**Recommended next migration:** Stage 9 wonderTransactions migration

---

### Stage 9 — wonderTransactions migration

**Files changed:** `commitEconomyAction.ts`, `backfill-economy-ledger-from-wonder-tx.js`

**Migration summary:** Dual-write enriched with `ledgerEntryId`, `actionType`, `idempotencyKey`; `ECONOMY_LEDGER_ONLY=true` skips dual-write; backfill script (dry-run default, ledger-only).

**Invariants verified:** 7e (ledger as truth; wonderTransactions transitional)

**Remaining legacy mutation paths:** Dual-write until ops sets `ECONOMY_LEDGER_ONLY`

**Risks discovered:** Backfill must not replay balance mutations

**Recommended next migration:** Monitor production; run backfill dry-run; enable `ECONOMY_LEDGER_ONLY` after sign-off

---

### Stage 10 — Final gate

**Files changed:** This document, cross-link in `economy-invariant4-verification.md`

**Invariants verified:** All stages 0–9 checklists

**Final commands:**

```bash
cd functions && npm run build
npm run lint:economy
```

---

### Stage 11 — Ledger read cap (checkpoint compaction)

**Files changed:** `shared/sanctuary/economy/types.ts`, `foldLedger.ts`, `computeEconomyProjection.ts`, `compactionConstants.ts`, `functions/src/sanctuary/economy/compactEconomyLedger.ts`, `reconcileUser.ts`, `firestore.rules`, `firestore.indexes.json`, `economyFieldRegistry.ts`

**Migration summary:** Server-maintained `economyLedgerCheckpoint/summary` folds ledger prefix; `commitEconomyAction` reads checkpoint + tail. Compaction via `adminCompactEconomyLedger` and `scheduledEconomyLedgerCompaction`. Ledger rows never deleted.

**Invariants verified:** 7a (append-only ledger unchanged); checkpoint is separate doc, not a ledger mutation

**Compaction triggers:** `COMPACT_WHEN_TOTAL_ENTRIES` (350), `COMPACT_KEEP_TAIL_ENTRIES` (100), commit refuses when tail ≥ `COMPACT_TAIL_HARD_LIMIT` (300)

**Ops:** `firebase deploy --only firestore:indexes` then Functions deploy with scheduled compaction
