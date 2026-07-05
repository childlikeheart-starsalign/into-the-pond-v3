# Invariant 8 — Fishing Claim Cannot Be Claimed Twice

One claim per `castId`; `activeCast` cleared in the same transaction as the ledger commit. See [Invariant 3](economy-invariant3-verification.md) (idempotency), [Invariant 7](economy-invariant7-verification.md) (immutable ledger), and [Invariant 10](economy-invariant10-verification.md) (duplicate compensation on a single ledger entry per cast).

## Automated gates

```bash
cd functions && npm run build
npm run lint:economy
```

Build runs:

- `createCast.integration.test.ts` — transactional single active cast
- `claimEncounter.integration.test.ts` — idempotency ordering, post-success retry
- `scripts/test-fishing-claim-invariant8.mjs` — client never sends `castId` on claim

## Claim transaction order

[`executeClaimCastInTransaction`](functions/src/sanctuary/claimEncounter.ts):

1. Read user doc (+ daily reset patch)
2. `resolveClaimCastId` — `activeCast.castId` or `lastClaimedCastId` (server only)
3. `readIdempotencyInTransaction(fishing_claim:{castId})` → return cached on hit
4. If miss: validate `activeCast` ready; optional ledger+fishingClaims fallback
5. `applyFishingClaimInTransaction` → `commitEconomyAction` clears `activeCast`, sets `lastClaimedCastId`

---

### Stage 0 — Baseline audit

**Files changed:** `docs/economy-invariant8-audit.md`

**Migration summary:** Documented flow, gaps, client authority, `castClaim` stub.

**Invariants verified:** Inventory complete

**Remaining legacy paths:** `castClaim` no-op stub

**Risks discovered:** Post-success retry failed before idempotency read

**Recommended next migration:** Stage 1 precondition reorder

---

### Stage 1 — Claim precondition hardening

**Files changed:** `claimEncounter.ts`, `index.ts` (`claimCast`)

**Migration summary:** Idempotency read before `activeCast` reject; `HttpsError` preconditions; exported `executeClaimCastInTransaction`.

**Invariants verified:** 8c, 8d, 8e (idempotency hit path)

**Remaining legacy paths:** None on claim path

**Risks discovered:** None

**Recommended next migration:** Stage 2 recovery field

---

### Stage 2 — Atomic clear + recovery field

**Files changed:** `applyFishingClaim.ts`, `economyFieldRegistry.ts`, `firestore.rules`

**Migration summary:** `lastClaimedCastId` on claim; `claim_{castId}` deterministic claim doc id; `idempotencyMiss` passed to `commitEconomyAction`.

**Invariants verified:** 8a, 8b, 8e

**Remaining legacy paths:** Historical `fishingClaims` with timestamp-based ids

**Risks discovered:** `lastClaimedCastId` only helps when idempotency doc exists

**Recommended next migration:** Stage 3 createCast tests

---

### Stage 3 — createCast transactional hardening

**Files changed:** `createCastTransaction.ts`, `createCast.integration.test.ts`, `index.ts`

**Migration summary:** Extracted `runCreateCastInTransaction`; five integration tests for idempotency and single active cast.

**Invariants verified:** 8f

**Remaining legacy paths:** None

**Risks discovered:** None

**Recommended next migration:** Stage 4 client verification

---

### Stage 4 — claimCast callable + client

**Files changed:** `index.ts`, `fishingServerCast.ts`, `scripts/test-fishing-claim-invariant8.mjs`, `package.json` (`lint:economy`)

**Migration summary:** `claimCast` ignores client `castId`; client retry on `failed-precondition`; static client assertion.

**Invariants verified:** 8d

**Remaining legacy paths:** Dev local cast mode (`__DEV__` only)

**Risks discovered:** None

**Recommended next migration:** Stage 5 claim integration tests

---

### Stage 5 — Claim integration tests

**Files changed:** `claimEncounter.integration.test.ts`, `functions/package.json` build script

**Migration summary:** Six tests for cast resolution, post-success retry, not-ready reject, no-recovery reject.

**Invariants verified:** 8a–8e matrix

**Remaining legacy paths:** Full end-to-end claim with encounter engine (covered indirectly via `commitEconomyAction` fishing tests)

**Risks discovered:** None

**Recommended next migration:** Stage 6 docs (this file)

---

### Stage 6 — Final gate

**Files changed:** This document; cross-links in Invariant 3 and 7 docs

**Final commands:**

```bash
cd functions && npm run build   # 43 tests
npm run lint:economy
```

**Invariants verified:** 8a–8f + Invariants 1–7 preserved

**Remaining legacy paths:** historical non-deterministic `fishingClaims` doc ids

**castClaim removal:** **Closed** (2026-06-29) — server callable and `castClaim.ts` client wrapper removed; `claimCast` is the sole fishing claim path. Lint: `no-legacy-cast-claim`.
