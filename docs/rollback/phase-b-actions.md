# Phase B actions log (append-only)

Standing safety guardrails (2026-07-13) apply to every entry below and all future
prod-impacting work: secrets redaction, PII minimum exposure, no CR-gate bypass,
no allowlist/scope expansion beyond the active prompt, no `--force`/`-y` unless
explicitly required, default to the more restrictive interpretation when unsure.

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

---

## Explicitly still blocked (do not self-authorize)

- Full prod users export / rollback-plan generation without CR flags (`docs/rollback/children-migration-audit.md`)
- Expanding allowlist beyond uid1+uid2
- Setting `rolloutState` beyond `allowlist`
- Retiring legacy root writers
- Full-scale migration (~100 users)
