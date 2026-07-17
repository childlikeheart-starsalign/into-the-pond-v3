# Launch preview checklist

Master tracker for preview / TestFlight sign-off. Automated checks first; manual steps link to detailed docs.

## Automated (run in repo)

```bash
npm run verify:leak-remediation-closeout   # git sync, 404 URLs, CI API
npm run verify:no-firebase-secrets
npm run test:auth-links                      # 5 tests
npm run test:firestore-rules                 # 22+ rules tests
npm run verify:firebase-assets-ready         # local native configs (no secrets printed)
npm run verify:eas-preview-prerequisites     # EAS login + env names
```

**CI on `main`:** [Actions → CI](https://github.com/childlikeheart-starsalign/into-the-pond-v3/actions/workflows/ci.yml) — auth-links, firestore-rules, secret-scan.

---

## Phase 1 — Firebase key rotation (manual)

Runbook: [`docs/gcp-key-rotation-runbook.md`](gcp-key-rotation-runbook.md)

- [ ] Download new `assets/google-services.json` + `assets/GoogleService-Info.plist`
- [ ] `npm run verify:firebase-assets-ready`
- [ ] Restrict **new** Android + iOS API keys in GCP
- [ ] Disable **old** leaked keys in GCP
- [ ] `npm run setup:eas-firebase-files`
- [ ] `npm run eas:build:preview -- --platform ios` smoke test

---

## Phase 2 — GitHub security (manual)

- [ ] [Secret scanning — into-the-pond-v3](https://github.com/childlikeheart-starsalign/into-the-pond-v3/security/secret-scanning) → Revoked or Resolved
- [ ] [Old repo alert #1](https://github.com/childlikeheart-starsalign/childlike-heart-parenting-course-index.html/security/secret-scanning/1) → Revoked or Resolved
- [ ] Notify collaborators: `git fetch --all && git reset --hard origin/main` (if any pre-rewrite clones)

---

## Phase 3 — Dependabot (manual review)

Doc: [`docs/dependabot-triage.md`](dependabot-triage.md)

- [ ] Review critical/high alerts on GitHub
- [ ] Merge safe Dependabot PRs or document accepted dev-only risk

---

## Phase 4 — EAS preview build (manual)

- [ ] EAS env vars set for preview (Firebase JS, RevenueCat, Sentry, PostHog) — [`.env.example`](../.env.example)
- [ ] GitHub secret `EXPO_TOKEN` for Actions — [`RELEASE.md`](../RELEASE.md)
- [ ] `npm run verify:eas-preview-prerequisites`
- [ ] `npm run eas:build:preview -- --platform ios`
- [ ] Install on physical device (TestFlight / internal)

---

## Phase 5 — Device QA (manual)

Detailed matrix: [`docs/launch-device-qa.md`](launch-device-qa.md)  
Responsive P0: [`docs/responsive-qa.md`](responsive-qa.md)

**Preview sign-off gate:** responsive P0 + auth deep links + one IAP path on physical device.

---

## Phase 6 — Production (defer)

See [`docs/launch-production-deferred.md`](launch-production-deferred.md) — do not block preview.

---

## Preview-ready definition

All Phase 1–5 checkboxes complete for the paths you are shipping in preview (iOS first per current EAS workflow).
