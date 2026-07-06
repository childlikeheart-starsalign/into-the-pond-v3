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
- **`eas.json`** defines **development** (internal distribution, development client via **`expo-dev-client`**, channel **`development`**), **preview** (internal TestFlight / Play internal track, channel **`preview`**, `NODE_ENV=production`), and **production** (auto-increment build numbers, channel **`production`**, `NODE_ENV=production`). See [`RELEASE.md`](RELEASE.md) for the full build and device-validation checklist.
- Internal dev-client binaries from **`eas build --profile development`** pair with **`npx expo start --dev-client`** for Metro-connected debugging (not Expo Go).

### Firebase: JS config vs native files

- **Runtime (Firebase JS SDK)** uses **`app.json` → `expo.extra`** values consumed by [`src/config/env.ts`](src/config/env.ts). Missing keys surface as app/API errors; **`GoogleService-Info.plist`** / **`google-services.json`** are **not** read by `initializeApp` in [`src/services/firebase/client.ts`](src/services/firebase/client.ts).
- **Native configs (not committed):** copy [`assets/GoogleService-Info.plist.example`](assets/GoogleService-Info.plist.example) and [`assets/google-services.json.example`](assets/google-services.json.example) to `assets/GoogleService-Info.plist` and `assets/google-services.json`, then replace placeholders from Firebase Console (package **`com.intothepond.app.v3`**). Real files are **gitignored** — never commit them. If a key was exposed, see [`docs/security-firebase-key-leak.md`](docs/security-firebase-key-leak.md).
- **EAS Build:** upload native files as secrets once: **`npm run setup:eas-firebase-files`** (after **`npm run eas:login`**). Each build profile runs **`scripts/write-firebase-native-files.mjs`** before prebuild to decode secrets into **`assets/`**.
- Config plugin [**`plugins/withFirebaseNativeFiles.js`**](plugins/withFirebaseNativeFiles.js) runs during **`expo prebuild`** when those files exist on disk:
  - **iOS** (when plist exists): copies **`GoogleService-Info.plist`**, adds **`firebase-ios-sdk`** via **Swift Package Manager** (products **`FirebaseAnalytics`**, **`FirebaseAuth`**, **`FirebaseFirestore`**, **`FirebaseCore`**, **`FirebaseDatabase`**), and calls **`FirebaseApp.configure()`** in **AppDelegate**. React Native / Expo still use CocoaPods — from the **repo root**, run **`cd ios && pod install`** after prebuild (if your shell is already in **`ios/`**, run **`pod install`** only).
  - **Android** (when **`google-services.json`** exists): copies the JSON, applies the **`google-services`** Gradle plugin, and adds Firebase BoM + **`firebase-analytics`** + **`firebase-database`** (main library; versions pinned by BoM — do not add deprecated **`-ktx`** artifacts).
- Native SDKs are **optional** for Auth/Firestore/Functions today (those use the JS SDK). Use native wiring for native-only features (native Analytics, future FCM/push). See the **Checklist** under _Firebase native vs JS_ in [`TECH_DEBT.md`](TECH_DEBT.md).

#### Firebase XCFramework zip (optional local reference)

If you downloaded Firebase’s **manual** Apple SDK zip into **`Firebase/`** at the repo root (~1.4GB, SDK **12.15.0** per [`Firebase/METADATA.md`](Firebase/METADATA.md)):

