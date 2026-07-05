# PostHog funnel verification

Prerequisites:

1. Create a PostHog Cloud project and copy the project API key.
2. Set `EXPO_PUBLIC_POSTHOG_API_KEY` in local `.env` and EAS secrets.
3. Set `POSTHOG_API_KEY` (same project key) in Firebase Functions env for server-side events.
4. Optional: `EXPO_PUBLIC_POSTHOG_HOST` / `POSTHOG_HOST` — default `https://app.posthog.com`.
5. Optional scheduler env: `VERIFY_ABANDON_HOURS` (default `1`), `AUTH_CLEANUP_DAYS` (default `7`).

## Manual client checklist — auth funnel (H5)

Open PostHog **Live events** before testing.

- [ ] Cold launch → `auth_gate_viewed` within 5s
- [ ] Type in email → `auth_interaction_started` once (`focused_field: email`)
- [ ] Tap Apple → `auth_interaction_started` (`oauth_apple`)
- [ ] Submit → `auth_form_submitted` with `attempt_count: 1`
- [ ] Wrong password → `auth_error_encountered` + `auth_friction_score` increments; replay filterable via `friction_recording_tag`
- [ ] Second submit → `attempt_count: 2` and friction `+1` for retry
- [ ] Unverified email → `verify_screen_viewed` with `time_since_gate_viewed_ms > 0`
- [ ] Background app on verify → `verify_email_opened`
- [ ] Stay 45s on verify → `auth_friction_signal` with `verify_dwell_45s`
- [ ] New signup → `alias` + `identify` **after init only**; person shows `initial_auth_method`, `hit_verify_wall`
- [ ] Return login → `identify` only (no second alias)
- [ ] Enter Sanctuary → `sanctuary_entered` with `is_first_entry` + `total_onboarding_duration_ms`
- [ ] Saved funnel **Auth Gate → Sanctuary** populates with `auth_method` breakdown
- [ ] Retention cohorts by `auth_friction_score` render D1/D7/D30

## Manual client checklist — craft bench / fishing

- [ ] Open Craft Bench from Sanctuary — `craft_bench_opened` within a few seconds (`entryPoint: sanctuary_tap`)
- [ ] Tap a rod, wait ~3s, switch rod or close — `rod_detail_viewed` with `viewDurationMs` ≈ 3000 and `tappedStartCraft: false`
- [ ] Start a craft — `craft_started` with Wonder/parts matching server deduction
- [ ] Collect when timer completes — `craft_collected` with correct `collectionTiming`
- [ ] Equip a ready rod — `rod_equipped` (server-side via `equipRod`)
- [ ] Complete a lesson — `lesson_completed` (server-side)

## Server-originated events

These fire from Cloud Functions via `posthog-node` (`functions/src/analytics/posthogServer.ts`):

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

## Hybrid verify funnel (PostHog UI)

Save as **Auth Signup → Verify Truth**:

| Step | Event                                      | Source             |
| ---- | ------------------------------------------ | ------------------ |
| 1    | `auth_form_submitted`                      | Client             |
| 2    | `account_created_backend`                  | Backend            |
| 3    | `verify_screen_viewed`                     | Client             |
| 4a   | `verify_wall_abandoned`                    | Backend (drop-off) |
| 4b   | `email_verified_backend` or `auth_success` | Backend / client   |
| 5    | `sanctuary_entered`                        | Client             |

Conversion window: **7 days**. Compare step 1 vs step 2 to detect SDK blockers (~15–20% gap).

## Retention cohorts

**Cohort A:** `auth_friction_score = 0` at first `auth_success`  
**Cohort B:** `auth_friction_score` 1–2  
**Cohort C:** `auth_friction_score >= 3`

Retention returning event: `sanctuary_entered`. Breakdown by `initial_auth_method` and `hit_verify_wall`.

## Session replay

- Enabled in `posthogClient.ts` with `maskAllTextInputs: true`
- PostHog project: enable rageclick detection
- Saved replay filter: `friction_recording_tag = true` OR event = `$rageclick`
- QA: confirm no readable email/password in replays

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
