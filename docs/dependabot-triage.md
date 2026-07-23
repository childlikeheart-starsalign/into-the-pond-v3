# Dependabot / npm audit triage (2026-07-06)

GitHub reported **38 Dependabot alerts** on push to `main`. Local `npm audit --audit-level=critical` exits **0** (no npm-classified critical in current lockfile). Triage by **runtime exposure**, not alert count alone.

## Quick commands

```bash
npm audit
npm audit --audit-level=high
npm ls @xmldom/xmldom
```

Safe fixes (review lockfile diff before merging):

```bash
npm audit fix          # semver-compatible only
# npm audit fix --force  # breaking — avoid without testing Expo SDK 54
```

## Findings (local audit snapshot)

| Package                                           | Severity     | Exposure                              | Recommendation                               |
| ------------------------------------------------- | ------------ | ------------------------------------- | -------------------------------------------- |
| `@babel/core`                                     | low/advisory | Dev/build only                        | `npm audit fix` when convenient              |
| `@xmldom/xmldom` (via `eas-cli` / `expo-updates`) | high         | Transitive tooling/plist; not app API | See **GHSA-f6ww-3ggp-fr8h** below — accepted |
| `@opentelemetry/core` (via `firebase-tools`)      | moderate     | CLI deploy tooling only               | Defer or pin firebase-tools separately       |
| `ajv`                                             | moderate     | Transitive dev tooling                | Defer unless fix is non-breaking             |

## GHSA-f6ww-3ggp-fr8h / CVE-2026-41674 (`@xmldom/xmldom`)

**Advisory:** XML injection via unvalidated `DocumentType` serialization (`publicId` / `systemId` / `internalSubset` emitted verbatim).  
**Patched package versions:** `0.8.13` (0.8 line), `0.9.10` (0.9 line).  
**Important:** Protection is **opt-in** — callers must pass `{ requireWellFormed: true }` to `XMLSerializer.serializeToString`. Default serialization remains verbatim. The **parse** path is safe (SAX enforces PubidLiteral / SystemLiteral).

### Reachability in this repo

| Consumer                       | How xmldom is used                                                       | App-reachable?                      |
| ------------------------------ | ------------------------------------------------------------------------ | ----------------------------------- |
| App / Functions source         | No imports of `@xmldom/xmldom`, `createDocumentType`, or `XMLSerializer` | No                                  |
| `expo-updates` → `@expo/plist` | `DOMParser.parseFromString` only                                         | No (parse path = safe per advisory) |
| `eas-cli` (devDependency)      | Transitive via `@expo/plist` / `plist` / `xcode`                         | No (CLI/dev machine only)           |
| `functions/`                   | Not in tree (`npm ls` empty)                                             | No                                  |

Exploit path requires attacker-controlled DOCTYPE fields via `createDocumentType` (or property write) **then** default `serializeToString`. That path is not used by product code.

### Decision

**Accepted** for preview/production app risk. Not a launch blocker.

- Do **not** add further `package.json` `overrides` **solely** for this GHSA expecting automatic hardening — `requireWellFormed: true` is not used by `@expo/plist` / `eas-cli` today, so overrides alone are a false sense of security for the serialize-injection class.
- An existing root override pins `@xmldom/xmldom` to **`0.9.10`** (see `package.json` `overrides`). Keep it for scanner hygiene / patched baseline; do not treat it as a complete fix for this GHSA.
- Re-check when Dependabot opens PRs for `eas-cli` / `expo-updates` / `@expo/plist` that pass `requireWellFormed: true` or drop vulnerable call sites.

### Installed tree (verified 2026-07-23)

```text
npm ls @xmldom/xmldom
# eas-cli@21.0.1 → … → @xmldom/xmldom@0.9.10
# expo-updates@29.0.18 → @expo/plist → @xmldom/xmldom@0.9.10
# functions/: (empty)
```

After any future Expo/EAS bump that claims xmldom hardening, re-run `npm ls @xmldom/xmldom` and confirm no remaining `<0.8.13` (0.8 line) or `<0.9.10` (0.9 line) in the app-relevant tree if scanners still flag.

### Residual risk (accepted)

A developer machine running `eas-cli` / prebuild that constructed DocumentTypes from **untrusted** strings and serialized them could still hit the default serialize path. That is not an end-user app attack surface for this product.

## Expo SDK majors (policy)

**Do not merge Dependabot PRs that bump `expo` across SDK majors** (e.g. 54 → 57).

- App stays on **Expo SDK 54** until a dedicated migration PR (RN + all `expo-*` + prebuild + native modules).
- [`.github/dependabot.yml`](../.github/dependabot.yml) **ignores** semver-major updates for `expo`, `react-native`, and `react`.
- Example: [PR #28](https://github.com/childlikeheart-starsalign/into-the-pond-v3/pull/28) (`chore(deps): bump postcss and expo`) failed CI at `npm ci` with `Missing: @expo/metro-runtime@57.0.7 from lock file`. Auth deep link and Firestore rules jobs never ran tests — lockfile/`npm ci` breakage, not test regressions. Close such PRs; do not “fix the lockfile” to land an incomplete SDK jump.

Transitive security bumps (e.g. `postcss` patch/minor) that **do not** pull an Expo major remain eligible for review.

## GitHub Dependabot workflow

1. Open [Dependabot alerts](https://github.com/childlikeheart-starsalign/into-the-pond-v3/security/dependabot)
2. Sort by **severity** — address any **critical** with a clear path to production code first
3. Open Dependabot PRs for patch/minor updates to direct dependencies
4. For `eas-cli` / `firebase-tools` transitive issues: accept risk for preview QA or upgrade majors in a dedicated PR with `npm run test:auth-links` + `npm run test:firestore-rules`
5. If Dependabot opens an **Expo / RN / React major**, close it (see policy above) unless it is part of an intentional SDK migration

## CI verification after dependency changes

```bash
npm run test:auth-links
npm run test:firestore-rules
npm run verify:no-firebase-secrets
```

Do **not** block preview on dev-only transitive alerts unless GitHub marks a critical path into the shipped app bundle.
