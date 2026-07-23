# Local WIP launch QA — 2026-07-21

Branch: `wip/child-profile-and-peek`  
Intent: Local dev-client QA (not EAS preview)

## Automated smoke

| Check                  | Result                                                         |
| ---------------------- | -------------------------------------------------------------- |
| `test:fishing`         | **PASS** — 50/50                                               |
| `test:firestore-rules` | **PASS** — 41/41 (emulator; requires full permissions locally) |

## Cast-finish fixture — CTA placement

Method: iOS Simulator (iPhone 17 Pro) + `intothepond://cast-finish-fixture?preset=…`, 12s post-link wait.

| Preset                  | Screenshot                            | CTA band Y | Overlap vs others         |
| ----------------------- | ------------------------------------- | ---------- | ------------------------- |
| `catch-common-alias`    | `.qa/cast-finish-common-alias.png`    | 1810px     | baseline                  |
| `catch-rare-wooden`     | `.qa/cast-finish-fixture-smoke.png`   | —          | visual PASS               |
| `catch-epic-fiberglass` | `.qa/cast-finish-epic-fiberglass.png` | 1810px     | 0px delta                 |
| `catch-long-copy`       | `.qa/cast-finish-long-copy.png`       | 1810px     | 0px delta, no extra clash |

**Verdict: PASS** — pinned CTA + `translateY: 15` consistent across presets.

## Live sanctuary path

| Check                   | Result                                                      |
| ----------------------- | ----------------------------------------------------------- |
| `smoke-create-cast.mjs` | **PASS** — `readyAt ≈ now + 2h`                             |
| Full UI claim (2h wait) | **Deferred** — fixture + backend smoke sufficient for today |

## Firestore `featureFlags`

| Document                 | `rolloutState` | Allowlist size |
| ------------------------ | -------------- | -------------- |
| `newOnboardingEnabled`   | `all`          | 0              |
| `createChildProfileUi`   | `allowlist`    | 2              |
| `catalogRarityRingUi`    | _(missing)_    | —              |
| `childMigrationDualRead` | `allowlist`    | 2              |
| `childResultPeek`        | `allowlist`    | 1              |

**Notes:**

- `newOnboardingEnabled: all` — Gate may route to `/prologue` before signup.
- `catalogRarityRingUi` doc absent; sanctuary claim modal always uses `CatalogRarityRing` on this branch.

## Secret rotation gate

| Step                                                                          | Result                                                                  |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Removed `ACCOUNT_DELETION_SECRET` from tracked `functions/.env.into-the-pond` | **Done**                                                                |
| New secret in `functions/.env.local` (gitignored)                             | **Done**                                                                |
| Production deploy (6 account-deletion callables, `asia-east2`)                | **Success**                                                             |
| Old secret in git history                                                     | **Still present** — purge history if branch was ever pushed with secret |

**Branch may be shared after confirming deploy** — old secret in history should be treated as compromised if pushed.

## Metro / dev client

- Metro: `http://localhost:8081` — status 200
- Branch confirmed: `wip/child-profile-and-peek`
