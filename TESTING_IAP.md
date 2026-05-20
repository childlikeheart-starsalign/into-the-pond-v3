# IAP Sandbox Testing Runbook

## Prerequisites

- RevenueCat products/offering configured with:
  - `Wooden_Rod_Monthly`
  - `Fiberglass_Rod_Monthly`
  - `Wooden_Rod_Lifetime`
  - `Fiberglass_rod_lifetime`
- Entitlement identifier for Into the Pond Pro (e.g. `into_the_pond_pro`) attached to products as needed for paywalls
- Firebase Functions deployed (`verifyPurchase`, `syncSubscriptionStatus`, `castClaim`, `submitDiaryEntry`, `createWellQuestion`, `createCast`, `claimCast`)
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
