# Launch preview checklist

Master tracker for preview / TestFlight sign-off. **Code for P3–P8 is in the repo** — remaining work is security ops, EAS preview build, and device QA.

**Related docs:** [`RELEASE.md`](../RELEASE.md) · [`launch-device-qa.md`](launch-device-qa.md) · [`responsive-qa.md`](responsive-qa.md) · [`launch-production-deferred.md`](launch-production-deferred.md)

---

## Status at a glance

| Area                             | State        | Notes                                                                                                         |
| -------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------- |
| P3 RevenueCat (A/B/C/D)          | Code done    | Device IAP QA still required                                                                                  |
| P4 Sentry PII (P4-A)             | Code done    | Spot-check `[email]` redaction on device                                                                      |
| P5 Auth funnel + replay (P5-A/E) | Code done    | PostHog project ops + masked replay QA                                                                        |
| P6 Account deletion              | Backend done | Functions live; web form deferred to store ([`launch-production-deferred.md`](launch-production-deferred.md)) |
| P6 Privacy manifest Phase 1      | Code done    | Phase 2 deferred to production                                                                                |
| P6 Responsive P0                 | Code done    | Manual sign-off in [`responsive-qa.md`](responsive-qa.md)                                                     |
| P7 Query limits (P7-A)           | Code done    | Diary cap 100; atlas cap 200                                                                                  |
| P8 CI + EAS workflow             | Code done    | `EXPO_TOKEN` + green CI on `main`                                                                             |
| Firebase key rotation            | **Done**     | Phase 1 complete 2026-07-23 — [`gcp-key-rotation-runbook.md`](gcp-key-rotation-runbook.md)                    |
| GitHub secret scanning           | **Open**     | Both repos                                                                                                    |
| Apple Developer Program          | **Done**     | Membership Active (`fungchj@gmail.com`, team `77T4Z7QUTV`)                                                    |
| Preview binary + device QA       | **Open**     | Gate for calling preview “ready”                                                                              |

---

## Phase 0 — P3–P8 code (verify only, no re-implementation)

Confirm in QA; do not re-build unless regressions appear.

