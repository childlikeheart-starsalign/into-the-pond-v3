# Invariant 8 — Fishing Claim Baseline Audit

One claim per `castId`; `activeCast` cleared atomically with ledger commit; idempotent retries via `fishing_claim:{castId}`.

## Flow trace

```
createCast (index.ts)
  → tx: economyIdempotency cast_create:{requestId}
  → tx.set users/{uid}.activeCast { castId, readyTimestamp, ... }

claimCast (index.ts)
  → executeClaimCast (claimEncounter.ts)
    → tx: daily reset patch (exempt)
    → resolve castId from activeCast | lastClaimedCastId
    → tx: read economyIdempotency fishing_claim:{castId}
    → resolveFishingClaimFromContext + applyFishingClaimInTransaction
      → commitEconomyAction (ledger + activeCast: null + lastClaimedCastId)
      → creatures / fishingClaims / analytics (if committed)
```

## Pre-implementation gaps (fixed by Invariant 8)

| Gap                                                | Risk                                                         |
| -------------------------------------------------- | ------------------------------------------------------------ |
| Idempotency read **after** `activeCast` null check | Post-success retry threw "No active cast"                    |
| `throw new Error` in `executeClaimCast`            | Inconsistent `HttpsError` mapping in `claimCast`             |
| `claimId = claim_${Date.now()}`                    | Non-deterministic `fishingClaims` doc on re-execution        |
| No `lastClaimedCastId` recovery field              | Could not resolve `castId` when `activeCast` already cleared |
| No claim integration tests                         | Regression risk on double-claim                              |
| `castClaim` callable                               | No-op stub — not authoritative for rewards                   |

## Client authority

- [`claimCast(uid, {})`](src/features/fishing/fishingServerCast.ts) — empty payload; server reads `activeCast` only.
- `createCast` sends `requestId` for `cast_create` idempotency; `castId` is server-derived from `requestId`.

## Legacy paths

- **`castClaim`** (`index.ts`): returns `{ success: true, message: "Cast claim accepted." }` with no economy writes — deprecated.

## Related invariants

- Invariant 3: `fishing_claim:{castId}` idempotency key
- Invariant 4: `activeCast` clear in same tx as ledger via `additionalUserPatch`
- Invariant 7: append-only `economyLedger`
