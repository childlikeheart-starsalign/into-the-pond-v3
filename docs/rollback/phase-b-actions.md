# Phase B actions log (append-only)

Standing safety guardrails (2026-07-13) apply to every entry below and all future
prod-impacting work: secrets redaction, PII minimum exposure, no CR-gate bypass,
no allowlist/scope expansion beyond the active prompt, no `--force`/`-y` unless
explicitly required, default to the more restrictive interpretation when unsure.

## Live Firebase verification guardrails

- Use only the explicitly named UID and callable names. Set `invoker: "public"`
  only when the handler requires `request.auth` and derives the target UID
  exclusively from `request.auth.uid`.
- Never print, persist, or report service-account material, API keys, custom or
  ID tokens, Authorization headers, raw HTTP bodies/errors, environment dumps,
  or stack traces. Emit only an allowlisted schema: HTTP status, callable
  success/error code, document existence, field names, and counts. Redact
  unexpected output.
- Store verification output only in gitignored `tmp/`, then delete it after the
  verification. Do not probe unrelated functions to compare authentication.
- On a non-2xx response, stop after recording the HTTP status and a sanitized
  error category. Do not broaden endpoint probes or Admin-write data to
  simulate the callable.

Format per entry:
`### YYYY-MM-DDTHH:MMZ | <short label>`

- **command:** literal invocation
- **scope:** accounts / flags / resources
- **result:** outcome (no secrets; PII masked)

---

### 2026-07-13T07:06Z | seed feature flags (allowlist)

- **command:** (prior turn) seed `featureFlags/childMigrationDualRead` + `featureFlags/createChildProfileUi` with `rolloutState: allowlist` and exactly two allowlisted UIDs
- **scope:** uid1=`8rvdWY8Z4OZUwdQTrUIytgfwJyk2`, uid2=`hIy34QTkVfcLNcdIQ1DW40Ws7to1`
- **result:** both docs written; `rolloutState` remains `allowlist` (not expanded)

### 2026-07-13T~ | deploy createChildProfile callable

- **command:** firebase deploy of `createChildProfile` (asia-east2, 256MiB, timeout 60s) — see prior session deploy logs under gitignored `tmp/` (now ignored)
- **scope:** Cloud Functions only; no user-doc migration
- **result:** deploy succeeded; rollback note in `docs/rollback/createChildProfile-callable.md`

### 2026-07-13T~ | smoke createChildProfile (uid1)

- **command:** `SMOKE_UID=8rvdWY8Z4OZUwdQTrUIytgfwJyk2 node scripts/smoke-create-child-profile.mjs` (from `functions/`)
- **scope:** uid1 only
- **result:** `SMOKE_OK`; sealed childId=`4IUe7INmMzItxsk7MfjY`; name masked `S…(11)`; dob year `2018`; interests length `1`; idempotent replay OK

### 2026-07-13T11:14Z | scoped migration dry-run + rollback-dry-run

- **command:** `node --import tsx scripts/migrate-children-from-flat.ts --uids=8rvdWY8Z4OZUwdQTrUIytgfwJyk2,hIy34QTkVfcLNcdIQ1DW40Ws7to1 --rollback-dry-run --write-plan`
- **scope:** exactly those two UIDs; Admin `get()` only (no users collection scan); no CR export
- **result:** scanned 2; would-migrate 0; skip `already_migrated`=1 (uid1); skip `no_child_specific_data`=1 (uid2); rollback ops none (nothing actionable; smoke child not targeted by migration rollback)

### 2026-07-13T11:14Z | scoped migration LIVE commit

- **command:** `CONFIRM_SCOPED_LIVE_PILOT=I_UNDERSTAND_SCOPED_LIVE_ONLY node --import tsx scripts/migrate-children-from-flat.ts --uids=8rvdWY8Z4OZUwdQTrUIytgfwJyk2,hIy34QTkVfcLNcdIQ1DW40Ws7to1 --commit --write-plan`
- **scope:** exactly those two UIDs
- **result:** **no Firestore writes** (both skipped). Before/after identical. uid1 still `activeChildId=4IUe7INmMzItxsk7MfjY`, `profileLocked=true`, `childOrder=1`. uid2 still no child docs / no `activeChildId`.

### 2026-07-13T11:14Z | dual-read Admin verify (read-only)

- **command:** `node --import tsx scripts/verify-pilot-child-dual-read.ts --uids=8rvdWY8Z4OZUwdQTrUIytgfwJyk2,hIy34QTkVfcLNcdIQ1DW40Ws7to1`
- **scope:** exactly those two UIDs; Admin get-by-id
- **result:** uid1 PASS (activeChildId, child doc, narrative fields path, header name from summary, sealed). Well/Atlas child paths empty pending first open. uid2 FAIL (no `activeChildId` — blank account; Flag B UI still available). Overall FAIL due to uid2.

### 2026-07-13T~ | Well live callables (uid1) — NOT EXECUTED

- **command:** (proposed) custom-token + `ensureWellState` / `getOrAssignTodaysQuestion` with `childId` against asia-east2
- **scope:** uid1 only
- **result:** **stopped** — auto-review / user interrupt before execution. No Well mutation from this attempt.

### 2026-07-13T11:30Z | standing guardrails adopted + cleanup

- **command:** add `tmp/` to `.gitignore`; delete real-account pilot/smoke temp artifacts under `tmp/`
- **scope:** local workspace hygiene (no prod mutation)
- **result:** real-user temp files deleted; `tmp/` now gitignored; this log created

### 2026-07-13T11:45Z | Well live callables (uid1) — resumed

