# Live sanctuary claim QA

**Date:** 2026-07-21 (updated for always-on ring + cold launch)  
**Goal:** End-to-end cast → claim → cast-finish ceremony on a dev client without waiting 2 hours.

## Prerequisites

- Dev client (`npx expo start --dev-client`) signed in as smoke UID (default `SMOKE_UID` in `functions/.env.local`).
- Firebase Admin credentials (`FIREBASE_SERVICE_ACCOUNT_PATH`) and `EXPO_PUBLIC_FIREBASE_API_KEY`.
- Ring ceremony is **always on** for live sanctuary claims (no `catalogRarityRingUi` allowlist required).

## Automated backend path (no UI)

```bash
npm run smoke:claim-cast
```

Expected: `SMOKE PASS: claimCast outcome = …`

This runs `createCast` → admin-backdates `activeCast.readyTimestamp` → `claimCast` → asserts `lastClaimedCastId`.

## Manual UI path

### 1. Cast from sanctuary

1. Open Sanctuary tab → Cast → confirm rod/bait → Cast.
2. Note `castId` from Metro log or Firestore `users/{uid}.activeCast.castId`.

### 2. Backdate ready timestamp (admin)

From repo root with `functions/.env.local` loaded:

```bash
node --input-type=module -e "
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config({ path: 'functions/.env.local' });
const sa = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const uid = process.env.SMOKE_UID || '8rvdWY8Z4OZUwdQTrUIytgfwJyk2';
const past = admin.firestore.Timestamp.fromMillis(Date.now() - 60_000);
await admin.firestore().collection('users').doc(uid).update({ 'activeCast.readyTimestamp': past });
console.log('backdated activeCast for', uid);
"
```

### 3. Claim in app

1. Foreground sanctuary (or any tabs screen — claim engine is tabs-shell mounted).
2. `useActiveCast` auto-claims when `readyAt <= now`.
3. Verify claim modal on Sanctuary:
   - **CatalogRarityRing** (~2s) → then field-note card → Continue.
   - Miss outcomes also show the ring (`completedClaimCastId` preserved).
4. Tap Continue — modal closes; no second cast blocked incorrectly.

### 4. Cold launch / arrival paths

| Path                          | Steps                                                | Expect                                                                  |
| ----------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| **A — Sanctuary cold launch** | Kill app → reopen on Sanctuary with ready cast       | Auto-claim → ring → field-note → Continue                               |
| **B — Net first**             | Open on Net → wait for claim → navigate to Sanctuary | Background claim; ring on Sanctuary arrival                             |
| **C — Curtain**               | Sign-in arrival with ready cast                      | Curtain finishes **before** modal/ring; no claim SFX under chime/reveal |
| **D — Miss**                  | Force miss outcome                                   | Ring still plays (castId preserved)                                     |
| **E — Same species twice**    | Two catches of species X in one session              | Full ring both times                                                    |
| **F — Once**                  | Curtain defer then present                           | One claim SFX + one `fishing_claim_resolved`                            |
| **G — Timing**                | Late auth / no flag hydrate                          | Claim still succeeds; ring always on                                    |

## Fixture shortcuts (no Firestore)

- Full ceremony: `intothepond://cast-finish-fixture?preset=catch-common-alias`
- Skip ring (dev-only): `intothepond://cast-finish-fixture?preset=catch-common-alias&ring=0`

## Results log

**Ship gate (Gaps 1–2):** [fishing-loop-ship-checklist.md](./fishing-loop-ship-checklist.md) — deploy `createCast`/`cancelCast`, native rebuild for notifications, cancel + ready-notif device QA.

| Step                                           | Result    | Notes                                                                                                        |
| ---------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run smoke:claim-cast`                     | **PASS**  | `SMOKE PASS: claimCast outcome = catch` (2026-07-21 QA run) — `claim-catch.mp3` path                         |
| `node functions/scripts/smoke-create-cast.mjs` | **PASS**  | `readyAt ≈ now + 2h` (regression)                                                                            |
| `applyFishingClaim` integration tests          | **PASS**  | 14/14 local                                                                                                  |
| `npm run test:fishing`                         | **PASS**  | Includes claim SFX routing + presentation-scoped ring helpers                                                |
| `npm run verify:fishing-ceremony-qa`           | **PASS**  | Assets, sanctuary wiring (always-on ring, curtain gate), PostHog contracts                                   |
| UI claim (always-on ring)                      | **READY** | Checklist §3–4; `CatalogRarityRing` → field-note; flag seeded `all` (UI ungated). Device sign-off remaining. |
| Audio cast + ambient                           | **PASS**  | `cast-splash.mp3` + `pond-waiting-ambient.mp3` on cast accept; `stopAmbient()` on claim resolve              |
| Audio claim (miss/catch)                       | **PASS**  | Smoke catch → `claim-catch.mp3`; miss → `claim-miss-chance.mp3`                                              |
| PostHog                                        | **READY** | Always-on contract: 3 events with `ringUiEnabled: true` — see `docs/posthog-verification.md`                 |
| `catalogRarityRingUi` seed `all`               | **DONE**  | `npx tsx scripts/seed-feature-flags.ts --flag=catalogRarityRingUi --state=all`                               |
| Gaps 1–2 ship checklist                        | **OPEN**  | [fishing-loop-ship-checklist.md](./fishing-loop-ship-checklist.md)                                           |

### Audio + PostHog verification

```bash
npm run verify:fishing-ceremony-qa
```

Filter Live events: `fishing_claim` OR `pond_ripple` OR `claim_celebration`.
