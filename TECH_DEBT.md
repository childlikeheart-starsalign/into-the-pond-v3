# Technical debt and known issues

Short ledger for **into-the-pond-v3** (native workflow, EAS, Firebase Auth email actions). Update as items are resolved.

## EAS and dev client

- **`expo-dev-client`** is in **`package.json`** for **`eas.json`** **`development`** (`developmentClient: true`). After **`eas build --profile development`**, install the artifact and connect with **`npx expo start --dev-client`**. Confirm that profile builds succeed once linked to Expo (first **`eas build`** may surface credential/setup issues unrelated to this repo).
- Run **`eas build:configure`** (or **`eas init`**) when linking the app to Expo so `extra.eas.projectId` exists in config where the CLI writes it.

### Checklist

- [ ] **`eas build --profile development`** — needs your Expo login and Apple/Google credentials. Run it locally when you’re ready to confirm cloud builds.

## Config and secrets

- Replace **`YOUR_*`** placeholders in `app.json` → `expo.extra` with real Firebase / RevenueCat values (and use **EAS secrets** for production if you keep keys out of git).
- **`npm warn Unknown env config "devdir"`** comes from local **npm** configuration, not this repo’s `package.json`. To silence it: **`npm config delete devdir`** (harmless tooling noise; **`npm run verify`** still passes).

### Checklist

- [ ] **`app.json`** **`expo.extra`**: replace **`YOUR_*`** placeholders with real Firebase / RevenueCat values before meaningful builds (use **EAS secrets** when keeping keys out of git).
- [ ] **`eas build:configure`** (or **`eas init`**): run when wiring EAS so **`extra.eas.projectId`** is written where Expo expects—commit those config updates alongside **`eas.json`** changes.
- [ ] **`npm warn Unknown env config "devdir"`**: optional — run **`npm config delete devdir`** once on your machine, or ignore; does not affect **`npm run verify`**.

## Firebase native vs JS

- **JS Firebase** reads config from `expo.extra` via `src/config/env.ts`. Copying **`GoogleService-Info.plist`** / **`google-services.json`** during prebuild does not, by itself, enable the full **native** Firebase Gradle/Xcode stack (e.g. FCM, some native SDKs); the config plugin only places files for when you wire native tooling later.
- **`assets/google-services.json`** is optional until you need Android native config; download it for the Android package name in `app.json`.

### Checklist

- [ ] **Firebase native Android:** copying **`google-services.json`** does not apply the Gradle **`google-services`** plugin; full native Firebase stacks (FCM, native Analytics, RN Firebase) need extra Gradle/Xcode setup beyond this repo.

## Auth email links and deep links

- **`ActionCodeSettings`** uses `firebaseAuthDomain` / project id from `expo.extra`. **Authorized domains** in Firebase Console must include the domains used in action / continue URLs.
- Email **open-in-app** behavior depends on OS, mail client, HTTPS universal links vs custom scheme **`intothepond`**; templates may need tuning after testing on devices.

### Checklist

- [ ] **`handleCodeInApp`** / **`ActionCodeSettings`**: **`continueUrl`** and domains align with Firebase Console → **Authentication** → **Settings** → **Authorized domains**, and email templates use URLs Firebase accepts for your project (`buildAuthActionCodeSettings` in **`src/services/firebase/authLinks.ts`**).
- [ ] **Email link → app on devices:** validate password-reset and verification links on **real** iOS/Android hardware; behavior differs by **OS**, **mail client**, and **HTTPS** (universal / App Links) vs custom scheme **`intothepond`** — adjust templates or linking until taps open **`useAuthDeepLink`** routes **`/reset-password`** and **`/finish-email`** as intended.

## UX / resilience

- **Email verification banner** dismissal is session-only (no persistence); users may see it again after restart until `emailVerified` is true.
- **`finish-email`** memoizes **`applyEmailActionCode`** per **`(mode, oobCode)`** for the JS session (**`verificationApplyPromises`** in **`app/(auth)/finish-email.tsx`**) so React Strict Mode’s development-only double effect does not trigger duplicate Firebase applies.

### Checklist

- [ ] **Gate spark effect:** current home-screen ceremony ships without the Skia-based spark/particle burst at lock impact. When ready, add `@shopify/react-native-skia` and implement `LockSpark` as planned (spark burst anchored at the lock) to replace the placeholder impact visuals.

---

For setup commands and Firebase Auth email-action notes, see **[README.md](./README.md)** (Configuration and Native projects / Firebase sections).
