# Console.warn Triage Report

**Total sites:** 32 across 16 files  
**Native console:** `transform-remove-console` removes warn AST nodes at compile time in production — calls never run; no JS or native device console output. Sentry is the only production diagnosis path.

## Tier counts (approved for bridging)

| Tier   | Count | Action                                           |
| ------ | ----- | ------------------------------------------------ |
| Tier 1 | 16    | Bridge to Sentry                                 |
| Tier 2 | 8     | No change (already covered or dev-only)          |
| Tier 3 | 8     | No change (degraded UX / needs product decision) |

---

## App shell

| File:Line         | Trigger                                                    | User impact if silent                                | Sentry nearby? | Tier                   |
| ----------------- | ---------------------------------------------------------- | ---------------------------------------------------- | -------------- | ---------------------- |
| `_layout.tsx:99`  | `assertRequiredEnv()` returns missing keys                 | Mis-built app may run with broken Firebase/RC config | No             | **3** — rare mis-build |
| `_layout.tsx:124` | Firestore `getDoc(users/{uid})` throws during auth hydrate | Narrative onboarding state not restored              | No             | **1**                  |
| `_layout.tsx:157` | `ensureUserProfileDocument` rejects                        | User doc may never be created                        | No             | **1**                  |

## RevenueCat

| File:Line                 | Trigger                  | User impact if silent              | Sentry nearby?           | Tier  |
| ------------------------- | ------------------------ | ---------------------------------- | ------------------------ | ----- |
| `revenuecat/client.ts:39` | Missing RC API key       | Purchases/entitlements unavailable | Yes — `captureMessage`   | **2** |
| `revenuecat/client.ts:64` | `logIn`/`logOut` throws  | Identity sync failure              | Yes — `captureException` | **2** |
| `revenuecat/client.ts:73` | `getCustomerInfo` throws | Subscription state stale           | Yes — `captureException` | **2** |
| `revenuecat/client.ts:84` | `getOfferings` throws    | Paywall offerings unavailable      | Yes — `captureException` | **2** |

## Fishing / cast

| File:Line                  | Trigger                               | User impact if silent                   | Sentry nearby?                | Tier  |
| -------------------------- | ------------------------------------- | --------------------------------------- | ----------------------------- | ----- |
| `fishingServerCast.ts:225` | `__DEV__` + functions unavailable     | Dev local cast fallback only            | Breadcrumbs on reconcile only | **2** |
| `sanctuary.tsx:103`        | `checkCastStatus` catch               | Cast timer/claim may stall undiagnosed  | No                            | **1** |
| `sanctuary.tsx:131`        | `reload()` cultivation on focus fails | Bloom arrival may not show              | No                            | **3** |
| `sanctuary.tsx:185`        | `startServerCast` throws              | User sees cast error, no backend signal | No                            | **1** |
| `FishingModal.tsx:158`     | `onCast` throws                       | Modal cast flow fails silently in logs  | No                            | **1** |

## Well

| File:Line                | Trigger                                   | User impact if silent         | Sentry nearby? | Tier  |
| ------------------------ | ----------------------------------------- | ----------------------------- | -------------- | ----- |
| `useWellQuestion.ts:116` | Load question pipeline throws (prod path) | Well screen shows error state | No             | **1** |
| `useWellQuestion.ts:119` | `__DEV__` functions unavailable           | Dev preview fallback          | No             | **2** |
| `useWellQuestion.ts:173` | `rerollWellQuestion` throws               | Reroll silently fails         | No             | **1** |
| `useWellQuestion.ts:239` | `submitWellReflection` throws             | Reflection may not persist    | No             | **1** |

## Diary

| File:Line                  | Trigger                                        | User impact if silent                            | Sentry nearby? | Tier  |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------ | -------------- | ----- |
| `DiaryEntryScreen.tsx:462` | Direct lesson `getDoc` throws                  | Falls back to local prompts                      | No             | **3** |
| `DiaryEntryScreen.tsx:484` | Lesson query throws                            | Falls back to local prompts                      | No             | **3** |
| `DiaryEntryScreen.tsx:603` | Ritual `completeLessonReflection` throws       | Progress may not sync; user still navigates away | No             | **1** |
| `DiaryEntryScreen.tsx:641` | `addReflectionBloom` throws                    | Sanctuary bloom not recorded                     | No             | **1** |
| `DiaryEntryScreen.tsx:645` | Classic save `completeLessonReflection` throws | Reflection may not sync                          | No             | **1** |
| `DiaryRitualFlow.tsx:471`  | `onComplete` throws                            | Ritual completion fails                          | No             | **1** |

## DB / offline cache

| File:Line        | Trigger                        | User impact if silent       | Sentry nearby? | Tier  |
| ---------------- | ------------------------------ | --------------------------- | -------------- | ----- |
| `db/sync.ts:36`  | WatermelonDB cache task throws | Offline data stale/wrong    | No             | **1** |
| `db/index.ts:20` | SQLite adapter setup error     | Local DB broken until reset | No             | **1** |
| `db/index.ts:23` | `unsafeResetDatabase` fails    | Cache unrecoverable         | No             | **1** |

## Export

| File:Line                  | Trigger             | User impact if silent    | Sentry nearby? | Tier             |
| -------------------------- | ------------------- | ------------------------ | -------------- | ---------------- |
| `ExportBottomSheet.tsx:58` | Story capture fails | Falls back to text share | No             | **3**            |
| `ExportBottomSheet.tsx:75` | Share fails         | Text fallback attempted  | No             | **3**            |
| `ExportBottomSheet.tsx:80` | Text fallback fails | Export UX broken         | No             | **3**            |
| `exportHelpers.ts:177`     | PDF rename fails    | Uses original filename   | No             | **2** — graceful |
| `exportHelpers.ts:213`     | PDF export fails    | Text share fallback      | No             | **2** — graceful |
| `exportHelpers.ts:231`     | Instagram URL fails | Other paths remain       | No             | **2** — graceful |
| `exportHelpers.ts:249`     | Facebook URL fails  | Other paths remain       | No             | **2** — graceful |

## Other

| File:Line                     | Trigger                         | User impact if silent         | Sentry nearby? | Tier  |
| ----------------------------- | ------------------------------- | ----------------------------- | -------------- | ----- |
| `useChildAtlas.ts:99`         | Firestore snapshot error (prod) | User sees atlas error         | No             | **1** |
| `VideoPlayer.tsx:159`         | Lesson progress save fails      | Progress may be lost          | No             | **3** |
| `VideoPlayer.tsx:164`         | Progress save pending           | Informational; flow continues | No             | **2** |
| `LessonCompleteScreen.tsx:49` | Navigation reset fallback       | User still lands somewhere    | No             | **3** |

---

## Bridged in Task 4 (16 sites)

All Tier 1 sites above received adjacent `Sentry.captureException` with `area` tags: `app_shell`, `fishing`, `well`, `diary`, `db_sync`, `child_atlas`.

## Verification (Task 5)

- **Typecheck:** `npx tsc --noEmit` — no errors in modified files; pre-existing failures remain in `docs/handoff/` reference copies and unrelated `classroomAssets` / `craftBenchLayout` types.
- **Imports:** Sentry added only to the 8 files modified for bridging (`_layout` already had it).
- **Spot-check:** With `EXPO_PUBLIC_SENTRY_DSN` set in dev, trigger any of: failed cast (`area: fishing`), Well load error (`area: well`), or Child Atlas snapshot denial — confirm events appear in Sentry with matching `area` / `flow` tags.
