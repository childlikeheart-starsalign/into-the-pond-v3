# Into the Pond — v3 (mobile)

Expo SDK 54 app using **Expo Router**, React Native, and **native-first** workflows (`npm run ios` / `npm run android`). Web is optional (`npm run web`).

## Commands

| Script | Purpose |
|--------|---------|
| `npm start` | Dev server (QR / simulator) |
| `npm run ios` | iOS Simulator |
| `npm run android` | Android emulator / device |
| `npm run verify` | TypeScript check |
| `npm run git:snapshot` | Initialize repo + first commit + tag `foundations-v1` (uses `isomorphic-git`; see Version control) |
| `npm run git:commit-tracked` | Stage all non-ignored files and commit (when system `git` is unavailable) |

## Version control

This repo uses Git with milestone tag **`foundations-v1`** on the initial foundations snapshot commit.

**Recover that snapshot**

```bash
git checkout foundations-v1
```

**Push to GitHub** (private repo recommended for Firebase plist / keys in config). Install Apple Git / Xcode CLI tools first so `git` works, then either:

```bash
gh repo create into-the-pond-v3 --private --source=. --remote=origin --push
git push origin foundations-v1   # ensure the tag is on the remote
```

Or create an empty repo on GitHub and run:

```bash
chmod +x scripts/push-to-github.sh
./scripts/push-to-github.sh git@github.com:YOUR_USER/into-the-pond-v3.git
```

**Branch protection (optional)**  
On GitHub: **Settings → Branches → Add branch protection rule** for `main` (require pull request before merging, disallow force-push). Reduces accidental history loss when collaborating.

## Integrated services

- **Firebase** (`firebase`) for auth + Firestore
- **RevenueCat** (`react-native-purchases`) for subscriptions
- **WatermelonDB** (`@nozbe/watermelondb`) for local/offline data

## Profile Data Model

- Firestore `users/{uid}` stores Wonder totals, completed lessons map, rod state, inventory, active cast, and subscription object.
- Firestore subcollections:
  - `users/{uid}/diaryEntries`
  - `users/{uid}/wellQuestions`
  - `users/{uid}/creatures`
- Global lessons: `lessons/{lessonId}`.
- Typed contracts live in `src/services/firebase/types.ts`.

## Offline Rules

- Offline reads: lessons cache, profile snapshot, inventory, well entries via WatermelonDB local tables.
- Server-required writes: well question creation, fishing cast/claim, diary submission, and IAP verification.
- Firestore uses server timestamps and last-write-wins semantics.
- Show offline notice in UI when network is unavailable: `Offline mode - some features limited.`

## Configuration

Set these values in `app.json` > `expo.extra`:

- `firebaseApiKey`
- `firebaseAuthDomain`
- `firebaseProjectId`
- `firebaseStorageBucket`
- `firebaseMessagingSenderId`
- `firebaseAppId`
- `firebaseMeasurementId`
- `revenueCatApiKeyApple`
- `revenueCatApiKeyGoogle`
- `revenueCatEntitlementWooden`
- `revenueCatEntitlementFiberglass`
- `revenueCatEntitlementLifetime`
- `cloudFunctionsRegion`

Set Firebase Functions runtime config before deploy:

```bash
firebase functions:config:set \
  revenuecat.secret_key="YOUR_REVENUECAT_SECRET_KEY" \
  revenuecat.entitlement_wooden="wooden_rod" \
  revenuecat.entitlement_fiberglass="fiberglass_rod" \
  revenuecat.entitlement_lifetime="lifetime_keeper"
```

## Project layout

```txt
into-the-pond-v3/
├─ app/
│  ├─ _layout.tsx
│  └─ index.tsx
├─ src/
│  ├─ config/
│  │  └─ env.ts
│  ├─ constants/
│  │  └─ theme.ts
│  ├─ db/
│  │  ├─ index.ts
│  │  ├─ sync.ts
│  │  └─ schema.ts
│  │  └─ models/
│  │     ├─ LocalCompletedLesson.ts
│  │     ├─ LocalInventory.ts
│  │     ├─ LocalLesson.ts
│  │     ├─ LocalNote.ts
│  │     ├─ LocalUserProfile.ts
│  │     └─ LocalWellQuestion.ts
│  └─ services/
│     ├─ firebase/
│     │  ├─ auth.ts
│     │  ├─ castClaim.ts
│     │  ├─ client.ts
│     │  ├─ entitlements.ts
│     │  ├─ serverActions.ts
│     │  └─ firestore.ts
│     │  └─ types.ts
│     ├─ iap/
│     │  ├─ analytics.ts
│     │  ├─ catalog.ts
│     │  ├─ errors.ts
│     │  ├─ purchaseFlow.ts
│     │  ├─ tier.ts
│     │  ├─ tier.test.ts
│     │  └─ verifyPurchase.ts
│     └─ revenuecat/
│        └─ client.ts
├─ functions/
│  ├─ src/
│  │  ├─ config.ts
│  │  ├─ entitlements.ts
│  │  ├─ guards.ts
│  │  ├─ index.ts
│  │  ├─ init.ts
│  │  ├─ revenuecat.ts
│  │  └─ types.ts
│  ├─ package.json
│  └─ tsconfig.json
├─ app.json
├─ package.json
└─ tsconfig.json
```

## Store IDs

`app.json` uses `com.intothepond.app.v3` for iOS and Android so v3 can ship alongside v2 without a bundle collision. Adjust before submitting to stores if you use a single listing.

## Notes

- RevenueCat requires a native runtime (development build / production build), not Expo Go.
- WatermelonDB local schema is initialized in `src/db/schema.ts` and `src/db/index.ts`.
- `functions/src/index.ts` includes:
  - `verifyPurchase` callable (idempotent purchase sync)
  - `syncSubscriptionStatus` scheduler (every 6 hours)
  - `castClaim` callable protected by entitlement guard
- Additional server-required write callables:
  - `submitDiaryEntry`
  - `createWellQuestion`
  - `createCast`
  - `claimCast`
- Sandbox test checklist: `TESTING_IAP.md`
