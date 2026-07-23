# GCP Firebase key rotation runbook

Step-by-step for Phase 1 of the launch plan. Project: **into-the-pond**, package/bundle: `com.intothepond.app.v3`.

After each step, verify locally:

```bash
npm run verify:firebase-assets-ready
```

## 1. Download fresh native configs

1. [Firebase Console](https://console.firebase.google.com/) → **into-the-pond** → ⚙ **Project settings** → **Your apps**
2. **Android** (`com.intothepond.app.v3`) → download `google-services.json` → save as `assets/google-services.json`
3. **iOS** (`com.intothepond.app.v3`) → download `GoogleService-Info.plist` → save as `assets/GoogleService-Info.plist`
4. Run `npm run verify:firebase-assets-ready`

If Firebase does not issue new API keys automatically, create new keys in [GCP Credentials](https://console.cloud.google.com/apis/credentials) and regenerate config files.

## 2. Restrict new keys (GCP)

[Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)

### Android key

From `assets/google-services.json` → `client[].api_key[].current_key` (do not paste into docs or git).

| Setting                  | Value                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Application restrictions | Android apps                                                                                                                                |
| Package name             | `com.intothepond.app.v3`                                                                                                                    |
| SHA-1                    | Debug + release fingerprints (Firebase Console → Project settings → Android app, or `cd android && ./gradlew signingReport` after prebuild) |
| API restrictions         | Restrict key → Firebase-related APIs only                                                                                                   |

### iOS key

From `assets/GoogleService-Info.plist` → `API_KEY`.

| Setting                  | Value                                     |
| ------------------------ | ----------------------------------------- |
| Application restrictions | iOS apps                                  |
| Bundle ID                | `com.intothepond.app.v3`                  |
| API restrictions         | Restrict key → Firebase-related APIs only |

## 3. Disable old leaked keys

In GCP Credentials, **disable** (not delete) the API keys that were exposed in git history. Test the app before deleting permanently.

## 4. Upload to EAS

```bash
npm run eas:login
npm run setup:eas-firebase-files
npm run verify:eas-preview-prerequisites
```

## 5. Smoke test build

```bash
npm run eas:build:preview -- --platform ios
```

## 6. Mark complete

Phase 1 closed **2026-07-23**. Preview build remains Phase 5.

- [x] New configs in `assets/` (verified by script)
- [x] New keys restricted in GCP
- [x] Old keys disabled
- [x] EAS secrets uploaded
- [ ] Preview build succeeded _(Phase 5)_
- [x] Update checkboxes in [`security-firebase-key-leak.md`](security-firebase-key-leak.md) §1–2
