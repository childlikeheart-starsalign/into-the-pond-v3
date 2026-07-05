# Economy Phase C — Ledger Authoritative Verification

Verification date: 2026-06-29 (partial ops sign-off — dry-run + baseline probe)

Phase C makes **`economyLedger` the source of truth** for user aggregates. `commitEconomyAction` folds ledger rows (including the pending entry) and writes `users/{uid}` projection fields. Legacy `wonderTransactions` dual-write is skipped when `ECONOMY_LEDGER_ONLY=true`.

## Known behaviors (ops hub)

Intentional economy behaviors that can look like bugs during backfill, reconciliation, or drift monitoring — **not balance bugs** unless noted.

**Canonical reference:** [economy-known-behaviors.md](economy-known-behaviors.md) — authority matrix, reconcile v2, lazy counters, backfill skip logic, scaling triggers.

`adminReconcileUser` checks wonder, parts, materials, `lifetimeWonderEarned`, and bait replay — not counters, `playerRods`, or other exempt side effects.

## Gate 0 — Ops pre-conditions

| Check                              | Status                           | Notes                                                                                                                                                  |
| ---------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Invariant 2 — prod Firestore rules | **Live**                         | Verified 2026-06-29 — `get:firestore-rules` MATCH; see [economy-invariant2-verification.md](economy-invariant2-verification.md)                        |
| Local automated gates              | **Pass**                         | 2026-06-29 — registry, `test:firestore-rules` (15/15), `functions npm run build` (70 tests)                                                            |
| Prod dry-run backfill              | **Complete**                     | 2026-06-29 — see rollout log; **0 users** in prod Firestore                                                                                            |
| Sample `adminReconcileUser`        | **N/A (empty prod)**             | No `users/{uid}` docs in project `into-the-pond`; re-run when prod has user data                                                                       |
| `admin/economyDriftReport`         | **Absent**                       | Doc does not exist (expected with 0 users / scheduler not yet alerting)                                                                                |
| Full backfill commit               | **Pending**                      | Blocked until prod has legacy user data to backfill                                                                                                    |
| Zero-drift all users               | **Pending**                      | Requires commit + active users                                                                                                                         |
| `ECONOMY_LEDGER_ONLY` cutover      | **Config ready; deploy pending** | Committed in [`functions/.env.into-the-pond`](../functions/.env.into-the-pond); applied on next `firebase deploy --only functions` after Blaze upgrade |
| Phase B live ≥ 7 days              | **Document**                     | Phase B verification dated 2026-06-29 in repo; confirm prod deploy date before cutover                                                                 |
| Staging Firebase project           | **Optional**                     | Recommended before large prod user base; prod currently empty                                                                                          |

**Stop production cutover if:** backfill errors, staging reconciliation fails, or prod canary shows multi-unit drift (`|drift| > 2` on any field).

### Prod Firestore probe (2026-06-29)

Service account project: `into-the-pond`. Root collections: **none**. `users` count: **0**. Backfill dry-run completed with `users=0 scanned=0 created=0 skipped=0 errors=0`. Economy ops sign-off for backfill/reconcile must be **re-run** once real user documents exist in Firestore.

---

## Phase 0 — Path A pre-launch (2026-06-29)

