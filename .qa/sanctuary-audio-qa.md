# Sanctuary theme + closing journal audio QA

**Date:** 2026-07-21  
**Automated:** `npm run verify:sanctuary-audio`

## Assets

| File                                                         | Trigger                                                                 | Loop                         | Volume                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------------------------- | ------------------------- |
| `assets/audio/sanctuary-theme.mp3`                           | First curtain-lift reveal only (`CurtainLiftContext.startReveal`)       | Yes (until reveal completes) | 0.25                      |
| `assets/audio/closing-the-journal.mp3`                       | Diary ritual closure or classic save                                    | No                           | 0.3                       |
| `assets/audio/evening-pond.mp3`                              | Continuous pond session (`EveningPondSessionController` in root layout) | Yes                          | 0.18 (0.12 diary closure) |
| `assets/audio/diary-ritual-middle-steps.mp3`                 | Diary ritual middle steps (`useDiaryRitualMiddleAmbientSound`)          | Yes                          | 0.15 (450 ms fade in/out) |
| `assets/audio/fishing/pond-waiting-ambient.mp3`              | Active cast waiting (hard-stops evening-pond)                           | Yes                          | 0.15                      |
| `assets/audio/journal/candle-ambient.mp3`                    | Field Journal reader (layers; session bed continues)                    | Yes                          | 0.15                      |
| `assets/audio/gate-unlock.mp4`                               | Cold gate key tap (`playGateUnlock`)                                    | No                           | 0.85                      |
| `assets/audio/evening-pond.mp3` (recycled)                   | Signed-out gate idle (`useGateAmbientSound`)                            | Yes                          | 0.07                      |
| `assets/audio/journal/open-book.mp3` (recycled)              | Login/signup success (`playAuthWelcome`)                                | No                           | 0.25                      |
| `assets/audio/fishing/claim-miss-wonder-gate.mp3` (recycled) | Auth form errors (`playAuthSoftDeny`)                                   | No                           | 0.20                      |
| `assets/audio/closing-the-journal.mp3` (recycled)            | Child profile seal (`playProfilePlanted`)                               | No                           | 0.30                      |
| `assets/audio/ui/click-paper-{1,2,3}.mp3`                    | Visual-only confirmations (`playPaperClick` round-robin)                | No                           | 0.18                      |

**Note:** `sanctuary-theme.mp3` is ~6.5 MB on disk — trim/re-encode to 30–45 s seamless loop before production if bundle size matters.

**Note:** `evening-pond.mp3` is ~3.8 MB — trim to 90–120 s seamless loop if bundle size matters.

## Continuous pond session

One shared evening-pond bed plays across signed-in main-app routes (tabs + pond modals). Tab/modal switches **do not** restart the loop.

| Event                          | Behavior                                                          |
| ------------------------------ | ----------------------------------------------------------------- |
| Tab / modal switch             | Keep playing — same position                                      |
| Cast waiting                   | Hard stop evening-pond; `pond-waiting-ambient` only               |
| Claim ceremony / fishing modal | Pause (resume same position)                                      |
| Diary ritual middle steps      | Evening-pond pauses; `diary-ritual-middle-steps` fades in at 0.15 |
| Diary arrival / closure        | Evening-pond volume 0.18 / 0.12                                   |
| Auth / onboarding              | Fade out (~400 ms) then stop                                      |
| Field Journal reader           | Candle layers; evening-pond uninterrupted                         |

Suppressions via `useEveningPondSuppression` in Sanctuary + DiaryRitualFlow; route whitelist in `eveningPondSessionRoutes.ts`.

## Automated checks

```bash
npm run verify:sanctuary-audio
```

## Manual device QA

### First-ever sanctuary theme

1. Clear app data or delete `@itp/sanctuary-first-reveal-theme-played-v1:<uid>` from AsyncStorage.
2. Sign in through arrival video → curtain lift → Sanctuary reveal.
3. **Expect:** quiet music-box loop during reveal; stops when reveal completes.
4. Sign out and sign in again (or relaunch after flag set).
5. **Expect:** no theme on second reveal.

**Reduce Motion ON:** theme skipped (matches instant reveal).

### Closing the journal

1. Open a lesson with ritual flow → complete to closure → tap **Plant this noticing**.
2. **Expect:** 8–12 s solo piano/guitar wind-down once; no loop.
3. Repeat with a lesson using classic prompt save (non-ritual).
4. **Expect:** same sound after successful save.

### Evening pond ritual ambient