- [x] **P3-A/B/C** — RC bootstrap, foreground refresh, offerings paywall ([`TESTING_IAP.md`](../TESTING_IAP.md))
- [x] **P3-D** — Sentry on `useRevenueCatCustomerInfo` fetch paths
- [x] **P4-A** — Email redaction in Sentry `beforeSend`
- [x] **P5-A/B/C/D** — Launch-spec auth events + `sanctuary_arrived` ([`posthog-verification.md`](posthog-verification.md))
- [x] **P5-E** — Session replay masking + analytics opt-out UI
- [x] **P6-A + backend** — Deletion UI, callables, rules ([`RELEASE.md`](../RELEASE.md))
- [x] **P6-B Phase 1** — Privacy manifest plugin + placeholder plist
- [x] **P6-D-P0** — [`responsive-qa.md`](responsive-qa.md) + archetype `ScrollView` fix
- [x] **P7-A** — `limit(100)` diary sync + local prune; `limit(200)` child atlas
- [x] **P8-A** — [`.github/workflows/eas-build.yml`](../.github/workflows/eas-build.yml)
- [x] **P8-B** — [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (auth-links, firestore-rules, rtdb-rules, secret-scan)
- [x] **P8-C** — `RELEASE.md` CI / responsive / Sentry checklist sections

**Deferred (post-preview / post-launch):** P6-B Phase 2 final manifest · P6-D P1/P2 (iPad, Android, Dynamic Type) · P7-B `expo-image` · `npm run verify` TypeScript cleanup · Google Sign-In console · auth PNG microcopy

---

## Automated (run in repo)

```bash
npm run verify:no-firebase-secrets
npm run verify:firebase-assets-ready         # local native configs (no secrets printed)
npm run test:auth-links                      # 5 tests
npm run test:firestore-rules                 # 30 tests
npm run test:rtdb-rules                      # RTDB rules (requires Java 21 locally)
npm run verify:eas-preview-prerequisites     # EAS login + env names
npm run verify:leak-remediation-closeout     # git sync, 404 URLs, CI API (after history purge)
```

- [ ] All commands above pass locally before preview build
- [ ] [CI on `main`](https://github.com/childlikeheart-starsalign/into-the-pond-v3/actions/workflows/ci.yml) green: `auth-links`, `firestore-rules`, `rtdb-rules`, `secret-scan`
- [ ] Push any local commits ahead of `origin/main` so CI reflects latest `main`

---

## Phase 1 — Firebase key rotation (manual)

Runbook: [`docs/gcp-key-rotation-runbook.md`](gcp-key-rotation-runbook.md)

Completed **2026-07-23** (API Keys API + local assets + EAS secrets). Follow-up: add **release** Android SHA-1 to the new Android key when EAS/Play signing cert is known.

- [x] Download new `assets/google-services.json` + `assets/GoogleService-Info.plist` (after rotation)
- [x] `npm run verify:firebase-assets-ready`
- [x] Restrict **new** Android + iOS API keys in GCP (bundle ID / package name)
- [x] Disable **old** leaked keys in GCP
- [x] `npm run setup:eas-firebase-files`
- [x] Re-run `npm run verify:eas-preview-prerequisites`

---

## Phase 2 — GitHub security (manual)

- [ ] [Secret scanning — into-the-pond-v3](https://github.com/childlikeheart-starsalign/into-the-pond-v3/security/secret-scanning) → Revoked or Resolved
- [ ] [Old repo alert #1](https://github.com/childlikeheart-starsalign/childlike-heart-parenting-course-index.html/security/secret-scanning/1) → Revoked or Resolved
- [ ] Notify collaborators: `git fetch --all && git reset --hard origin/main` (if any pre-rewrite clones)
- [ ] GitHub secret `EXPO_TOKEN` set for [EAS build workflow](https://github.com/childlikeheart-starsalign/into-the-pond-v3/settings/secrets/actions) (optional for local builds; required for CI-triggered EAS)

---

## Phase 3 — Dependabot (manual review)

Doc: [`docs/dependabot-triage.md`](dependabot-triage.md)

- [ ] Review critical/high [Dependabot alerts](https://github.com/childlikeheart-starsalign/into-the-pond-v3/security/dependabot)
- [ ] Merge safe Dependabot PRs or document accepted dev-only risk (`eas-cli`, `firebase-tools` transitives)

---

## Phase 4 — Apple Developer + EAS credentials (manual)

**Apple Developer Program:** Membership **Active** for `fungchj@gmail.com` (Individual team `77T4Z7QUTV`). Enrollment is no longer a preview blocker — remaining Phase 4 items are EAS wiring.

- [x] Enroll Apple ID in [Apple Developer Program](https://developer.apple.com/programs/) — Membership **Active**
- [x] Register App ID `com.intothepond.app.v3` (EAS / Apple portal)
- [x] `npm run eas:login` (project account: see `eas whoami`)
- [x] `eas credentials:configure-build -p ios -e preview` (Ad Hoc cert + profile ready)
- [x] EAS preview env vars set — [`.env.example`](../.env.example): Firebase JS, RevenueCat, Sentry, PostHog, native config base64
- [x] `npm run verify:eas-preview-prerequisites`

---

## Phase 5 — EAS preview build (manual)

- [ ] `npm run eas:build:preview -- --platform ios`
- [ ] Build succeeds on EAS (no “no team associated with your Apple account” error)
- [ ] Install on physical device (TestFlight / internal / direct install)
- [ ] Confirm `PrivacyInfo.xcprivacy` bundled (Phase 1 placeholder — inspect build artifacts or ASC if needed)

Optional: Android preview — `npm run eas:build:preview -- --platform android`

---

## Phase 6 — Backend (done for preview)

Unblocks casting / Well / in-app deletion. Does **not** require the public delete-account URL for preview or private TestFlight.

- [x] Deploy Cloud Functions (including account deletion + purge scheduler + fishing callables)
- [x] Set `ACCOUNT_DELETION_SECRET` in functions production env (deploy packaging via `functions/.env.into-the-pond`; keep the secret out of git)
- [x] Live cast smoke `readyAt ≈ now + 2h` (`node functions/scripts/smoke-create-cast.mjs`); Gen2 public invoker granted for createCast / claimCast / ensureWellState / deletion callables (`scripts/grant-callable-public-invoker.mjs`)

**Store-only (deferred):** host web form + paste URL — see [`launch-production-deferred.md`](launch-production-deferred.md).

- [ ] Host [`docs/delete-account.html`](delete-account.html) at `https://intothepond.app/delete-account`
- [ ] Paste deletion URL in App Store Connect / Play Console when submitting

---

## Phase 7 — Device QA (manual)

Detailed matrix: [`docs/launch-device-qa.md`](launch-device-qa.md)  
Responsive P0: [`docs/responsive-qa.md`](responsive-qa.md)

**Preview sign-off gate:** responsive P0 + auth deep links + one IAP path on **physical device** with preview binary.

### Responsive P0 (simulators — fill tables in `responsive-qa.md`)

- [ ] iPhone SE: auth flows — primary CTAs reachable with keyboard
- [ ] iPhone SE: gate scroll — purchase CTA + account footer + delete account
- [ ] iPhone SE: archetype selector — all three cards reachable
- [ ] iPhone 15 + Pro Max: no blocked primary CTAs on auth + gate

### Auth deep links (physical device)

- [ ] Email verify → `/finish-email` → sanctuary path
- [ ] Expired verify link → friendly error
- [ ] Password reset → `/reset-password` → sign in
- [ ] Sentry wrong-password: `area: auth`, body shows `[email]` not raw address

### IAP sandbox ([`TESTING_IAP.md`](../TESTING_IAP.md))

- [ ] Gate shows store-localized prices from offering
- [ ] Sandbox purchase → Firestore subscription updated
- [ ] Restore purchases
- [ ] Foreground refresh after cancel in iOS Settings

### PostHog ([`posthog-verification.md`](posthog-verification.md))

- [ ] PostHog replay TTL set to 14–30 days in project settings
- [ ] Privacy policy mentions analytics + session replay + PostHog (legal copy)
- [ ] `auth_gate_interaction` → `auth_signin_success` → `sanctuary_arrived` funnel live
- [ ] Session replay: masked inputs/images on auth, journal, well, atlas
- [ ] Analytics opt-out stops Live events; opt-in resumes

### Account deletion (in-app after Phase 6 functions deploy)

- [ ] Gate → Delete account → confirm → sign out
- [ ] Grace period → Cancel deletion restores profile
- [ ] Signed-out footer opens hosted delete-account page — **N/A until web form hosted** ([`launch-production-deferred.md`](launch-production-deferred.md))

### Cold start smoke

- [ ] Cold start → gate → sign in → sanctuary tab
- [ ] No `127.0.0.1` network calls in release build

**Record tester + date** at bottom of [`launch-device-qa.md`](launch-device-qa.md).

---

## Phase 8 — Production (defer)

Do **not** block preview on these. See [`docs/launch-production-deferred.md`](launch-production-deferred.md).

- [ ] P6-B Phase 2 — final privacy manifest reason codes ([`TECH_DEBT.md`](../TECH_DEBT.md))
- [ ] `npm run eas:build:production` + full [`RELEASE.md`](../RELEASE.md) sign-off
- [ ] Store metadata, encryption declaration, production PostHog/Sentry config review

---

## Preview-ready definition

Preview is **ready** when Phases **1–7** are complete for the platform you ship first (iOS):

1. Rotated/restricted Firebase keys + EAS native configs updated
2. GitHub secret scanning resolved
3. Apple Developer active + iOS preview build installs on device
4. Responsive P0 signed off (simulators)
5. Physical device: auth deep links + one IAP path + PostHog smoke
6. Functions deployed (Phase 6 backend). Delete-account **URL** is store-only — see [`launch-production-deferred.md`](launch-production-deferred.md)

**Trigger for production work:** Phase 7 recorded in [`launch-device-qa.md`](launch-device-qa.md).
