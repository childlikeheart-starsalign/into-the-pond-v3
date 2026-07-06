# Dependabot / npm audit triage (2026-07-06)

GitHub reported **38 Dependabot alerts** on push to `main`. Local `npm audit --audit-level=critical` exits **0** (no npm-classified critical in current lockfile). Triage by **runtime exposure**, not alert count alone.

## Quick commands

```bash
npm audit
npm audit --audit-level=high
```

Safe fixes (review lockfile diff before merging):

```bash
npm audit fix          # semver-compatible only
# npm audit fix --force  # breaking — avoid without testing Expo SDK 54
```

## Findings (local audit snapshot)

| Package                                      | Severity     | Exposure                               | Recommendation                                   |
| -------------------------------------------- | ------------ | -------------------------------------- | ------------------------------------------------ |
| `@babel/core`                                | low/advisory | Dev/build only                         | `npm audit fix` when convenient                  |
| `@xmldom/xmldom` (via `eas-cli`)             | high         | EAS CLI dev tool only, not app runtime | Track eas-cli upgrade; not a production app vuln |
| `@opentelemetry/core` (via `firebase-tools`) | moderate     | CLI deploy tooling only                | Defer or pin firebase-tools separately           |
| `ajv`                                        | moderate     | Transitive dev tooling                 | Defer unless fix is non-breaking                 |

## GitHub Dependabot workflow

1. Open [Dependabot alerts](https://github.com/childlikeheart-starsalign/into-the-pond-v3/security/dependabot)
2. Sort by **severity** — address any **critical** with a clear path to production code first
3. Open Dependabot PRs for patch/minor updates to direct dependencies
4. For `eas-cli` / `firebase-tools` transitive issues: accept risk for preview QA or upgrade majors in a dedicated PR with `npm run test:auth-links` + `npm run test:firestore-rules`

## CI verification after dependency changes

```bash
npm run test:auth-links
npm run test:firestore-rules
npm run verify:no-firebase-secrets
```

Do **not** block preview on dev-only transitive alerts unless GitHub marks a critical path into the shipped app bundle.
