# IAP Sandbox Testing Runbook

## Prerequisites

- RevenueCat SDK bootstraps at app load (see `ensureRevenueCatConfigured` in [`app/_layout.tsx`](app/_layout.tsx)); gate offerings should appear on first visit without app restart
- RevenueCat products/offering configured with:
  - `Wooden_Rod_Monthly`
  - `Fiberglass_Rod_Monthly`
  - `Wooden_Rod_Lifetime`
  - `Fiberglass_rod_lifetime`
- Entitlement identifier for Into the Pond Pro (e.g. `into_the_pond_pro`) attached to products as needed for paywalls
- Firebase Functions deployed (`verifyPurchase`, `syncSubscriptionStatus`, `submitDiaryEntry`, `createWellQuestion`, `createCast`, `claimCast`)
- App built in native runtime (not Expo Go)
- Test account signed in with Firebase Auth

## iOS Sandbox

1. Sign in with an App Store sandbox tester account on the device.
2. Open Store screen and purchase `Wooden_Rod_Monthly`.
3. Confirm:
   - purchase sheet succeeds
   - Firestore `users/{uid}.subscription.subscriptionStatus` becomes `wooden`
   - Firestore `users/{uid}.activeRod` becomes `wooden`
   - `users/{uid}/purchases/{transactionId}` doc created
4. Purchase `Fiberglass_rod_lifetime` and confirm:
   - `isLifetime` becomes `true`
   - `subscriptionStatus` becomes `fiberglass`
   - `expiryDate` is `null`

## Android Internal Testing

1. Install internal test build from Play internal track.
2. Purchase with test card.
3. Confirm same Firestore updates and purchase audit entries.

## Restore Flow

1. Reinstall app or use second device with same store account.
2. Tap **Restore Purchases**.
3. Confirm `verifyPurchase` runs and no duplicate purchase docs are created.

## Duplicate/Idempotency

1. Trigger restore multiple times.
2. Confirm each transaction ID appears once under `users/{uid}/purchases`.

## Expiry / Downgrade

1. Wait for sandbox subscription to expire.
2. Confirm next `syncSubscriptionStatus` or `verifyPurchase` updates:
   - `activeRod` -> `basic` (unless `isLifetime`)
   - `hasPaidRod` becomes false on client derived state.

## Foreground refresh (P3-B)

Verifies out-of-band subscription changes without force-quit. On AppState `"active"`, the app shell calls `getSubscriptionStatus` and `syncSubscriptionStatus` for signed-in native users.

### Out-of-band cancel

1. With an active sandbox subscription, open the app and confirm paid tier on Gate.
2. Background the app (home button / app switcher).
3. Cancel the subscription in iOS Settings → Subscriptions (or Play Store subscriptions).
4. Foreground the app (do not force-quit).
5. Confirm within a few seconds:
   - Gate shows free / downgraded tier
   - Firestore `users/{uid}.subscription.subscriptionStatus` reflects cancel (e.g. `free`)
   - Sanctuary premium-gated UI updates if applicable (`useUserIsPremium`)

### Out-of-band restore

1. With no active subscription, background the app.
2. Restore or resubscribe via App Store / Play (same store account).
3. Foreground the app without restart.
4. Confirm entitlements and Firestore subscription fields update without cold start.

## Offerings-driven paywall (P3-C)

Gate prices and product availability come from the RevenueCat **current offering**, not static HKD values in `assets/gate/tiers.json`.

1. In RevenueCat dashboard, confirm the **current offering** includes:
   - `Wooden_Rod_Monthly`
   - `Fiberglass_Rod_Monthly`
   - `Fiberglass_rod_lifetime`
2. Open Gate on a native build — monthly/lifetime CTAs show **store-localized prices** (e.g. `$4.99`) from the SDK, not `HKD 38` fallback text.
3. Temporarily remove a product from the offering — the matching tier purchase option shows **Unavailable**.
4. Complete a sandbox purchase and restore — Firestore subscription fields still update as in sections above.

## Account Switch

1. Sign out from app account A, sign in to app account B on same device.
2. Trigger restore purchases.
3. Confirm entitlements are recomputed and written to `users/{uidB}` only.
4. Confirm no stale tier state remains from account A.

## Emulator Integration (Server-required writes)

1. Start emulators for auth/firestore/functions.
2. Verify callable behavior:
   - `submitDiaryEntry` increases `totalWonder` and writes `diaryEntries`.
   - `createWellQuestion` enforces daily cap = 3 and duplicate checks.
   - `createCast` and `claimCast` reject early claim, then reward when ready.

## Negative Cases

- Cancel purchase sheet -> UI message: `Purchase cancelled - you can try again anytime.`
- Payment/network issue -> UI message: `Payment failed. Please check your payment method.`
- Verification failure -> UI message: `We could not verify your purchase. Please contact support.`
- Already active restore case -> UI message: `Your subscription is active. Restoring...`
