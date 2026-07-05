# Economy Invariant 3 — Callable Idempotency Verification

Every mutating Cloud Function is idempotent: retries return the same response with no duplicate side effects.

## Automated gates

```bash
cd functions && npm run build
```

Build runs `shared/sanctuary/economy/economy.test.ts` (key builders + `idempotencyDocId`).

## Idempotency key reference

| Callable             | Key                                   | Source                    |
| -------------------- | ------------------------------------- | ------------------------- |
| Lesson complete      | `lesson_complete:{lessonId}`          | deterministic             |
| Well answer          | `well_answer:{localDate}`             | deterministic             |
| Fishing claim        | `fishing_claim:{castId}`              | deterministic             |
| Rod craft start      | `craft_start:{rodId}`                 | deterministic             |
| Rod craft collect    | `craft_collect:{rodId}`               | deterministic             |
| Rod equip            | `rod_equip:{rodId}`                   | deterministic             |
| Practice             | `practice:{localDate}:{kind}`         | deterministic             |
| Bait craft           | `bait_craft:{requestId}`              | client UUID               |
| Diary (non-lesson)   | `diary:{requestId}`                   | client UUID               |
| Create cast          | `cast_create:{requestId}`             | client UUID               |
| Well assign question | `well_assign:{localDate}`             | deterministic             |
| Well reroll          | `well_reroll:{localDate}:{requestId}` | client UUID               |
| Purchase verify      | `purchase_verify:{transactionId}`     | RevenueCat transaction id |

Keys are defined in `shared/sanctuary/economy/callableIdempotencyKeys.ts`. Responses are cached in `users/{uid}/economyIdempotency/{docId}`.

## Expected single-row behavior (Topic 8)

Retries with the **same** idempotency key return the cached response — **no second `economyLedger` row**. See [economy-known-behaviors.md — Topic 8](economy-known-behaviors.md#topic-8--idempotency-no-second-ledger-row).

## Manual retry checklist

For each row, invoke the callable twice with the **same** idempotency key (same `requestId` or deterministic key). Confirm:

1. Second response matches first (fields and ids).
2. No duplicate Firestore documents (ledger, creatures, diary, practice, player rods, purchases).
3. Wonder balances unchanged on second call.
4. Analytics / PostHog events do not duplicate on cache hit (craft start/collect/equip, well assign/reroll).

### createCast

- Send same `requestId` twice → one `activeCast`, same `castId` and `readyAt`.
- Client persists `requestId` in `fishing:server-cast` AsyncStorage until claim completes.

### collectCraft / equipRod

- Double-tap with same `rodId` → cached response, rod state unchanged on second call.

### claimCast

- Retry after success → same claim summary via `fishing_claim:{castId}` idempotency (read **before** `activeCast` null check).
- Duplicate consolation is a single ledger row per cast — idempotent retry must not double-grant wonder or materials; see [Invariant 10](economy-invariant10-verification.md).
- Post-success recovery uses `lastClaimedCastId` when `activeCast` is already cleared — see [Invariant 8](economy-invariant8-verification.md).
- `fishingWonderToday` reset runs inside claim transaction (no double reset).

### craftBait / rerollWellQuestion

- Reuse same client `requestId` on network retry → no double spend / reroll consumption.

### verifyPurchase

- Same RevenueCat `transactionId` → one row in `users/{uid}/purchases/{transactionId}`.

## Client requestId propagation

- `src/services/firebase/serverActions.ts` — `createCast`, `craftBait`, `rerollWellQuestion`
- `src/features/fishing/fishingServerCast.ts` — persists cast `requestId` for retries
- `src/hooks/useWellQuestion.ts` — one `requestId` per reroll tap (retries must reuse)

## Known tradeoffs

- **well_answer:{localDate}** — second reflection same day returns first answer (by design).
- **Server-generated requestId** — if client omits `requestId`, server generates UUID and logs a warning; retries without a persisted id will not dedupe until client sends stable ids.

## Non-migrated (read-only or scheduled)

- `getRodProgression`, `ensureWellState` (no-op paths)
- `syncSubscriptionStatus` / daily schedule — subscription sync without per-call idempotency (purchase path uses `purchase_verify`)
