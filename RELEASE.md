# Release checklist

Mandatory steps before each App Store / Google Play submission.

## Pre-build (one-time or when Firebase native configs change)

1. Log in to EAS: `npm run eas:login`
2. Upload Firebase native files to EAS secrets: `npm run setup:eas-firebase-files`
   - Requires local copies at `assets/GoogleService-Info.plist` and `assets/google-services.json` (download from Firebase Console; not committed to git).
3. Confirm RTDB env on all profiles: `npm run setup:eas-rtdb-env` (if using Realtime Database).

## Build profiles

| Profile       | Channel       | Use case                          |
| ------------- | ------------- | --------------------------------- |
| `development` | `development` | Dev client, internal distribution |
| `preview`     | `preview`     | TestFlight / internal Play track  |
| `production`  | `production`  | App Store / Play Store release    |

```bash
# TestFlight / internal QA (add --platform android for Play internal track)
npm run eas:build:preview -- --platform ios

# Store release (auto-increments build number)
npm run eas:build:production
```

> **Note:** There is no global `eas` on PATH unless you install it separately. Always use **`npm run eas:*`** or **`npm run eas -- <subcommand>`** — the project includes `eas-cli` as a devDependency.

## Auth & security validation (required)

Run automated checks before device QA:

```bash
npm run test:auth-links
npm run test:firestore-rules
```

### Firestore user profile policy (intentional)

Client apps **cannot** create `users/{uid}` documents. Profile bootstrap runs only via the `initializeSanctuary` Cloud Function after email verification. Economy and journal subcollections are server-write-only.

### Auth deep link QA (physical device)

After installing a **dev client** or **preview** build:

- [ ] **Email verification:** tap link from mail app → app opens `/finish-email` → verified user reaches sanctuary path; expired link shows friendly error (not crash)
- [ ] **Password reset:** tap reset link → `/reset-password` → set new password → sign in works
- [ ] **HTTPS universal link:** note URL shape in mail client (should match `firebaseAuthDomain`)
- [ ] **Custom scheme fallback:** if testing `intothepond://` links, confirm they still open auth routes
- [ ] **Rejected links:** phishing host with `oobCode` is ignored silently (no navigation)
- [ ] **Sentry:** trigger wrong-password sign-in; confirm tagged event in Sentry (`area: auth`, `flow: sign_in_email`)

Repeat the deep link checklist on a **preview TestFlight** build before store submission.

## Account deletion (required for store)

- [ ] Signed-in: Sanctuary Gate → scroll to **Delete account** → confirm sheet → sign out
- [ ] Re-login during 30-day grace → **Deletion pending** screen → **Cancel deletion** restores profile
- [ ] Signed-out: login footer **Delete account** opens `https://intothepond.app/delete-account`
- [ ] Web form returns generic success (no email enumeration)
- [ ] `npm run test:firestore-rules` includes `deletion_requests` deny tests

**Policy:** Profile and journal content removed immediately on request. 30-day grace to cancel; permanent purge after. Subscriptions must be cancelled separately in App Store / Google Play. Financial records retained without PII per privacy policy.

Deploy env: set `ACCOUNT_DELETION_SECRET` in functions `.env` before enabling deletion in production.

## iOS privacy manifest

- [x] **Phase 1 placeholder:** [`assets/ios/PrivacyInfo.xcprivacy`](assets/ios/PrivacyInfo.xcprivacy) + [`plugins/withPrivacyManifest.js`](plugins/withPrivacyManifest.js) (included in preview builds via prebuild)
- [ ] **Phase 2 final manifest** — required before production submit; see [`TECH_DEBT.md`](TECH_DEBT.md) → iOS Privacy Manifest checklist

## Physical device validation (required)

Do **not** submit from simulator-only testing. On a **physical device** with a **production** or **preview** build:

- [ ] Cold start → gate → sign up / sign in (email + Apple if available)
- [ ] Email verification deep link opens app (`/finish-email`)
- [ ] Reach sanctuary tab after onboarding
- [ ] IAP sandbox: purchase + restore ([`TESTING_IAP.md`](TESTING_IAP.md))
- [ ] No `127.0.0.1` network calls (Apple sign-in, scene close)
- [ ] Production bundle: no stray `console.log` in release (Babel strips non-error console when `NODE_ENV=production`)

## OTA updates (after first store binary)

Channels are isolated: development builds must never receive production OTA updates.

```bash
# Publish to preview channel after preview build
npm run eas:update -- --channel preview --message "QA fix description"

# Production OTA (only after store app is live with matching runtimeVersion)
npm run eas:update -- --channel production --message "Hotfix description"
```

## Credentials

- Firebase native files: EAS secrets `GOOGLE_SERVICE_INFO_PLIST_BASE64`, `GOOGLE_SERVICES_JSON_BASE64`
- JS config: EAS env vars per [`.env.example`](.env.example) and [README.md](README.md)
- Never commit `assets/GoogleService-Info.plist`, `assets/google-services.json`, or root `GoogleService-Info.plist`
