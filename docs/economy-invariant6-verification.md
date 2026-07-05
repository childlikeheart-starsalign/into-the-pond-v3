# Invariant 6 — Server-Authoritative Rewards Verification

See also: [economy-invariant6-audit.md](./economy-invariant6-audit.md).

## Primary Objective

Rewards are calculated **exactly once on the server**. The client displays authoritative amounts from callable responses only. DEV preview modules may compute locally with `previewOnly: true`, zero Firestore economy writes, and a visible banner.

## Callable Response Contract

Defined in [`shared/sanctuary/economy/callableResponses.ts`](shared/sanctuary/economy/callableResponses.ts).

| Callable                   | Authoritative fields                                                |
| -------------------------- | ------------------------------------------------------------------- |
| `claimCast`                | `wonderAwarded`, `materialsAwarded` via `FishingClaimClientSummary` |
| `submitWellReflection`     | `wonderAwarded` (+ optional `previewOnly` on DEV)                   |
| `submitDiaryEntry`         | `wonderAwarded`, `partsAwarded?`, `currentWonder`                   |
| `completePractice`         | `wonderAwarded`, `completionId`                                     |
| `completeLessonReflection` | `wonderAwarded`, `partsAwarded`                                     |
| `craftBait`                | `wonderSpent`, `materialsSpent`, `tier`, `baitKey`                  |
| `startCraft`               | `wonderInvested`, `partsSpent` (spend confirmation)                 |

Golden tests: `shared/sanctuary/economy/callableResponses.test.ts` (runs on `functions npm run build`).

## Client Enforcement

| Rule                                 | Purpose                                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `local/no-client-economy-writes`     | No economy field writes to Firestore from client (Invariant 2)                                     |
| `local/no-client-claim-formulas`     | No local definition of claim formulas (Invariant 5)                                                |
| `local/no-client-reward-computation` | No imports of `wonderAmountForRule`, `resolveFishingClaim*`, `catchChance`, etc. outside allowlist |

Run: `npm run lint:economy` (includes `scripts/test-eslint-economy-rules.mjs`).

### Import allowlist (DEV preview / stubs)

- `src/features/fishing/resolveDevFishingClaim.ts`
- `src/features/well/wellDevPreview.ts`
- `src/repositories/sanctuary/inMemoryWonderRepository.ts`

## DEV Preview Rules

| Module                      | `previewOnly`    | Firestore writes | UI banner                                  |
| --------------------------- | ---------------- | ---------------- | ------------------------------------------ |
| `resolveDevFishingClaim.ts` | `true`           | None             | `PreviewOnlyBanner` in fishing claim modal |
| `wellDevPreview.ts`         | `true` on submit | None             | `PreviewOnlyBanner` on Well card back      |

## UI Rules

- No hardcoded reward fallbacks (`?? 12`, `?? 0` for reveal)
- Wonder reveal animations gated on server-returned `wonderAwarded`
- Optimistic updates: craft bench may patch `parts` / `storedWonder` **spend** from `startCraft` response only — never optimistic Wonder **earning**
- Offline diary queue stores `wonderAwarded: 0` until server confirms on retry

## Stub Isolation

- `createInMemoryWonderRepository()` — throws outside `__DEV__`
- `getSanctuaryEconomy()` — throws outside `__DEV__`

## Preserved Invariants 1–5

- `commitEconomyAction` sole mutation path
- Idempotency keys on all mutating callables
- Atomic ledger + snapshot (Invariant 4)
- Canonical formulas in `shared/sanctuary/` with build sync (Invariant 5)

## Remaining Legacy Paths

| Path                    | Notes                                                 |
| ----------------------- | ----------------------------------------------------- |
| `practiceWonderRange()` | Display hint (min/max range) only — not a grant       |
| `db/sync.ts`            | Reads server-projected `wonderAwarded` from Firestore |

## Stage Deliverables Summary

| Stage | Result                                                   |
| ----- | -------------------------------------------------------- |
| 0     | `docs/economy-invariant6-audit.md`                       |
| 1     | `callableResponses.ts`, `craftBait` spend fields         |
| 2     | Tightened `serverActions` types, removed UI fallbacks    |
| 3     | `no-client-reward-computation` ESLint rule               |
| 4     | `previewOnly` on well DEV, `PreviewOnlyBanner` component |
| 5     | `__DEV__` guards on in-memory economy stubs              |
| 6     | Offline diary retry updates `wonderAwarded` from server  |
| 7     | This document + ESLint rule smoke test                   |
