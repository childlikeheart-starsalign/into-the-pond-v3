# PostHog funnel verification

Prerequisites:

1. Create a PostHog Cloud project and copy the project API key.
2. Set `EXPO_PUBLIC_POSTHOG_API_KEY` in local `.env` and EAS secrets.
3. Set `POSTHOG_API_KEY` (same project key) in Firebase Functions env for server-side events.
4. Optional: `EXPO_PUBLIC_POSTHOG_HOST` / `POSTHOG_HOST` — default `https://app.posthog.com`.
5. Optional scheduler env: `VERIFY_ABANDON_HOURS` (default `1`), `AUTH_CLEANUP_DAYS` (default `7`).

## Manual client checklist — auth funnel (launch spec)

Open PostHog **Live events** before testing. Event names are **direct-renamed** (no legacy dual-fire).

### Gate & sign-in

- [ ] Cold launch → `auth_gate_interaction` with `action: viewed` within 5s
- [ ] Type in email on sign-in → `auth_signin_started` once + `auth_gate_interaction` (`action: focus`)
- [ ] Tap Apple → `auth_signin_started` (`auth_method: apple`)
- [ ] Submit sign-in → `auth_signin_submitted` with `attempt_count: 1`
- [ ] Wrong password → `auth_signin_failed` + `auth_friction_score` increments; replay filterable via `friction_recording_tag`
- [ ] Second submit → `auth_signin_error_recovery` + `auth_signin_submitted` with `attempt_count: 2`
- [ ] Successful sign-in → `auth_signin_success` with `total_duration_from_gate_ms`

### Sign-up

- [ ] Focus email on sign-up → `auth_signup_started` once
- [ ] Submit sign-up → `auth_signup_submitted`
- [ ] Validation / provider error → `auth_signup_failed` with `signup_error_count` on person

### Verify wall

- [ ] Unverified email → `auth_verify_pending` (`action: screen_viewed`) with `time_since_gate_viewed_ms > 0`
- [ ] Background app on verify → `auth_verify_pending` (`action: email_client_opened`)
- [ ] Stay 45s on verify → `auth_verify_abandoned` with `dwell_seconds: 45`
- [ ] Resend verification → `auth_verify_resent`
- [ ] Email verified + init → `auth_verify_completed`

### Identity & sanctuary

- [ ] New signup → `alias` + `identify` **after init only**; person shows `initial_auth_method`, `hit_verify_wall`, `auth_method`, `signup_date`
- [ ] Return login → `identify` only (no second alias)
- [ ] Enter Sanctuary tab (each focus when initialized) → `sanctuary_arrived` with `ms_since_gate_viewed`
- [ ] Saved funnel **Auth Gate → Sanctuary** uses `auth_signin_success` → `sanctuary_arrived`
- [ ] Retention cohorts by `auth_friction_score` render D1/D7/D30

## Manual client checklist — craft bench / fishing

- [ ] Open Craft Bench from Sanctuary — `craft_bench_opened` within a few seconds (`entryPoint: sanctuary_tap`)
- [ ] Tap a rod, wait ~3s, switch rod or close — `rod_detail_viewed` with `viewDurationMs` ≈ 3000 and `tappedStartCraft: false`
- [ ] Start a craft — `craft_started` with Wonder/parts matching server deduction
- [ ] Collect when timer completes — `craft_collected` with correct `collectionTiming`
- [ ] Equip a ready rod — `rod_equipped` (server-side via `equipRod`)
- [ ] Complete a lesson — `lesson_completed` (server-side)

## Manual client checklist — fishing claim ceremony

Open PostHog **Live events** before testing. Filter: `fishing_claim` OR `pond_ripple` OR `claim_celebration`.

Prerequisites: dev client signed in, `EXPO_PUBLIC_POSTHOG_API_KEY` set, analytics opt-out off. Use backdate path from [`.qa/live-sanctuary-claim-qa.md`](../.qa/live-sanctuary-claim-qa.md) §2 for claim without 2h wait.

Automated contract check: `npm run verify:fishing-ceremony-qa`

### Always-on ring (shipped)

Sanctuary always renders `CatalogRarityRing`; `ringUiEnabled: true` on all three events. The Firestore flag `catalogRarityRingUi` may be seeded `all` for consistency but does not gate the UI.

Expect **3** events on a full claim (backdate path):

- [ ] `fishing_claim_resolved` — `ringUiEnabled: true`
- [ ] `pond_ripple_complete` after ring (~2s) — `caughtTier`, `subscriptionTier`, `ringUiEnabled: true`
- [ ] `claim_celebration_dismissed` on Continue — `ringUiEnabled: true`, `dwellMs` > 0

`caughtTier`: miss → `empty`; common/rare/epic map from `outcomeToDisplayTier`.

### Audio (Sanctuary cast/claim)

- [ ] Cast accept → splash (`cast-splash.mp3`) then looping ambient (`pond-waiting-ambient.mp3`)
- [ ] Claim resolve → ambient stops; outcome sting (`claim-catch` / `claim-duplicate` / `claim-miss-chance`)
- [ ] Wonder-gate miss SFX (`claim-miss-wonder-gate.mp3`) when claim summary has `metadata.reason: "wonder_gate"` (wired via `toClientClaimSummary`)

