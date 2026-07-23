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

## Firebase cost (Blaze)

For the **current architecture**, budget **Firestore + Cloud Functions only**. RTDB is sessions-only and is not the primary cost driver. Do not fold Auth/hosting/other surfaces into the cost model unless we add new paid products.

- **Preview / TestFlight:** Blaze is required for Cloud Functions deploy; expect **near-free** at current preview scale.
- **~1k engaged users:** plan for **real money** — monitor Firebase Usage and set a **billing budget alert**; expect non-trivial reads/writes from callables + listeners.
- **Before ~10k registered accounts:** redesign **daily user-wide** schedulers so they are not O(users) per day. Today’s jobs:
  - [`functions/src/index.ts`](functions/src/index.ts) — `syncSubscriptionStatusDaily` (`users` collection full scan)
  - [`functions/src/sanctuary/economy/scheduledReconciliation.ts`](functions/src/sanctuary/economy/scheduledReconciliation.ts) — all-users reconcile
  - [`functions/src/sanctuary/economy/compactEconomyLedger.ts`](functions/src/sanctuary/economy/compactEconomyLedger.ts) — daily compaction
  - [`functions/src/auth/purgeExpiredAccountDeletions.ts`](functions/src/auth/purgeExpiredAccountDeletions.ts) — deletion purge (query-scoped; still review carefully at scale)
  - [`functions/src/analytics/authFunnelTriggers.ts`](functions/src/analytics/authFunnelTriggers.ts) — `sweepVerifyWallAbandoned`, `nightlyAbandonedAuthCleanup`

### Checklist

- [x] **Blaze + billing budget alert** on project `into-the-pond` — `$25/mo`, thresholds 50/90/100%, 2026-07-21
- [ ] **Before ~10k accounts:** replace full-collection daily jobs with indexed/queued/paged work (subscription sync + economy reconciliation first)

## Auth email links and deep links

- **`ActionCodeSettings`** uses `firebaseAuthDomain` / project id from `expo.extra`. **Authorized domains** in Firebase Console must include the domains used in action / continue URLs.
- Email **open-in-app** behavior depends on OS, mail client, HTTPS universal links vs custom scheme **`intothepond`**; templates may need tuning after testing on devices.

### Checklist

- [x] **`handleCodeInApp`** / **`ActionCodeSettings`**: **`continueUrl`** and domains align with Firebase Console → **Authentication** → **Settings** → **Authorized domains**, and email templates use URLs Firebase accepts for your project (`buildAuthActionCodeSettings` in **`src/services/firebase/authLinks.ts`**). Verified 2026-07-21: env `into-the-pond.firebaseapp.com` → continue `https://into-the-pond.firebaseapp.com/finish-email`; Authorized domains include that host (+ `localhost`, `into-the-pond.web.app`); verification template action URL on same host.
- [ ] **Email link → app on devices:** validate password-reset and verification links on **real** iOS/Android hardware; behavior differs by **OS**, **mail client**, and **HTTPS** (universal / App Links) vs custom scheme **`intothepond`** — adjust templates or linking until taps open **`useAuthDeepLink`** routes **`/reset-password`** and **`/finish-email`** as intended.

## Sign in with Google (N1) — manual setup

App code is in place ([`useGoogleSignIn`](src/hooks/auth/useGoogleSignIn.ts), [`AuthGoogleSignInSection`](src/components/auth/AuthGoogleSignInSection.tsx), plugin in [`app.config.js`](app.config.js)); **console/portal configuration is still manual** and blocks device testing.

**After console steps:** `npm run setup:google-signin-env` then `npm run verify:google-signin-env` (does not print secrets).

### Checklist

- [x] **Google Cloud Console** → OAuth 2.0 Credentials → **Android** client for `com.intothepond.app.v3` with **debug + release SHA-1** fingerprints registered — _2026-07-21: Google provider enabled; downloaded JSON has `oauth_client` type 3 only (no type 1 Android entry yet). If device sign-in fails, add debug/release SHA-1 in Firebase Project settings and re-download._
- [x] **Firebase Console** → Authentication → Sign-in method → **Google** → Enable (support email required) → Save
- [x] **Re-download** [`assets/google-services.json`](assets/google-services.json) (must include `oauth_client` entries, including web client `client_type: 3`)
- [x] **`.env`**: set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (or run `npm run setup:google-signin-env` after re-download)
- [ ] **Native rebuild** after plugin install: `npx expo prebuild` or EAS dev build (Expo Go is insufficient)
- [ ] **Device test**: physical Android → login/signup Google button → user appears in Firebase Auth with `google.com` provider; cancel on account picker shows no error

