# Deferred work manifest

**Updated:** 2026-07-23  
**Purpose:** Current deferred-work tracker — launch gates (preview vs production), child-profile / peek ship backlog, and how to resume WIP.  
**Canonical launch trackers:** [`../launch-preview-checklist.md`](../launch-preview-checklist.md) · [`../launch-production-deferred.md`](../launch-production-deferred.md) · [`../../RELEASE.md`](../../RELEASE.md) · [`../../TECH_DEBT.md`](../../TECH_DEBT.md)

---

## Repo snapshot (2026-07-23)

| Item                                     | Value                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| Active WIP branch                        | `wip/child-profile-and-peek` @ `44fab58` (local only — **not pushed**) |
| Park snapshot                            | `94dd50d` — do **not** open a PR from the whole WIP tree               |
| `origin/main`                            | `93519eb` — Phase 0 hygiene; **no** Phase 1 map / child-profile / peek |
| Peek / switcher / create-child stack     | **Implemented on WIP**; absent from `origin/main`                      |
| Firestore `featureFlags/childResultPeek` | **`rolloutState: "all"`** — enabled 2026-07-23 (product sign-off)      |

---

## Launch — required before preview / TestFlight

P3–P8 **app code is done**. Remaining work is **ops + build + device QA**, not re-implementation. Full checklist: [`../launch-preview-checklist.md`](../launch-preview-checklist.md).

| Gate                                          | Notes                                                                                                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Firebase key rotation                         | New native configs, restrict/disable old keys, EAS upload — [`../gcp-key-rotation-runbook.md`](../gcp-key-rotation-runbook.md)                                                 |
| GitHub secret scanning                        | Resolve both repos; collaborator rewrite notice                                                                                                                                |
| Dependabot critical/high                      | Triage — [`../dependabot-triage.md`](../dependabot-triage.md)                                                                                                                  |
| Apple Developer Program + EAS iOS credentials | Membership **Active** (team `77T4Z7QUTV`); Ad Hoc preview credentials configured — next gate is successful preview binary                                                      |
| Automated verify + CI green on `main`         | See checklist Automated section / `RELEASE.md`                                                                                                                                 |
| EAS preview binary + device QA                | Auth deep links, IAP sandbox, PostHog, deletion, cold start — [`../launch-device-qa.md`](../launch-device-qa.md); responsive P0 — [`../responsive-qa.md`](../responsive-qa.md) |

### Explicitly **not** required for preview

- Landing peek/child-profile code on `origin/main` (flag is already `all` in Firestore; UI ships with WIP)
- iOS Privacy Manifest Phase 2
- Hosted delete-account web URL
- Google Sign-In console polish
- Auth PNG microcopy (designer)

---

## Launch — required before production App Store

Do **not** block TestFlight on these. After preview sign-off: [`../launch-production-deferred.md`](../launch-production-deferred.md).

| Item                                                                          | Reference                                                           |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| iOS Privacy Manifest Phase 2                                                  | [`TECH_DEBT.md`](../../TECH_DEBT.md) → Privacy Manifest             |
| Host delete-account at `https://intothepond.app/delete-account` + store paste | [`launch-production-deferred.md`](../launch-production-deferred.md) |
| `eas:build:production` + full [`RELEASE.md`](../../RELEASE.md) sign-off       | Store metadata, encryption, prod analytics                          |
| Google Sign-In console finish                                                 | SHA-1 / OAuth / device retest — `TECH_DEBT.md`                      |
| Auth PNG microcopy                                                            | Designer pass — `TECH_DEBT.md`                                      |

---

## Child profile / peek — current status

**Not launch-blocking for merge to `main`.** Firestore `childResultPeek` is **`all`** (enabled 2026-07-23 after product sign-off). Clients only see peek after session flag hydrate (force-quit / reopen).

### Done on WIP (`wip/child-profile-and-peek`)

| Area                                                                                | Status                                                |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `childResultPeek` flag name + client getters + `_layout` hydrate                    | Done                                                  |
| Firestore seed → `rolloutState: "all"`                                              | Done (2026-07-23)                                     |
| `ChildSwitcherModal` phases (`switcher` / `peek` / `unwritten` / QC / DC)           | Done                                                  |
| Map in peek plate via `ArchetypeResultFlipCard` → card front → `ArchetypeResultMap` | Done                                                  |
| Axes / trail via `resolveFlipCardMapState` + `axesFromDisplayArchetype`             | Done (see `shared/childProfile/archetypeCaptionBank`) |
| `isChildRowDisabled` + unit tests                                                   | Done                                                  |
| Switcher baseline (`useActiveChild`, sanctuary entry)                               | Done                                                  |
| Create-child / prologue / limit routes + callables                                  | Done on WIP                                           |

### Not on `origin/main`

- Phase 1 `ArchetypeResultMap` (and related map hygiene)
- Entire child-profile + peek surface above

### Still to finish before peek code lands on `main`

1. Land Phase 1 (`ArchetypeResultMap`) on `main`.
2. Cut a **surgical** branch from updated `main` — do **not** PR the whole WIP commit.
3. Add npm script `test:child-result-peek` and move `isChildRowDisabled.test.ts` out of `test:archetype-map` in `package.json`.
4. Optional regression: flag-off parity doc still useful if rolling back — [`../../scripts/manual-qa-child-result-peek-flag-off.md`](../../scripts/manual-qa-child-result-peek-flag-off.md).

### Obsolete (do not track)

- Renaming to `resolvePeekMapAxesFromDisplayName` — covered by `axesFromDisplayArchetype` / `resolveFlipCardMapState`.
- Allowlisting `ChildSwitcherModal` for a direct map import — modal does not import the map; card front is already allowlisted; `verify-no-map-import-in-switcher` passes.
- Suggested axis tables in older manifests — source of truth is code (`axesFromDisplayArchetype`), not a copied corner table.
- “Keep Firestore flag off until intentional enable” — superseded by enable to `all` on 2026-07-23.

### Checklist before opening a peek PR

- [ ] `git pull origin main` — Phase 0 present
- [ ] Phase 1 merged — `ArchetypeResultMap` on `main`
- [ ] Surgical branch from updated `main` (not whole WIP)
- [x] `childResultPeek` Firestore = `all` (enabled 2026-07-23)
- [ ] `test:child-result-peek` script hygiene
- [ ] Separate PR to `main` — do not fold into Phase 1

---

## Post-launch / nice-to-have

From checklist Deferred + `TECH_DEBT.md` (non-exhaustive):

- Responsive P1/P2 (iPad, Android, Dynamic Type)
- `expo-image` (P7-B)
- `npm run verify` TypeScript cleanup (not CI-gated)
- SDK 54 `expo-av` → `expo-audio` / `expo-video`
- Fishing / craft audio wiring, gate spark / Skia, Firebase cost redesign before ~10k accounts

---

## Resume notes

```bash
git checkout wip/child-profile-and-peek   # tip ~44fab58; park root 94dd50d
```

**Future peek branch (surgical):**

```bash
git checkout -b phase-2-child-result-peek origin/main
# Copy or cherry-pick only peek + required switcher baseline — not the entire WIP tree
```

**Worktrees:** remove `.worktrees/phase-0` / `.worktrees/phase-1` only after Phase 0/1 are confirmed on `main`.

**Sanctuary caution:** `app/(tabs)/sanctuary.tsx` mixes switcher/peek with unrelated fishing / pond-ripple / header WIP — do not wholesale-revert when cutting the surgical PR.
