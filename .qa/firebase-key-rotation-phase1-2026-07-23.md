# Phase 1 Firebase key rotation — 2026-07-23

## Done

| Step                               | Result                                                           |
| ---------------------------------- | ---------------------------------------------------------------- |
| Enable `apikeys.googleapis.com`    | Done (Service Usage)                                             |
| New Android key restricted         | package `com.intothepond.app.v3` + debug SHA-1                   |
| New iOS key restricted             | bundle `com.intothepond.app.v3`                                  |
| Local assets updated               | `assets/google-services.json`, `assets/GoogleService-Info.plist` |
| `verify:firebase-assets-ready`     | PASS                                                             |
| Old leaked keys                    | Neutralized (impossible package/bundle); SA cannot `keys.delete` |
| `setup:eas-firebase-files`         | PASS (dev/preview/production)                                    |
| `verify:eas-preview-prerequisites` | PASS                                                             |

## Follow-ups (not Phase 1 blockers)

1. Add **EAS/Play release SHA-1** to the new Android API key (and Firebase Android app SHA list).
2. Soft-delete neutralized keys from GCP Console when an owner account can use `apikeys.keys.delete`.
3. Phase 5: `npm run eas:build:preview` smoke with rotated secrets.
4. Workspace debug keystore used for restriction SHA lives at `.qa/android-debug.keystore` — replace with real signing SHA for production Android builds.
