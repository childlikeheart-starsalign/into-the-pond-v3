# Economy Phase A Hardening — Verification

Verification date: 2026-06-22

## Fix 0 — Firestore rules

| Check                                               | Result                                                                                                    |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `firestore.rules` + `tests/firestore.rules.test.ts` | Present; 15 tests pass locally (via `scripts/run-firestore-rules-test.mjs` Java auto-detect)              |
| `npm run test:firestore-rules`                      | **Pass** (2026-06-29)                                                                                     |
| Prod rules vs repo                                  | **Match** — project `into-the-pond`; verify with `cd functions && npm run get:firestore-rules >/dev/null` |
| Prod deploy                                         | Use `cd functions && npm run deploy:firestore-rules` when repo rules change                               |

**Gate:** Rules source and unit test exist; emulator test must pass in an environment with Java before prod deploy sign-off.

---

## Fixes 1–7 — Already implemented (verified, not re-implemented)

Verified via `cd functions && npm run build` (sync pipeline + 62 integration/unit tests green).

| Fix                                  | Evidence                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **1** Sync pipeline                  | `sync-wonder-module.js`, `sync-bait-module.js`, `validate-sync-integrity.js` run before `tsc` in build |
| **2** `craftBait` tx                 | `functions/src/index.ts` → `commitEconomyAction` + `db.runTransaction`                                 |
| **3** `completePractice` idempotency | `functions/src/index.ts` → `commitEconomyAction` with `practice:{requestId}` key                       |
| **4** Diary idempotency              | `submitDiaryEntry` in `index.ts` → `commitEconomyAction`                                               |
| **5** Ledger in tx                   | `commitEconomyAction.ts`; `persistWonderTransaction` deprecated                                        |
| **6** `craft_start` tx               | `craftCallables.ts` → `handleStartCraft` + `craft_start:{rodId}`                                       |
| **7** `createCast` tx                | `createCastTransaction.ts` → `runCreateCastInTransaction` + idempotency                                |

No re-architecture; economy uses `economyLedger` / `economyIdempotency` (post–Phase B pipeline).

---

## Fix 8 — Daily fishing Wonder cap (10/day) — **closed**

- Constant: `DAILY_FISHING_WONDER_CAP = 10` in `shared/sanctuary/wonder/rules.ts` (synced to `wonderRules.ts`).
- Envelope applied in `applyFishingClaim.ts`:
  - `effectiveWonderAwarded = min(claim.wonderAwarded, remainingCap)`
  - `fishingWonderToday` incremented by `effectiveWonderAwarded`
  - Client summary returns capped `wonderAwarded`; materials unchanged
- Tests: `applyFishingClaim.integration.test.ts` (9/10/partial overflow), `rules.test.ts` (cap === 10)

**UX note:** At cap, users still receive materials; `wonderAwarded: 0` on duplicate/miss consolation when daily Wonder from fishing is exhausted.

---

## Fix 9 — Bait deduction on createCast — **closed**

- `createCastTransaction.ts`: deducts `inventory.baits` for `feather_bait`, `scale_bait`, `glimmerdust_bait`
- `random_bait` / empty: no deduction (free cast)
- Unknown bait id: `failed-precondition`
- Tests: `createCast.integration.test.ts` (deduct, reject, random_bait free)

---

## Fix 10 — helpers.ts off-limits banner — **closed**

- Warning docblock added to `src/data/creatures/helpers.ts`
- Import guard: `validateNoHelpersImportInFunctions()` in `validate-invariant10-fishing-claim.mjs` (wired into build + `lint:economy`)

---

## Final gates (2026-06-22)

| Command                            | Result                                                        |
| ---------------------------------- | ------------------------------------------------------------- |
| `cd functions && npm run build`    | **Pass** — 62 tests (incl. 7 applyFishingClaim, 8 createCast) |
| `cd functions && npx tsc --noEmit` | **Pass** (after sync)                                         |
| `npm run lint:economy`             | **Pass**                                                      |
| `npm run test:firestore-rules`     | **Skipped** — Java required for emulator                      |

---

## Scenario checklist

| Scenario                                 | Verified by                                   |
| ---------------------------------------- | --------------------------------------------- |
| Double-tap `completePractice`            | Idempotency via `commitEconomyAction` (Fix 3) |
| Concurrent `craftBait`                   | `bait_craft:{requestId}` (Fix 2)              |
| `createCast` while `activeCast` exists   | `createCast.integration.test.ts`              |
| `claimCast` daily Wonder cap             | New applyFishingClaim cap tests (Fix 8)       |
| `startCraft` twice same rod              | `craftCallables` idempotency (Fix 6)          |
| `submitDiaryEntry` duplicate `requestId` | `commitEconomyAction` (Fix 4)                 |
| Client write `currentWonder`             | Rules test (Fix 0 — run in Java-enabled env)  |
| Bait consumed on cast                    | `createCast.integration.test.ts` (Fix 9)      |
