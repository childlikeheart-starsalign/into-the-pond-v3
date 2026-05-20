# Into the Pond — v3 (mobile)

Expo SDK 54 app using **Expo Router**, React Native, and **native-first** workflows (`npm run ios` / `npm run android`). Web is optional (`npm run web`). Technical debt and known issues are tracked in **[`TECH_DEBT.md`](TECH_DEBT.md)**.

## Commands

| Script                       | Purpose                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `npm start`                  | Dev server (QR / simulator)                                                                        |
| `npm run ios`                | iOS Simulator                                                                                      |
| `npm run android`            | Android emulator / device                                                                          |
| `npm run prebuild`           | Generate `ios/` and `android/` from Expo config                                                    |
| `npm run prebuild:clean`     | Same as above, deleting existing native folders first                                              |
| `npm run verify`             | TypeScript check                                                                                   |
| `npm run git:snapshot`       | Initialize repo + first commit + tag `foundations-v1` (uses `isomorphic-git`; see Version control) |
| `npm run git:commit-tracked` | Stage all non-ignored files and commit (when system `git` is unavailable)                          |

If **`npm`** prints **`Unknown env config "devdir"`**, run **`npm config delete devdir`** once (your global/project npm config—not this repo). See **Config and secrets** checklist in [`TECH_DEBT.md`](TECH_DEBT.md).

## Native projects, prebuild, and EAS

- **`ios/` and `android/`** are listed in `.gitignore`. Commit app sources only; **EAS Build** generates native projects on Expo servers for CI and store builds.
- **Local native debugging:** run `npm run prebuild` (or `npm run prebuild:clean`), then `npx expo run:ios` / `npx expo run:android`.
- **Link EAS:** run **`eas build:configure`** once so Expo can write **`extra.eas.projectId`** into your config (typically **`app.json`**). [`app.config.js`](app.config.js) loads **`app.json`** and overlays **`expo.extra`** from environment variables when present (see **Environment variables** below).
- **`eas.json`** defines **development** (internal distribution, development client via **`expo-dev-client`**) and **production** (auto-increment build numbers, **`production`** update channel). Internal dev-client binaries from **`eas build --profile development`** pair with **`npx expo start --dev-client`** for Metro-connected debugging (not Expo Go).

### Firebase: JS config vs native files

- **Runtime (Firebase JS SDK)** uses **`app.json` → `expo.extra`** values consumed by [`src/config/env.ts`](src/config/env.ts). Missing keys surface as app/API errors; **`GoogleService-Info.plist`** / **`google-services.json`** are **not** read by `initializeApp` in [`src/services/firebase/client.ts`](src/services/firebase/client.ts).
- **Native configs:** keep **`assets/GoogleService-Info.plist`** for iOS; optional **`assets/google-services.json`** for Android (download from Firebase Console for package **`com.intothepond.app.v3`**). Config plugin [**`plugins/withFirebaseNativeFiles.js`**](plugins/withFirebaseNativeFiles.js) copies those files into the generated native trees during **`expo prebuild`**. Android copy runs only if **`google-services.json`** exists. Full native Firebase Gradle/Xcode integration (for example **`com.google.gms.google-services`**) requires additional setup if you adopt React Native Firebase or native-only features later.
- **Android native stacks (FCM, Analytics, RN Firebase):** use the **Checklist** under _Firebase native vs JS_ in [`TECH_DEBT.md`](TECH_DEBT.md) before expecting Gradle/Xcode native Firebase wiring.

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

### Local IAP / RevenueCat

RevenueCat and **`react-native-purchases-ui`** require native code: run **`npm run prebuild`** (or **`npm run prebuild:clean`**), then **`npx expo run:ios`** / **`npx expo run:android`**, or install an **EAS development client**. **Expo Go** does not load these native modules. Sandbox testing steps are in **[`TESTING_IAP.md`](TESTING_IAP.md)**.

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

Expo resolves **[`app.config.js`](app.config.js)** (reads **`app.json`** and merges **`expo.extra`**). Base defaults live in **`app.json`** → **`expo.extra`**. At build or dev startup, **`app.config.js`** overlays secrets from **`process.env`** when set:

