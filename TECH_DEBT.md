# Technical debt and known issues

Short ledger for **into-the-pond-v3** (native workflow, EAS, Firebase Auth email actions). Update as items are resolved.

## EAS and dev client

- **`expo-dev-client`** is in **`package.json`** for **`eas.json`** **`development`** (`developmentClient: true`). After **`eas build --profile development`**, install the artifact and connect with **`npx expo start --dev-client`**. Confirm that profile builds succeed once linked to Expo (first **`eas build`** may surface credential/setup issues unrelated to this repo).
- Run **`eas build:configure`** (or **`eas init`**) when linking the app to Expo so `extra.eas.projectId` exists in config where the CLI writes it.

### Checklist

- [ ] **`eas build --profile development`** — needs Expo login and Apple/Google credentials. Run **`npm run setup:eas-firebase-files`** first. See [`RELEASE.md`](RELEASE.md) and [`docs/launch-preview-checklist.md`](docs/launch-preview-checklist.md).
- [ ] **`eas build --profile preview`** — TestFlight / internal Play gate before production submit. Run **`npm run verify:eas-preview-prerequisites`** first.
- [ ] **`eas build --profile production`** — store release; validate on physical device per [`RELEASE.md`](RELEASE.md). See [`docs/launch-production-deferred.md`](docs/launch-production-deferred.md).

## Config and secrets

- Replace **`YOUR_*`** placeholders in `app.json` → `expo.extra` with real Firebase / RevenueCat values (and use **EAS secrets** for production if you keep keys out of git).
- **`npm warn Unknown env config "devdir"`** comes from local **npm** configuration, not this repo’s `package.json`. To silence it: **`npm config delete devdir`** (harmless tooling noise; **`npm run verify`** still passes).

### Checklist

- [ ] **`app.json`** **`expo.extra`**: replace **`YOUR_*`** placeholders with real Firebase / RevenueCat values before meaningful builds (use **EAS secrets** when keeping keys out of git).
- [ ] **`eas build:configure`** (or **`eas init`**): run when wiring EAS so **`extra.eas.projectId`** is written where Expo expects—commit those config updates alongside **`eas.json`** changes.
- [ ] **`npm warn Unknown env config "devdir"`**: optional — run **`npm config delete devdir`** once on your machine, or ignore; does not affect **`npm run verify`**.

## Firebase native vs JS

- **JS Firebase** reads config from `expo.extra` via `src/config/env.ts`. **`GoogleService-Info.plist`** / **`google-services.json`** are not read by `initializeApp` in the JS client.
- **`plugins/withFirebaseNativeFiles.js`** wires native Firebase during **`expo prebuild`** when the matching asset file exists (see [README](./README.md) _Firebase: JS config vs native files_).
- **iOS Firebase native SDK** uses **Swift Package Manager** (`firebase-ios-sdk`), not CocoaPods — aligned with Firebase’s CocoaPods sunset (new versions stop publishing Oct 2026). React Native / Expo modules remain on CocoaPods.
- **`Firebase/`** (manual XCFramework zip, ~1.4GB) is **reference only** if present locally — not linked at prebuild. SPM remains the canonical iOS native path unless explicitly migrated.
- **`assets/google-services.json`** is optional until you need Android native config; download it for the Android package name in `app.json`.

### Checklist

- [x] **Firebase native iOS (SPM):** when **`assets/GoogleService-Info.plist`** exists, prebuild adds **`firebase-ios-sdk`** SPM products (**`FirebaseAnalytics`**, **`FirebaseAuth`**, **`FirebaseFirestore`**, **`FirebaseCore`**, **`FirebaseDatabase`**), copies the plist, and patches **AppDelegate** with **`FirebaseApp.configure()`**. Run **`cd ios && pod install`** after prebuild for RN/Expo pods only.
- [ ] **Firebase native Android parity:** plugin applies **`google-services`** Gradle + BoM + **`firebase-analytics`** + **`firebase-database`** when **`google-services.json`** exists; add **`firebase-auth`** / **`firestore`** Gradle deps only if you need native Android parity beyond Analytics + RTDB.
- [x] **Realtime Database ops:** Console instance + **`EXPO_PUBLIC_FIREBASE_DATABASE_URL`** in `.env`; verify with **`npm run verify:firebase-rtdb-env`**; deploy **[`database.rules.json`](./database.rules.json)** via **`npm run deploy:database-rules`**; set same env var on EAS development/production. **Sessions rules hardened** (members-map model) — see **[`docs/rtdb-use-case.md`](./docs/rtdb-use-case.md)**. **No Well co-session UI yet**; Firestore remains canonical for profile/economy.
- [ ] **Firebase manual XCFramework migration (optional):** only if SPM + Expo becomes unstable — replace SPM in the plugin with prebuild-time xcframework linking per **`Firebase/METADATA.md`** (not needed today).

## Auth email links and deep links

- **`ActionCodeSettings`** uses `firebaseAuthDomain` / project id from `expo.extra`. **Authorized domains** in Firebase Console must include the domains used in action / continue URLs.
- Email **open-in-app** behavior depends on OS, mail client, HTTPS universal links vs custom scheme **`intothepond`**; templates may need tuning after testing on devices.

### Checklist