1. Open a lesson with ritual flow (self-check).
2. **Arrival:** subtle crickets/water loop at vol 0.18 (session bed).
3. Tap through to first middle step — evening-pond pauses; **middle-steps bed fades in** at vol 0.15 (~450 ms).
4. Advance through 2+ middle prompts — middle bed **continues without restarting**.
5. **Closure:** middle bed fades out; evening-pond resumes quieter (0.12).
6. Tap **Plant this noticing** — `closing-the-journal` one-shot plays; session stops on leaving diary route.

### Continuous session (tab switching)

1. Open Sanctuary — evening-pond starts.
2. Rapidly switch Classroom → Net → Store → Gate → Sanctuary.
3. **Expect:** no audible loop restart at each switch; bed feels continuous.
4. Open Craft or Well modal — bed continues (no restart on open/close).
5. Sign out or navigate to auth — bed fades out.

### Cast handoff

1. From Sanctuary idle, tap **Cast** and accept.
2. **Expect:** evening-pond stops; `pond-waiting-ambient` plays.
3. After claim or cast ends — evening-pond resumes (may mid-loop, not from 0).

### Claim / fishing modal pause

1. Trigger claim ceremony or open fishing modal.
2. **Expect:** evening-pond pauses briefly.
3. Dismiss — resumes from same position.

### Field Journal layering

1. Net tab → open journal reader.
2. **Expect:** evening-pond + candle both audible; no restart when opening reader.

### Cold gate (signed out)

1. Launch app signed out on gate (`/`).
2. **Expect:** very quiet evening-pond loop at vol 0.07 (`useGateAmbientSound`).
3. Tap gate key.
4. **Expect:** unlock one-shot (`gate-unlock.mp4`); ambient fades out; navigate to signup.

### Auth welcome / soft deny

1. Sign up with invalid email → soft deny SFX (`claim-miss-wonder-gate` recycle at 0.20).
2. Complete valid signup → welcome SFX (`open-book` recycle at 0.25).
3. Sign in with wrong password → soft deny; valid sign-in → welcome before arrival video.

### Profile seal

1. Complete create-child-profile flow → tap Seal.
2. **Expect:** `closing-the-journal` recycle at 0.30 on successful seal.

### Folio tab continuity

1. Sign in → open Folio tab.
2. **Expect:** evening-pond session continues (same bed as Sanctuary); no restart from tab switch.

### Paper click confirmations

1. Diary ritual — tap single-select options rapidly (3+ taps).
2. **Expect:** quiet paper clicks at vol ~0.18; variants rotate (not identical every tap).
3. Sanctuary tab bar — switch to another tab.
4. **Expect:** one paper click per tab change (no click when re-tapping active tab).
5. Diary closure — tap **Plant this noticing**.
6. **Expect:** `closing-the-journal` only; no paper click stacked on closure.

### Nav bar persistence (Sanctuary ↔ Journal)

1. From Sanctuary, tap Journal (Net tab) repeatedly (5+ times).
2. **Expect:** parchment strip and icons stay stable — no flash or reload on each switch.
3. Switch back to Sanctuary — same stability.
4. First sign-in curtain lift — tab bar fades in with sanctuary tableau.

## Results

| Check                                | Result   | Notes                                     |
| ------------------------------------ | -------- | ----------------------------------------- |
| `npm run verify:sanctuary-audio`     | **PASS** | Assets, session controller, suppressions  |
| Continuous tab switching (device)    | Manual   | No loop restart on tab change             |
| Cast handoff (device)                | Manual   | Evening stop → fishing waiting            |
| Claim/modal pause (device)           | Manual   | Pause/resume same position                |
| Field Journal layering (device)      | Manual   | Evening + candle                          |
| Diary middle steps bed (device)      | Manual   | Fade in; no restart between prompts       |
| Evening pond ritual handoff (device) | Manual   | Middle fade out → closure 0.12            |
| Cold gate ambient + unlock (device)  | Manual   | 0.07 loop; unlock on key tap              |
| Auth welcome/deny (device)           | Manual   | Recycled open-book / wonder-gate miss     |
| Profile seal (device)                | Manual   | Recycled closing-the-journal              |
| Folio tab session (device)           | Manual   | Evening-pond continues on /folio          |
| Paper click variation (device)       | Manual   | Round-robin @ 0.18; no closure double     |
| Nav bar sanctuary/journal (device)   | Manual   | No strip/icon flicker on rapid tab switch |