- **Do not** drag those xcframeworks into Xcode for this project — **`expo prebuild`** already links the same products via **SPM** (`FirebaseAnalytics`, `FirebaseAuth`, `FirebaseFirestore`, `FirebaseCore`, `FirebaseDatabase`).
- Use [`Firebase/README.md`](Firebase/README.md) and [`Firebase/METADATA.md`](Firebase/METADATA.md) only as offline reference (full xcframework dependency lists, manual **-ObjC** / **-lc++** steps) if you ever migrate off SPM.
- **`Firebase/`** is gitignored; re-download from [Firebase Console](https://console.firebase.google.com/) or Firebase release tooling if you need it on a new machine.
- **Workflow:** from repo root, `npm run prebuild`; then `cd ios && pod install` (or `pod install` only if your shell is already in **`ios/`**).

#### Firebase Console startup code

Firebase Console may show a **SwiftUI** snippet (`@main struct YourApp` + `@UIApplicationDelegateAdaptor` + `FirebaseApp.configure()`). **Do not paste that into this repo** — this app is **Expo / React Native**, not a pure SwiftUI app.

- **Equivalent:** [`plugins/withFirebaseNativeFiles.js`](plugins/withFirebaseNativeFiles.js) injects `import FirebaseCore` and `FirebaseApp.configure()` at the start of **`didFinishLaunchingWithOptions`** in the generated **AppDelegate** (via Expo’s `withAppDelegate` mod).
- Re-run **`npm run prebuild`** (or **`prebuild:clean`**) after plugin changes.
- Verify native wiring: **`npm run verify:firebase-ios-native`** (checks AppDelegate, SPM products including **`FirebaseDatabase`**, Android **`firebase-database`** when present, and no Firebase CocoaPods in the Podfile).

#### Firebase Realtime Database (native + JS)

Realtime Database is **not** Firestore — create it separately in Firebase Console (**Build → Realtime Database → Create database**).

1. Copy the **database URL** (e.g. `https://YOUR_PROJECT-default-rtdb.<region>.firebasedatabase.app`) into root **`.env`** as **`EXPO_PUBLIC_FIREBASE_DATABASE_URL`** (see [`.env.example`](.env.example)).
2. Re-download **`google-services.json`** / **`GoogleService-Info.plist`** after enabling RTDB if you rely on native config keys (optional for JS-only usage).
3. From repo root: **`npm run prebuild`** (or **`prebuild:clean`**), then **`cd ios && pod install`**, then **`npm run verify:firebase-ios-native`**.

**JS runtime:** [`src/services/firebase/client.ts`](src/services/firebase/client.ts) exports **`realtimeDb`** via `firebase/database` when **`databaseURL`** is set. **`assertRequiredEnv()`** does not require the URL — the app runs without RTDB until you set it. Helpers live in [`src/services/firebase/realtimeDb.ts`](src/services/firebase/realtimeDb.ts) (`pingRealtimeDb`, future `setPresenceOnline`).

**Native (optional):** iOS SPM product **`FirebaseDatabase`**; Android **`implementation("com.google.firebase:firebase-database")`** under the existing BoM — both applied by [`plugins/withFirebaseNativeFiles.js`](plugins/withFirebaseNativeFiles.js) during prebuild.

**After `.env` is set:**

1. Restart Metro: `npx expo start --dev-client`
2. Verify env mapping: `npm run verify:firebase-rtdb-env` (add `--smoke` to probe RTDB; permission denied = rules OK)
3. Deploy rules: `npm run deploy:database-rules` (uses [`database.rules.json`](database.rules.json); run `npx firebase-tools login` first)
4. EAS builds: `npm run setup:eas-rtdb-env` and `npm run setup:eas-firebase-files` (login first with `npm run eas:login`)

Use-case decision: [`docs/rtdb-use-case.md`](docs/rtdb-use-case.md) — Firestore stays canonical for current features.

## Version control

This repo uses Git with milestone tag **`foundations-v1`** on the initial foundations snapshot commit.

**Recover that snapshot**

```bash
git checkout foundations-v1
```

**Push to GitHub** (private repo recommended). Firebase native plists/json are gitignored — use EAS secrets for cloud builds. Install Apple Git / Xcode CLI tools first so `git` works, then either:

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

**History rewrite (July 2026)** — `main` was force-pushed after removing leaked Firebase native configs from git history. If you cloned before that push, reset to remote:

```bash
git fetch --all && git reset --hard origin/main
```

Details: [`docs/security-firebase-key-leak.md`](docs/security-firebase-key-leak.md). Verify sync: `./scripts/verify-leak-remediation-closeout.sh`.

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
| `firebaseDatabaseUrl`        | `EXPO_PUBLIC_FIREBASE_DATABASE_URL` (Realtime Database; optional)   |
| `revenueCatApiKeyApple`      | `REVENUECAT_APPLE_API_KEY`                                          |
| `revenueCatApiKeyGoogle`     | `REVENUECAT_GOOGLE_API_KEY`                                         |
| Entitlement identifiers      | `REVENUECAT_ENTITLEMENT_PRO`, `_WOODEN`, `_FIBERGLASS`, `_LIFETIME` |
| `cloudFunctionsRegion`       | `EXPO_PUBLIC_CLOUD_FUNCTIONS_REGION`                                |

**Local:** copy [.env.example](.env.example) to **`.env`** and fill values (`.env` is gitignored).

**CLI shortcuts (no global install):** `firebase` and `eas` are not on your PATH by default. Use project npm scripts:

| Instead of                                      | Use                                                         |
| ----------------------------------------------- | ----------------------------------------------------------- |
| `firebase login`                                | `npm run firebase:login`                                    |
| `eas login`                                     | `npm run eas:login`                                         |
| `eas whoami`                                    | `npm run eas:whoami`                                        |
| `eas build --profile production --platform all` | `npm run eas:build:production`                              |
| `eas build --profile preview --platform ios`    | `npm run eas:build:preview -- --platform ios`               |
| `eas build …` (any flags)                       | `npm run eas:build -- --profile development --platform ios` |

Avoid `npm install -g eas-cli` unless you fix npm global permissions — the project already includes `eas-cli` and `firebase-tools` as devDependencies.

**EAS Build:** create secrets so cloud builds receive the same names (example):

```bash
eas secret:create --scope project --name REVENUECAT_APPLE_API_KEY --value your_apple_sdk_key --type string
eas secret:create --scope project --name REVENUECAT_GOOGLE_API_KEY --value your_google_sdk_key --type string
eas env:create --name EXPO_PUBLIC_FIREBASE_DATABASE_URL --value 'https://YOUR_PROJECT-default-rtdb.REGION.firebasedatabase.app' --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_FIREBASE_DATABASE_URL --value 'https://YOUR_PROJECT-default-rtdb.REGION.firebasedatabase.app' --environment development --visibility plaintext
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
  - `claimCast` callable (authoritative fishing rewards; entitlement guard via active rod)
- Additional server-required write callables:
  - `submitDiaryEntry`
  - `createWellQuestion`
  - `createCast`
  - `claimCast`
- Sandbox test checklist: `TESTING_IAP.md`