**Console quick path:** [Auth providers](https://console.firebase.google.com/project/into-the-pond/authentication/providers) → Enable Google → pick support email → Save → [Project settings](https://console.firebase.google.com/project/into-the-pond/settings/general) → Android app → add SHA-1 → download `google-services.json`.

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

- **Phase 1 (placeholder):** [`assets/ios/PrivacyInfo.xcprivacy`](assets/ios/PrivacyInfo.xcprivacy) is copied into the iOS app target at prebuild via [`plugins/withPrivacyManifest.js`](plugins/withPrivacyManifest.js). **Status:** sufficient for preview / TestFlight (confirmed 2026-07-21). No Phase 2 work until production submit.
- **Phase 2 (required before production App Store submit):** finalize manifest from compliance docs — see checklist below. Deferred: [`docs/launch-production-deferred.md`](docs/launch-production-deferred.md).

### Checklist — Phase 2 (before `eas:build:production`)

- [ ] **Reason codes:** Cross-walk each `NSPrivacyAccessedAPIType` entry in [`assets/ios/PrivacyInfo.xcprivacy`](assets/ios/PrivacyInfo.xcprivacy) against actual app + SDK API usage; remove over-declarations, add any gaps (e.g. disk space, system boot time if triggered by app code).
- [ ] **SDK manifest audit:** After `npx expo prebuild --platform ios`, inspect merged `PrivacyInfo.xcprivacy` from Firebase, Sentry, PostHog, RevenueCat, and Expo pods/SPM packages; ensure no undeclared Required Reason API warnings on App Store Connect upload.
- [ ] **Collected data types:** Populate `NSPrivacyCollectedDataTypes` to match App Store Connect “App Privacy” questionnaire (email, user ID, purchases, analytics — align with privacy policy and P5-E session replay disclosure).
- [ ] **Tracking flag:** Confirm `NSPrivacyTracking` remains `false` unless IDFA / cross-app tracking is introduced; reconcile PostHog session replay with policy copy (not Apple “tracking” unless ATT applies).
- [ ] **Legal sign-off:** Privacy policy + compliance drafts explicitly cover declared APIs and data types.
- [ ] **RELEASE.md:** Check privacy manifest box on production sign-off.

## Fishing / craft economy (content package)

Working decisions from `00-open-items-followups.md` (locked until on9 overrides):

- [x] **1.3** — Sheet C target frequencies are **per catch** (not per cast).
- [x] **1.1** — `bait_mid` must **not** zero rare-element Wonder gates (40W → 0W). Live: `effectiveWonderGate` clamps base-40 gates; wildcard premium → 0W remains intentional.
- [x] **1.2** — `bait_premium` epic gate 90W → 40W treated as **intentional** (falls out of ladder walk).
- [x] **4.1** — Journeys 4–5 with 2–3 checkpoints are acceptable for QA.

### Checklist

- [x] **Cast duration:** client `FISHING_CAST_DURATION_MS` + server `CAST_DURATION_MS` set to **2 hours**. Root cause of prior Cloud Run healthcheck failure: `functions.config()` in [`functions/src/config.ts`](functions/src/config.ts) (now env-based). **Full functions deploy** (including `createCast`, `claimCast`, `ensureWellState`, account deletion + purge) completed on `asia-east2`. **Live smoke passed:** `node functions/scripts/smoke-create-cast.mjs` → `readyAt ≈ now + 2h`. Gen2 public invoker granted for those callables via [`scripts/grant-callable-public-invoker.mjs`](scripts/grant-callable-public-invoker.mjs) (Firebase CLI auth). Cost posture thresholds stay open: [Firebase cost (Blaze)](#firebase-cost-blaze).
- [x] **Firestore listener error handlers:** entitlements, root `_layout` user doc, `useWellCardStatus`, offline `db/sync` subscribers, deletion-pending — error callbacks + Sentry.
- [x] **Unmount-safe async:** `useWellQuestion`, `useWellCardStatus`, gate fade timeout in `app/index.tsx`.
- [x] **Wooden lesson marketing:** gate copy updated to `1.4–3.7` (runtime access already included 3.7 via `module <= 3`).
- [x] **TARGET fishing Phase 1:** creature `sub_tier`, `fishingPity`, weighted creature pick (Sheet C), outcome messages, pity tests (`npm run test:fishing`). Audio SFX wiring still open.
- [x] **Craft journey QA notes:** [`docs/craft-journey-assumptions.md`](docs/craft-journey-assumptions.md) — 3.1/3.2 confirmed; **3.3** diary = deep (+8) until product overrides.
- [x] **TARGET fishing Phase 2:** Sheet D bait catch% + gate-tier removal with rare-element 40W clamp (`npm run test:fishing`).
- [ ] **Fishing/craft audio:** wire `01-audio-manifest` SFX into cast/claim/craft UX (`useFishingCraftSounds` wired; drop mp3s into `assets/audio/fishing/` and point `fishingCraftAudio.ts` requires).

## Preview readiness (manual)

- [ ] `npm run eas:login` then `npm run verify:eas-preview-prerequisites`
- [ ] Device auth deep-link QA per [`RELEASE.md`](RELEASE.md)
- [ ] Replace `YOUR_*` in `app.json` / EAS secrets before meaningful preview builds

## Dead code / cleanup

- [x] Purge unused: `PageCurlOverlay`, `PremiumTooltip`, `BreathingGlowOverlay`, `useNarrativeStep`, `ensureUserProfile`, `FieldJournalSpreadView`, `GateBackgroundLayer`, `INTEGRATION_GUIDE.ts`.
- [x] Legacy `app/onboarding/archetype-selector.tsx` redirects to narrative onboarding.
- [x] Unify `minTapTargetRect` (well re-exports fishing helper).
- [x] **Analytics require cycle:** `posthogClient` no longer imports `analyticsOptOut`; boot via [`src/services/analytics/initAnalytics.ts`](src/services/analytics/initAnalytics.ts).
- [x] **WatermelonDB `current_wonder`:** schema **v6** + `addColumns` on `local_user_profile` for installs that reached v5 without those columns. Reload app once; if migration conflicts on an install that already had the columns, local cache resets (Firestore remains source of truth).

## SDK 54 — `expo-av` → `expo-audio` / `expo-video` (deferred)

`expo-av` still works on the current SDK but logs deprecation warnings and will be removed in SDK 54. **Do not mix this into warning cleanup or fishing feature work** — needs device QA for auth overlays + classroom/narrative playback.

### Checklist

- [ ] Migrate sound hooks to **`expo-audio`**: [`useFishingCraftSounds.ts`](src/features/fishing/useFishingCraftSounds.ts), [`useFieldJournalSounds.ts`](src/features/fieldJournal/useFieldJournalSounds.ts), [`playGateChime.ts`](src/services/audio/playGateChime.ts), [`useRitualAmbientSound.ts`](src/hooks/useRitualAmbientSound.ts)
- [ ] Migrate video to **`expo-video`**: [`VideoPlayer.tsx`](src/features/classroom/VideoPlayer.tsx), [`AuthWaitingVideo.tsx`](src/components/auth/AuthWaitingVideo.tsx), [`NarrativeVideoScene.tsx`](src/components/narrative/NarrativeVideoScene.tsx)
- [ ] Device QA: sign-in arrival video, classroom lesson player, narrative onboarding scenes, fishing/craft SFX once assets exist

## Multi-child Create Child Profile (compatibility window)

Core plumbing shipped under allowlist flags. Do **not** self-authorize the deferred items below.

### Checklist

- [x] Shared tier helpers, `createChildProfile` callable, children rules, sealed UI, Gate card, switcher, dual-read (narrative/Well/Atlas), deletion backup, entry+completion analytics
- [ ] **Narrative dual-write to `children/{childId}`:** client writes stay on root during the sealed-child deny window (`children` create/update denied). Server narrative sync callable or post-seal merge required before retiring root fields.
- [ ] **Legacy root child-field writers / rules tighten:** only after every user migrated **and** old clients cannot enter legacy onboarding
- [ ] **Flag flip** Flag A/B beyond `allowlist` — blocked until Section 7 four-gate evidence (incl. uid2 on-device seal + curtain QA)
- [ ] Manual curtain/seam QA: [`docs/create-child-profile-curtain-qa.md`](docs/create-child-profile-curtain-qa.md)

---

For setup commands and Firebase Auth email-action notes, see **[README.md](./README.md)** (Configuration and Native projects / Firebase sections).
