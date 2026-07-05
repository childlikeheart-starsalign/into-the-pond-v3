# Reference files — read before starting

**All source files are bundled in this folder** under `files/`. You do not need the full repo — read the copies below.

Also read `CURRENT_ENGINE_SUMMARY.md` in this same folder.

Read in order. Do not guess mechanics — the spreadsheet and probability tables must match the engine (or clearly label “target design” where the spec goes beyond today’s code).

---

## Bundled reference files (`files/`)

| Topic                                                             | Local path                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------- |
| Rod progression plan (Firestore schema, copy tone)                | `files/rod_progression_plan.md`                               |
| Rod catalog (domain IDs, tiers, elements, rod-level wonder gates) | `files/shared/sanctuary/rods/catalog.ts`                      |
| Module → rod themes                                               | `files/shared/sanctuary/progression/moduleRodMap.ts`          |
| Craft costs & timers                                              | `files/shared/sanctuary/progression/craftCosts.ts`            |
| Parts awards                                                      | `files/shared/sanctuary/progression/partsAwards.ts`           |
| Subscription craft gate                                           | `files/shared/sanctuary/progression/subscriptionCraftGate.ts` |
| Fishing permissions (element + max pool tier)                     | `files/shared/sanctuary/progression/fishingPermissions.ts`    |
| 150-creature catalog (authoritative)                              | `files/src/features/creatures/creatures150.ts`                |
| Generated server creature refs                                    | `files/functions/src/sanctuary/creatureRefs.generated.ts`     |
| Claim resolution logic (shared)                                   | `files/shared/sanctuary/fishing/encounterEngine.ts`           |
| Claim execution (server)                                          | `files/functions/src/sanctuary/claimEncounter.ts`             |
| UI rod/bait IDs                                                   | `files/src/features/fishing/fishingData.ts`                   |
| UI → domain ID mapping                                            | `files/src/features/fishing/rodIdMap.ts`                      |

---

## Engine vs target design

| File                        | Why read it                                                           |
| --------------------------- | --------------------------------------------------------------------- |
| `CURRENT_ENGINE_SUMMARY.md` | What is implemented **today** vs what Tasks 4–5 ask you to **design** |

---

## Domain ID quick reference

| Domain ID       | UI ID    | Tier  | Element  |
| --------------- | -------- | ----- | -------- |
| `basic`         | `basic`  | basic | any      |
| `rare_fire`     | `rare_1` | rare  | fire     |
| `rare_water`    | `rare_2` | rare  | water    |
| `rare_wind`     | `rare_3` | rare  | wind     |
| `rare_electric` | `rare_4` | rare  | electric |
| `rare_wildcard` | `rare_5` | rare  | any      |
| `epic_fire`     | `epic_1` | epic  | fire     |
| `epic_water`    | `epic_2` | epic  | water    |
| `epic_wind`     | `epic_3` | epic  | wind     |
| `epic_electric` | `epic_4` | epic  | electric |

**Module themes (for copy):** see `MODULE_ROD_ASSIGNMENTS` in `files/shared/sanctuary/progression/moduleRodMap.ts`.

---

## Snapshot date

These files are a **point-in-time copy** from the Into the Pond v3 codebase for your assignment. If something looks inconsistent with `CURRENT_ENGINE_SUMMARY.md`, trust the summary for “live vs target” and note assumptions in your deliverables.