### Controls

- [ ] Analytics opt-out ON → no new fishing/ripple/dismiss events; opt-in → events resume
- [ ] Event payloads contain no email, child names, or spirit message text

## Server-originated events

These fire from Cloud Functions via `posthog-node` (`functions/src/analytics/posthogServer.ts`). Skipped when `users/{uid}.analyticsOptOut === true`.

| Event                     | Trigger                        | When                                                    |
| ------------------------- | ------------------------------ | ------------------------------------------------------- |
| `lesson_completed`        | `completeLessonReflection`     | Lesson reflection saved (first completion)              |
| `rod_equipped`            | `equipRod`                     | Rod state transitions to `equipped`                     |
| `account_created_backend` | Auth `onCreate`                | Firebase user record created                            |
| `email_verified_backend`  | `initializeSanctuary` callable | First successful init after email verified (idempotent) |
| `verify_wall_abandoned`   | Hourly scheduler               | Unverified password user past abandon window            |

### Server checklist

- [ ] `POSTHOG_API_KEY` set in Firebase Functions env
- [ ] Email signup in staging → `account_created_backend` within seconds (`distinctId` = Firebase UID)
- [ ] Firestore `users/{uid}.authFunnel` created with `verifyAbandonedEventSent: false`, `sanctuaryInitialized: false`
- [ ] Leave test user unverified >1h → `verify_wall_abandoned` fires once
- [ ] Re-run scheduler → same user **not** re-tagged
- [ ] Verify email link → `email_verified_backend` fires
- [ ] Apple signup (verified at creation) → **no** `verify_wall_abandoned`
- [ ] User with `analyticsOptOut: true` → server events **not** sent

## Hybrid verify funnel (PostHog UI)

Save as **Auth Signup → Verify Truth**:

| Step | Event                                             | Source             |
| ---- | ------------------------------------------------- | ------------------ |
| 1    | `auth_signup_submitted`                           | Client             |
| 2    | `account_created_backend`                         | Backend            |
| 3    | `auth_verify_pending`                             | Client             |
| 4a   | `verify_wall_abandoned`                           | Backend (drop-off) |
| 4b   | `email_verified_backend` or `auth_signin_success` | Backend / client   |
| 5    | `sanctuary_arrived`                               | Client             |

Conversion window: **7 days**. Compare step 1 vs step 2 to detect SDK blockers (~15–20% gap).

## Retention cohorts

**Cohort A:** `auth_friction_score = 0` at first `auth_signin_success`  
**Cohort B:** `auth_friction_score` 1–2  
**Cohort C:** `auth_friction_score >= 3`

Retention returning event: `sanctuary_arrived`. Breakdown by `initial_auth_method` and `hit_verify_wall`.

## Session replay (P5-E)

### Client configuration

Enabled in `posthogClient.ts` with hardened masking:

- `maskAllTextInputs: true` — parent email/password
- `maskAllImages: true` — journal, atlas, child imagery
- `maskAllSandboxedViews: true` — system pickers (iOS)

> **Note:** `posthog-react-native` does not expose `maskAllTexts`; text inputs and images are masked via the flags above. QA must confirm journal/well static `Text` is not readable in replay.

### PostHog Cloud — retention & access

Configure in PostHog project settings (document in privacy policy):

- [ ] Session replay TTL: **14–30 days** (shorter than funnel events)
- [ ] Event / person retention aligned with privacy policy
- [ ] PostHog project access restricted to authorized roles
- [ ] EU region / DPA if applicable
- [ ] **PostHog** listed as analytics subprocessor in privacy policy

### Privacy policy paragraph (compliance draft)

Parents consent to **product analytics**, including **session replay** processed by **PostHog**, to improve UX and fix friction. Child-related content parents enter may appear in analytics; replay uses **client-side masking** (inputs and images) and **limited retention**. Parents may **opt out** via Sanctuary Gate → **Analytics & privacy** or sign-in footer; core service still works.

### Client QA — masked replay

- [ ] Replay on → navigate auth, journal, well, atlas → **no readable** parent email, child free-text, or identifiable images in PostHog replay UI
- [ ] Friction events (`auth_signin_failed`, `auth_friction_signal`, etc.) still fire with `friction_recording_tag` for replay correlation
- [ ] Opt-out toggle → no new client events; replay stops
- [ ] Opt-in → events resume; `identify` runs after sanctuary init

### Compliance QA

- [ ] Privacy policy mentions analytics + session replay + PostHog + masking + retention
- [ ] Parent-operated / parent-entered child data distinction clear
- [ ] Replay TTL in PostHog matches policy

**Fallback gate:** Unmasked child or credential content in replay UI → set `enableSessionReplay: false` until fixed.

## PII

- Never include email, password, or child data in event properties
- `error_code` = Firebase / provider code strings only
- Server events: provider + boolean `email_verified_status` only

## Typecheck

```bash
npx tsc --noEmit
cd functions && npm run build
```

## Audit gate reminders (staging)

- Verified-uninitialized users must not reach sanctuary without `initializeSanctuary`
- Celebration flag must not be written before init succeeds
- `userDocStatus: ready` only when `authFunnel.sanctuaryInitialized === true`
- Offline sync listeners deferred until init complete