- [ ] **`handleCodeInApp`** / **`ActionCodeSettings`**: **`continueUrl`** and domains align with Firebase Console → **Authentication** → **Settings** → **Authorized domains**, and email templates use URLs Firebase accepts for your project (`buildAuthActionCodeSettings` in **`src/services/firebase/authLinks.ts`**).
- [ ] **Email link → app on devices:** validate password-reset and verification links on **real** iOS/Android hardware; behavior differs by **OS**, **mail client**, and **HTTPS** (universal / App Links) vs custom scheme **`intothepond`** — adjust templates or linking until taps open **`useAuthDeepLink`** routes **`/reset-password`** and **`/finish-email`** as intended.

## Sign in with Google (N1) — manual setup

App code is in place ([`useGoogleSignIn`](src/hooks/auth/useGoogleSignIn.ts), [`AuthGoogleSignInSection`](src/components/auth/AuthGoogleSignInSection.tsx), plugin in [`app.config.js`](app.config.js)); **console/portal configuration is still manual** and blocks device testing.

### Checklist

- [ ] **Google Cloud Console** → OAuth 2.0 Credentials → **Android** client for `com.intothepond.app.v3` with **debug + release SHA-1** fingerprints registered
- [ ] **Firebase Console** → Authentication → Sign-in method → **Google** → Enable
- [ ] **Re-download** [`assets/google-services.json`](assets/google-services.json) (must include `oauth_client` entries, including web client `client_type: 3`)
- [ ] **`.env`**: set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to the Firebase Web client ID (`….apps.googleusercontent.com`)
- [ ] **Native rebuild** after plugin install: `npx expo prebuild` or EAS dev build (Expo Go is insufficient)
- [ ] **Device test**: physical Android → login/signup Google button → user appears in Firebase Auth with `google.com` provider; cancel on account picker shows no error

## UX / resilience

- **Email verification banner** dismissal is session-only (no persistence); users may see it again after restart until `emailVerified` is true.
- **`finish-email`** memoizes **`applyEmailActionCode`** per **`(mode, oobCode)`** for the JS session (**`verificationApplyPromises`** in **`app/(auth)/finish-email.tsx`**) so React Strict Mode’s development-only double effect does not trigger duplicate Firebase applies.

### Checklist

- [ ] **Gate spark effect:** current home-screen ceremony ships without the Skia-based spark/particle burst at lock impact. When ready, add `@shopify/react-native-skia` and implement `LockSpark` as planned (spark burst anchored at the lock) to replace the placeholder impact visuals.

## Auth UI — PNG-baked microcopy (TASK H3, designer)

Code-rendered strings and VoiceOver labels were updated in [`src/constants/authCopy.ts`](src/constants/authCopy.ts). **Visible** copy on these artboards is still baked into PNGs and needs a designer pass:

- [ ] **Login** `15.png` — CTA label: **“Step back in”** (not “Sign in”)
- [ ] **Login** `21.png` — forgot-password link: **“Forgot your password? We can help.”**
- [ ] **Login** `22.png` / `23.png` — wrong-email and wrong-password error art (errors are not rendered as `Text` in code)
- [ ] **Signup** `25.png` — headline, CTA **“Save my place”**, sign-in link **“I've been here before — Sign in”**
- [ ] **Verify-required** artboard — main instructional copy on image
- [ ] **Email-verified** artboard — celebration headline on image

Until assets are regenerated, sighted users will still see old PNG copy; VoiceOver uses updated `accessibilityLabel` values where hit targets exist.

## iOS Privacy Manifest

- **Phase 1 (placeholder):** [`assets/ios/PrivacyInfo.xcprivacy`](assets/ios/PrivacyInfo.xcprivacy) is copied into the iOS app target at prebuild via [`plugins/withPrivacyManifest.js`](plugins/withPrivacyManifest.js). Sufficient for preview / TestFlight builds.
- **Phase 2 (required before production App Store submit):** finalize manifest from compliance docs — see checklist below.

### Checklist — Phase 2 (before `eas:build:production`)

- [ ] **Reason codes:** Cross-walk each `NSPrivacyAccessedAPIType` entry in [`assets/ios/PrivacyInfo.xcprivacy`](assets/ios/PrivacyInfo.xcprivacy) against actual app + SDK API usage; remove over-declarations, add any gaps (e.g. disk space, system boot time if triggered by app code).
- [ ] **SDK manifest audit:** After `npx expo prebuild --platform ios`, inspect merged `PrivacyInfo.xcprivacy` from Firebase, Sentry, PostHog, RevenueCat, and Expo pods/SPM packages; ensure no undeclared Required Reason API warnings on App Store Connect upload.
- [ ] **Collected data types:** Populate `NSPrivacyCollectedDataTypes` to match App Store Connect “App Privacy” questionnaire (email, user ID, purchases, analytics — align with privacy policy and P5-E session replay disclosure).
- [ ] **Tracking flag:** Confirm `NSPrivacyTracking` remains `false` unless IDFA / cross-app tracking is introduced; reconcile PostHog session replay with policy copy (not Apple “tracking” unless ATT applies).
- [ ] **Legal sign-off:** Privacy policy + compliance drafts explicitly cover declared APIs and data types.
- [ ] **RELEASE.md:** Check privacy manifest box on production sign-off.

---

For setup commands and Firebase Auth email-action notes, see **[README.md](./README.md)** (Configuration and Native projects / Firebase sections).