| Step                                      | Status                     | Notes                                                                                                                                                          |
| ----------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1 Local gates                           | **Pass**                   | `functions npm run build`, `npm run lint:economy`, `npm run test:firestore-rules` (17/17)                                                                      |
| 0.2 `ECONOMY_LEDGER_ONLY` config          | **Ready**                  | [`functions/.env.into-the-pond`](../functions/.env.into-the-pond) — loaded on deploy for project `into-the-pond`                                               |
| 0.3 `firebase.json` predeploy             | **Ready**                  | `npm run build` in `functions/` before functions deploy                                                                                                        |
| 0.4 Smoke script                          | **Pass (local + probe)**   | `npm run smoke:economy-phase0` / `smoke:economy-phase0:probe`                                                                                                  |
| 0.5 Firestore indexes + rules deploy      | **Retry**                  | Rules compile OK; deploy hit transient 503 — re-run `firebase deploy --only firestore:indexes,firestore:rules`                                                 |
| 0.6 Functions deploy                      | **Blocked**                | Project must be on **Blaze** plan — [upgrade](https://console.firebase.google.com/project/into-the-pond/usage/details) then `firebase deploy --only functions` |
| 0.7 Prod reconcile probe                  | **Pass**                   | `users/economy_phase0_probe` created; `reconcileUser` → `hasDrift: false` (0 ledger rows)                                                                      |
| 0.8 Callable smoke (well/bait/cast/claim) | **After functions deploy** | Requires deployed callables + authenticated test client                                                                                                        |

**Deploy commands (after Blaze upgrade):**

```bash
firebase deploy --only firestore:indexes,firestore:rules
firebase deploy --only functions
npm run smoke:economy-phase0:probe
```

**Verify ledger-only after deploy:** integration test `commitEconomyAction skips wonderTransactions when ECONOMY_LEDGER_ONLY=true`; confirm no `wonderTransactions` subcollection writes on first real economy commit.

---

## Architecture — projection in `commitEconomyAction`

Write order (single Firestore transaction):

1. Idempotency read
2. User read → `build()` returns `{ entry, additionalUserPatch?, response }` (no `nextAccount`)
3. `computeEconomyProjectionInTransaction` — fold committed ledger + pending entry; solvency guard
4. `tx.set` `economyLedger/{id}` (append-only)
5. `tx.set` user doc — wonder + `inventory.parts` + `inventory.baitMaterials` from projection; merge exempt patches (`activeCast`, `fishingWonderToday`, `inventory.baits`, `completedLessons`, etc.)
6. `wonderTransactions` dual-write when wonder delta ≠ 0 and `ECONOMY_LEDGER_ONLY !== true`
7. Idempotency write

Shared helpers:

- `shared/sanctuary/economy/foldLedger.ts` — `foldLedgerEntries`, `projectionFromLedgerEntries`, `projectionFromCheckpointAndEntries`, `buildCheckpointFromSortedEntries`
- `shared/sanctuary/economy/computeEconomyProjection.ts` — checkpoint + tail projection; `MAX_LEDGER_READS_PER_TX` (450), `COMPACT_TAIL_HARD_LIMIT` (300)
- `shared/sanctuary/economy/compactionConstants.ts` — compaction thresholds
- `users/{uid}/economyLedgerCheckpoint/summary` — server-maintained folded prefix (ledger rows stay append-only)

### Ledger read cap — checkpoint compaction

Heavy users (>350 ledger rows) are compacted by `scheduledEconomyLedgerCompaction` or `adminCompactEconomyLedger`. Commits read checkpoint + tail instead of the full ledger.

**Ops runbook (`LEDGER_READ_LIMIT`):**

1. Monitor Cloud Functions logs for `LEDGER_READ_LIMIT` or `economy ledger tail exceeds compaction hint threshold`
2. Run `adminCompactEconomyLedger({ targetUid })` (economy admin)
3. Re-run `adminReconcileUser({ uid })` — expect `hasDrift: false`
4. User can `commitEconomyAction` again

**Firestore index:** deploy `firestore.indexes.json` (`economyLedger` `timestamp` ASC) before tail queries in prod:

```bash
firebase deploy --only firestore:indexes
```

**Rollout:** ship checkpoint read path first (no checkpoint = full scan fallback) → deploy index → enable `scheduledEconomyLedgerCompaction` on Functions deploy.

---

## Backfill rollout

Script: `functions/scripts/backfill-economy-ledger-from-wonder-tx.js`

```bash
# From repo root OR functions/ — set credentials in functions/.env first (cp functions/.env.example functions/.env)
npm run backfill:economy-ledger              # dry-run all users
npm run backfill:economy-ledger:commit       # commit all users

# Phased prod (still from functions/, .env loaded automatically)
npm run backfill:economy-ledger -- --uid=CANARY_UID
npm run backfill:economy-ledger:commit -- --uid=CANARY_UID
npm run backfill:economy-ledger:commit -- --limit=50 --offset=0
```

**Prerequisite:** Firestore must exist on the target Firebase project. If you see `gRPC NOT_FOUND`, open [Firebase Console](https://console.firebase.google.com/) → **Build → Firestore → Create database** (Native mode) for project `into-the-pond`, then re-run the backfill.

**Sources:** `wonderTransactions` (pool-aware via `wonderDeltasFromTransaction` logic), `fishingClaims` → `fishing_claim` rows.

**Idempotency:** skips when `economyLedger/{ledgerEntryIdForKey(key)}` exists. Re-run → 100% skipped.

**Double-count prevention:** script processes `fishingClaims` first, then skips fishing-sourced `wonderTransactions` when castId is already covered. See [Topic 5b](economy-known-behaviors.md#5b--double-count-prevention-code).

**Ledger-only:** backfill writes `economyLedger` only — run `adminReconcileUser` after commit. See [Topic 5a](economy-known-behaviors.md#5a--ledger-only).

### Rollout log

| Step    | Date       | Env           | Command                          | users | scanned | created | skipped | errors | reconcile             |
| ------- | ---------- | ------------- | -------------------------------- | ----- | ------- | ------- | ------- | ------ | --------------------- |
| Dry-run | 2026-06-29 | prod          | `backfill:economy-ledger`        | 0     | 0       | 0       | 0       | 0      | N/A — empty Firestore |
| Commit  |            | staging       | `backfill:economy-ledger:commit` |       |         |         |         |        | all `hasDrift: false` |
| Dry-run |            | prod (re-run) | `backfill:economy-ledger`        |       |         |         |         |        | when `users` > 0      |
| Canary  |            | prod          | `--uid=... --commit`             |       |         |         |         |        | canary zero drift     |
| Batch   |            | prod          | `--limit=50 --offset=N --commit` |       |         |         |         |        | sample reconcile      |
| Full    |            | prod          | `--commit`                       |       |         |         |         |        | all users             |

---

## Sample reconciliation (baseline)

**Run date:** 2026-06-29

| UID | dry-run would create | ledgerEntryCount | hasDrift | Notes                                                             |
| --- | -------------------- | ---------------- | -------- | ----------------------------------------------------------------- |
| —   | —                    | —                | —        | **No users in prod Firestore** — `adminReconcileUser` not invoked |

When prod has users, sample 5–10 UIDs (legacy `wonderTransactions`, active `fishingClaims`, post-Phase-B `economyLedger`, minimal/new) via:

```js
adminReconcileUser({ uid: "TARGET_UID" });
```

Requires economy admin (`economyAdmin` custom claim or `ECONOMY_ADMIN_UIDS`). Pre-backfill: expect `hasDrift: true` for legacy users until backfill commit.

**Drift report:** `admin/economyDriftReport` — **not present** (2026-06-29 probe).

---

## Scheduled reconciliation

- **Function:** `scheduledEconomyReconciliation` (`onSchedule` every 24 hours)
- **Threshold:** `|drift| > 2` per field (single-unit noise ignored)
- **Alert doc:** `admin/economyDriftReport` — `{ reportedAt, driftingUsers, totalDriftingUsers, totalUsers, driftThreshold }`
- **Firestore rules:** `admin/{docId}` — economy admin read (`token.economyAdmin`), server-write only

### Ops runbook

1. Check Cloud Scheduler / Functions logs for `scheduledEconomyReconciliation complete`
2. If `economyDriftReport` exists → inspect `driftingUsers`; run `adminReconcileUser` on sample UIDs
3. Post-backfill: expect empty or sub-threshold drift; investigate any `|drift| > 2`

---

## Prod cutover — `ECONOMY_LEDGER_ONLY`

**Path A (empty prod):** skip backfill / zero-drift gate. Deploy functions with committed [`functions/.env.into-the-pond`](../functions/.env.into-the-pond) (`ECONOMY_LEDGER_ONLY=true`).

1. Upgrade project to **Blaze** (required for Cloud Functions deploy)
2. `firebase deploy --only firestore:indexes,firestore:rules,functions`
3. Confirm `.env.into-the-pond` is picked up (Firebase loads `functions/.env.<projectId>` on deploy)
4. Smoke: `npm run smoke:economy-phase0:probe`; then authenticated callable test (well, bait craft, cast+claim)

**Path B (legacy users):** deploy first, then backfill + reconcile gate before ledger-only (see backfill rollout above).

### Ops gaps (documented)

- **Backfill sources:** script covers `wonderTransactions` + `fishingClaims` only — not `lessonProgress` ([Phase B plan](economy-phase-b-verification.md) mentions it; script does not implement it)
- **Empty prod:** cutover/backfill commit deferred until Firestore has user documents with economy history
- **Ledger read cap index:** run `firebase deploy --only firestore:indexes` before enabling checkpoint tail queries at scale (see checkpoint compaction runbook above)

---

## Automated gates

```bash
cd functions && npm run build
npm run lint:economy
npm run test:firestore-rules
npm run smoke:economy-phase0        # Path A local + env check
npm run smoke:economy-phase0:probe  # + prod reconcile probe (needs functions/.env credentials)
```

| Test                                      | Purpose                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `economySimulation.test.ts`               | Multi-step earn/spend/parts/materials; user doc ≡ ledger fold after each commit |
| `computeEconomyProjection.test.ts`        | 450+ entry `LEDGER_READ_LIMIT`; checkpoint + tail passes at 500 entries         |
| `commitEconomyAction.integration.test.ts` | Projection writes, idempotency, dual-write, audit entries                       |
| `reconcileUser.test.ts`                   | Drift report shape                                                              |

---

## Future action checklist (new economy features)

1. Add `EconomyActionType` in `shared/sanctuary/economy/types.ts`
2. Add ledger entry in `build()` inside existing callable → `commitEconomyAction`
3. Projection auto-includes new deltas — no per-callable aggregate writes
4. Exempt operational fields stay in `additionalUserPatch` only

---

## Explicit non-goals (unchanged)

- No `functions/src/economy/ledger/*` parallel module
- Client reads `users/{uid}` onSnapshot unchanged
- Historical `wonderTransactions` data retained
- `wonderRules.ts` / `baitCatalog.ts` not deleted