- **command:** `node --import tsx` (inline): mint custom token for uid1 → Identity Toolkit exchange → POST `https://asia-east2-into-the-pond.cloudfunctions.net/ensureWellState` with `{ data: { childId: "4IUe7INmMzItxsk7MfjY" } }` → POST `…/getOrAssignTodaysQuestion` with `{ data: { localDate: "2026-07-13", childId: "4IUe7INmMzItxsk7MfjY" } }` → Admin get() of child vs root `wellState/current`
- **scope:** uid1=`8rvdWY8Z4OZUwdQTrUIytgfwJyk2`, childId=`4IUe7INmMzItxsk7MfjY` only; no uid2; no other callables
- **result:** both HTTP **404**. `firebase functions:list --json`: `ensureWellState` and `getOrAssignTodaysQuestion` are **state=FAILED** (not ACTIVE); `createChildProfile` is ACTIVE. No Well writes: child `wellState/current` absent, root `wellState/current` absent. Path confirmation via child dual-read **not achieved**. Did not deploy or Admin-bypass (would expand scope).

### 2026-07-14T03:44Z | Well callable recovery deploy

- **command:** `cd functions && npm run build && cd .. && npx firebase-tools deploy --only functions:ensureWellState,functions:getOrAssignTodaysQuestion --project into-the-pond`
- **scope:** `ensureWellState` and `getOrAssignTodaysQuestion` in asia-east2 only
- **result:** both update operations succeeded at 256MiB. Firebase CLI could not set the Artifact Registry cleanup policy; no `--force` was used.

### 2026-07-14T03:53Z | Well callable public-invoker correction

- **command:** `cd functions && npm run build && cd .. && npx firebase-tools deploy --only functions:ensureWellState,functions:getOrAssignTodaysQuestion --project into-the-pond`
- **scope:** same two asia-east2 callables only
- **result:** added `invoker: "public"` only because both handlers require `request.auth` and use its UID. Both update operations succeeded at 256MiB. The cleanup-policy warning recurred; no `--force` was used.

### 2026-07-14T04:00Z | uid1 Well child-path probe

- **command:** `node --import tsx` (inline sanitized probe): custom-token auth for uid1 → POST `ensureWellState` with the explicit childId → stop on non-2xx → otherwise POST `getOrAssignTodaysQuestion` and read child/root Well paths
- **scope:** uid1=`8rvdWY8Z4OZUwdQTrUIytgfwJyk2`, childId=`4IUe7INmMzItxsk7MfjY` only; no uid2 and no unrelated callable probes
- **result:** `ensureWellState` returned HTTP **401**. Per the live-verification guardrail, the probe stopped before `getOrAssignTodaysQuestion`; no child/root Well state was read or written in this retry, and child-path confirmation remains incomplete. No Admin-write fallback was used.

### 2026-07-14T04:05Z | Flag A path spot-check (read-only; allowlist UI waiting on device)

- **command:** Admin `get()` only for uid1 + uid2 + `featureFlags/{childMigrationDualRead,createChildProfileUi}`
- **scope:** exactly uid1=`8rvdWY8Z4OZUwdQTrUIytgfwJyk2`, uid2=`hIy34QTkVfcLNcdIQ1DW40Ws7to1`; no deploy, no migration, no callables
- **result (masked):**
  - flags: both still `rolloutState=allowlist`, allowlist length 2, both UIDs present
  - **uid1 narrative:** PASS — `activeChildId` set; child doc exists; child has DOB; archetype absent; day1 narrative not completed on child
  - **uid1 header:** PASS — `childrenSummary` count 1 includes active child; header resolves from summary
  - **uid1 Atlas:** PASS path wiring — expected `users/{uid}/children/{childId}/childAtlas`; sample count 0 (empty, not fabricated)
  - **uid2:** NOT SEALED — `activeChildId` null, child count 0, summary count 0. Flag B Create Child Profile UI + curtain QA remain **user on-device** before uid2 Flag A paths can be confirmed.

### 2026-07-14T04:10Z | Security refinement plan verification (children migration audit)

- **command:** `bash scripts/migration-audit-step0-guard.sh` (expect fail); `npm run test:migration-audit`; fixture planner dry-run; export + rollback scripts without CR flags
- **scope:** local tooling only — no prod export, no rollback generation, no commit migration
- **result:** plan already implemented and verified:
  - Step 0 fail-closed (exit 1 without TTY/`CONFIRM_MIGRATION_AUDIT`; also exit 1 with env but no TTY)
  - Steps 1–2 discrete shell wrappers exist; console-only dry-run by default
  - CR gate blocks export + rollback without `--change-request-id` + `--approved-by`
  - `test:migration-audit` **7/7 pass**; fixture planner scanned 2 / would-migrate 1 / no durable file

### 2026-07-14T04:15Z | Multi-child Create Child Profile plan — gap close (no flag flip)

- **command:** `npm run test:child-profile` (19/19); dualRead RN-import fix; add `docs/create-child-profile-curtain-qa.md`; TECH_DEBT compatibility-window checklist
- **scope:** codebase only — no allowlist expand, no `rolloutState` change, no legacy writer retirement, no full migration
- **result:** Plan todos verified present (tier helpers, callable, rules, migration/dual-read, Well/Atlas `childId`, sealed UI + Gate + switcher, deletion backup, analytics/Sentry). Narrative **writes stay on root** until a server child sync exists (children docs deny client update). Curtain QA remains manual for the account owner. Flags remain `allowlist`.

---

## Explicitly still blocked (do not self-authorize)

- Full prod users export / rollback-plan generation without CR flags (`docs/rollback/children-migration-audit.md`)
- Expanding allowlist beyond uid1+uid2
- Setting `rolloutState` beyond `allowlist`
- Retiring legacy root writers
- Full-scale migration (~100 users)
- Redeploy of FAILED Well callables (needs explicit go-ahead)
- Completing Flag A for uid2 / curtain QA without on-device seal results from the account owner
