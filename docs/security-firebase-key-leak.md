# Native Firebase secrets — post-leak checklist

GitHub secret scanning flagged Firebase native config files committed to git. Complete these steps in Google Cloud / Firebase and in git (cannot be fully automated from CI).

## What leaked

| File                              | Secret field                               | Notes                                                                |
| --------------------------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| `assets/google-services.json`     | `client[].api_key[].current_key` (Android) | Also root `google-services.json` on old repo branch `launch/v3-prep` |
| `assets/GoogleService-Info.plist` | `API_KEY` (iOS)                            | Committed under `assets/` only                                       |

Both files were added in commits `9d7c3e1` / `45c4f20`, removed from the working tree in `11ad905`, but remained in **git history** until `git filter-repo` purge (see **3. Purge git history** below).

Do **not** paste live API keys into this doc after rotation — reference keys by file/field name only.

## Where files belong (never commit)

| Platform  | Local path                                            | EAS / CI                           |
| --------- | ----------------------------------------------------- | ---------------------------------- |
| Android   | `assets/google-services.json` (gitignored)            | `npm run setup:eas-firebase-files` |
| iOS       | `assets/GoogleService-Info.plist` (gitignored)        | same script                        |
| Templates | `assets/*.example` (committed, placeholder keys only) | n/a                                |

Never commit root copies: `google-services.json`, `GoogleService-Info.plist`.

Copy from [`assets/google-services.json.example`](../assets/google-services.json.example) and [`assets/GoogleService-Info.plist.example`](../assets/GoogleService-Info.plist.example), rename to drop `.example`, then replace placeholders from Firebase Console.

## 1. Restrict keys in Google Cloud (minimum)

**Rotation runbook:** [`docs/gcp-key-rotation-runbook.md`](gcp-key-rotation-runbook.md)  
**Verify local assets:** `npm run verify:firebase-assets-ready`

Project: **into-the-pond** → [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)

### Android API key

From `google-services.json` → `client[].api_key[].current_key` (exposed in git history).

- [x] **Application restrictions** → Android apps → package `com.intothepond.app.v3` _(new key, 2026-07-23)_
- [x] Debug SHA-1 registered on Firebase Android app + new Android key _(release SHA still follow-up)_
- [x] **API restrictions** → Restrict key → Firebase-related APIs only

### iOS API key

From `GoogleService-Info.plist` → `API_KEY` (exposed in git history).

- [x] **Application restrictions** → iOS apps → bundle ID `com.intothepond.app.v3` _(new key, 2026-07-23)_
- [x] **API restrictions** → Restrict key → Firebase-related APIs only

## 2. Rotate keys (recommended)

Keys were public on GitHub — treat as compromised even after restriction.

Completed **2026-07-23**: switched local + EAS assets to pre-created “New Android/iOS” GCP keys; neutralized leaked keys (locked to non-existent package/bundle — SA lacks `apikeys.keys.delete`).

- [x] Firebase Console → Project settings → Your apps → download fresh Android JSON + iOS plist _(Console still served old key strings; rotated via GCP API Keys + patched local assets)_
- [x] Replace local `assets/google-services.json` and `assets/GoogleService-Info.plist`
- [x] `npm run setup:eas-firebase-files` (re-upload EAS secrets)
- [x] Disable old Android + iOS API keys in GCP Credentials _(neutralized — rename + impossible app restrictions)_
- [ ] Trigger a test EAS build on both platforms _(Phase 5 — out of Phase 1 scope)_

## 3. Purge git history

From repo root (requires [git-filter-repo](https://github.com/newren/git-filter-repo)):

```bash
git filter-repo \
  --path google-services.json \
  --path GoogleService-Info.plist \
  --path assets/google-services.json \
  --path assets/GoogleService-Info.plist \
  --invert-paths \
  --force
```

Verify before force-push:

```bash
git log --all -- assets/GoogleService-Info.plist assets/google-services.json google-services.json GoogleService-Info.plist
# expect: no output

npm run verify:no-firebase-secrets
# expect: ok
```

Force-push clean history (fetch first — avoids `stale info` after filter-repo):

```bash
git fetch origin main
git push --force-with-lease=main:$(git rev-parse origin/main) origin main
```

Or run [`scripts/finish-leak-remediation-push.sh`](../scripts/finish-leak-remediation-push.sh) for fetch, push, and URL verification.

Anyone with an old clone must `git fetch --all && git reset --hard origin/main` or re-clone after force-push.

Re-run verification after push:

- `git log --all -- assets/GoogleService-Info.plist assets/google-services.json` → no commits
- `npm run verify:no-firebase-secrets` → ok
- Raw GitHub URLs for both `assets/` paths on `main` → 404

### Close-out verification (2026-07-05)

Automated checks (run anytime):

```bash
chmod +x scripts/verify-leak-remediation-closeout.sh
./scripts/verify-leak-remediation-closeout.sh
```

Or re-run [`scripts/finish-leak-remediation-push.sh`](../scripts/finish-leak-remediation-push.sh) (idempotent when synced).

| Check                                        | Status                    |
| -------------------------------------------- | ------------------------- |
| Force-push `main` @ `a8d4fee`                | Done                      |
| Raw URLs 404 (3 paths)                       | Verified                  |
| CI: auth-links, firestore-rules, secret-scan | Success on `a8d4fee`      |
| Local history purge                          | 0 commits on leaked paths |

## 4. Resolve GitHub secret scanning

**Requires GitHub login** — cannot be automated from CI.

- [ ] **into-the-pond-v3:** [Security → Secret scanning](https://github.com/childlikeheart-starsalign/into-the-pond-v3/security/secret-scanning) — resolve open alerts as **Revoked** (rotated) or **Resolved** (restricted + history removed)
- [ ] **Old repo:** [alert #1](https://github.com/childlikeheart-starsalign/childlike-heart-parenting-course-index.html/security/secret-scanning/1) → same resolution if still open

After resolving, re-run `./scripts/verify-leak-remediation-closeout.sh` — automated section should still pass; alerts are cleared in GitHub UI only.

## 5. Collaborators — reset after history rewrite

`main` history was rewritten (`git filter-repo`). Anyone who cloned **before** the force-push must reset or re-clone:

```bash
git fetch --all && git reset --hard origin/main
```

Local branches based on pre-rewrite commits will not fast-forward. Delete stale local branches or re-clone the repo.

## 6. Ongoing prevention

- Run `npm run verify:no-firebase-secrets` before release (see [`RELEASE.md`](../RELEASE.md))
- Pre-commit hook blocks staging native config files or Google API key patterns
- CI `secret-scan` job on main/PR

## Related scripts

| Script                                        | Purpose                                  |
| --------------------------------------------- | ---------------------------------------- |
| `scripts/setup-eas-firebase-files.mjs`        | Upload local assets to EAS               |
| `scripts/write-firebase-native-files.mjs`     | Write EAS secrets to assets locally      |
| `scripts/finish-leak-remediation-push.sh`     | Post-purge force-push + URL verification |
| `scripts/verify-no-firebase-secrets.mjs`      | Guard against re-commit                  |
| `scripts/verify-leak-remediation-closeout.sh` | Post-push sync + CI + 404 verification   |