| `app.json` key               | Environment variable (optional override)                            |
| ---------------------------- | ------------------------------------------------------------------- |
| Firebase `firebaseApiKey`, … | `EXPO_PUBLIC_FIREBASE_*` (see [.env.example](.env.example))         |
| `revenueCatApiKeyApple`      | `REVENUECAT_APPLE_API_KEY`                                          |
| `revenueCatApiKeyGoogle`     | `REVENUECAT_GOOGLE_API_KEY`                                         |
| Entitlement identifiers      | `REVENUECAT_ENTITLEMENT_PRO`, `_WOODEN`, `_FIBERGLASS`, `_LIFETIME` |
| `cloudFunctionsRegion`       | `EXPO_PUBLIC_CLOUD_FUNCTIONS_REGION`                                |

**Local:** copy [.env.example](.env.example) to **`.env`** and fill values (`.env` is gitignored).

**EAS Build:** create secrets so cloud builds receive the same names (example):

```bash
eas secret:create --scope project --name REVENUECAT_APPLE_API_KEY --value your_apple_sdk_key --type string
eas secret:create --scope project --name REVENUECAT_GOOGLE_API_KEY --value your_google_sdk_key --type string
```

See [EAS secrets](https://docs.expo.dev/build-reference/variables/). Do not commit production SDK keys in **`app.json`**.

Set these keys in **`app.json`** when not using env overrides:

- `firebaseApiKey`
- `firebaseAuthDomain`
- `firebaseProjectId`
- `firebaseStorageBucket`
- `firebaseMessagingSenderId`
- `firebaseAppId`
- `firebaseMeasurementId`
- `revenueCatApiKeyApple`
- `revenueCatApiKeyGoogle`
- `revenueCatEntitlementPro` (Into the pond Pro entitlement identifier; default `into_the_pond_pro`)
- `revenueCatEntitlementWooden`
- `revenueCatEntitlementFiberglass`
- `revenueCatEntitlementLifetime`
- `cloudFunctionsRegion`

Placeholders (**`YOUR_*`**) must be replaced for real builds; optional **EAS secrets** for keys kept out of git. When linking Expo, run **`eas build:configure`** and commit **`extra.eas.projectId`** where the CLI writes it—see **Config and secrets** checklist in [`TECH_DEBT.md`](TECH_DEBT.md).

### Firebase Auth email actions (password reset and verification)

Password reset and verification emails use **`ActionCodeSettings`** in [`src/services/firebase/authLinks.ts`](src/services/firebase/authLinks.ts) (`handleCodeInApp`, `url`, iOS bundle ID, Android package). For emails to open the app reliably:

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**: include your **`firebaseAuthDomain`** host (for example `{projectId}.firebaseapp.com`) and any HTTPS **`continueUrl`** domain you configure.
2. Keep **bundle ID** / **package name** aligned with **`app.json`** (`com.intothepond.app.v3`) for the native blocks in action emails.
3. Deep links use scheme **`intothepond`** and routes **`/reset-password`**, **`/finish-email`** (see [`src/hooks/useAuthDeepLink.ts`](src/hooks/useAuthDeepLink.ts)); adjust Firebase email templates if links stay in the browser.

Tuning **`handleCodeInApp`** / domains / templates on physical devices is tracked in **`TECH_DEBT.md`** (_Auth email links and deep links_ → **Checklist**).

Set Firebase Functions runtime config before deploy:

```bash
firebase functions:config:set \
  revenuecat.secret_key="YOUR_REVENUECAT_SECRET_KEY" \
  revenuecat.entitlement_pro="into_the_pond_pro" \
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
├─ app.config.js
├─ app.json
├─ eas.json
├─ TECH_DEBT.md
├─ plugins/
│  └─ withFirebaseNativeFiles.js
├─ package.json
└─ tsconfig.json
```

## Store IDs

`app.json` uses `com.intothepond.app.v3` for iOS and Android so v3 can ship alongside v2 without a bundle collision. Adjust before submitting to stores if you use a single listing.

## Notes

- Deferred items and caveats: **[`TECH_DEBT.md`](TECH_DEBT.md)**.
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
