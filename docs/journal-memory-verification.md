# Journal memory wiring fix — verification report

## Task 1 — Variant verification

### Dimension audit

| Manifest key      | Large (wired before) | Chosen substitute               | Dimensions              |
| ----------------- | -------------------- | ------------------------------- | ----------------------- |
| `creatures9to11`  | `9-11_page.png`      | `spread_01_creatures_9-11.png`  | 941×1672 → **576×1024** |
| `creatures12to14` | `12-14_page.png`     | `spread_02_creatures_12-14.png` | 941×1672 → **576×1024** |
| `creatures18to20` | `18-20_page.png`     | `spread_03_creatures_18-20.png` | 941×1672 → **532×1024** |
| `creatures21to23` | `21-23_page.png`     | `spread_04_creatures_21-23.png` | 941×1672 → **532×1024** |
| `creatures24to26` | `24-26_page.png`     | `spread_05_creatures_24-26.png` | 941×1672 → **532×1024** |
| `creatures27to29` | `27-29_page.png`     | `spread_06_creatures_27-29.png` | 941×1672 → **532×1024** |

**Naming note:** files suffixed `_576x1024` are **532×1024**, not 576 wide. Non-suffixed `spread_01/02_*.png` are **576×1024** and match `FIELD_JOURNAL_REFERENCE_WIDTH/HEIGHT`.

**Rejected substitutes:** `spread_01/02_*_576x1024.png` (532×1024) — same content but narrower canvas; prefer 576×1024 `spread_01/02` for artboard alignment.

### Visual diff (6 pairs inspected)

| Pair                                                | Result                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `9-11_page.png` vs `spread_01_creatures_9-11.png`   | **Pass** — same three creatures, tabs, wood line; normalized framing                             |
| `18-20_page.png` vs `spread_03_creatures_18-20.png` | **Pass** — same Glowmoth / Blueglass / Leafling content and framing                              |
| `12-14_page.png` vs `spread_02_creatures_12-14.png` | **Pass** (same normalization pattern as spread_01)                                               |
| `21-23_page.png` vs `spread_04_creatures_21-23.png` | **Pass (asset-level review)** — same Pulse Jelly / Hushfin / Stone Nibble content and framing    |
| `24-26_page.png` vs `spread_05_creatures_24-26.png` | **Pass (asset-level review)** — same Ripple Wing / Lantern Jell / Breeze Dot content and framing |
| `27-29_page.png` vs `spread_06_creatures_27-29.png` | **Pass (asset-level review)** — same Quill Flicker / Mistgill / Dreamweaver content and framing  |

| Layout risk                       | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `532×1024` assets vs 576 artboard | **Known risk — pending on-device confirmation.** Layout hardcodes `FIELD_JOURNAL_REFERENCE_WIDTH = 576` ([fieldJournalLayout.ts](src/features/fieldJournal/fieldJournalLayout.ts)); `SkiaPageCurlOverlay` renders spreads with `fit="fill"` into a 576-scaled scene rect ([SkiaPageCurlOverlay.tsx](src/features/journal/SkiaPageCurlOverlay.tsx)), producing ~8.3% horizontal stretch on 532-wide assets. Binding/tab clip math assumes `JOURNAL_BINDING_STRIP_LEFT_PX = 467` on a 576-wide artboard. Seam misalignment possible at binding/tab edge near wood line — see on-device checklist below. |

532-wide spreads (`spread_03`–`06`) use the same normalized composition as `creatures_0-2.png` (576×1024 reference). Reader scales via `fitJournalSceneRect` — no layout constant change required.

---

## Task 2 — Manifest repoint

**File:** `src/features/fieldJournal/fieldJournalMedia.ts`

**Repointed:** 6 entries (`creatures9to11` through `creatures27to29`, excluding gaps).

**Left unchanged (asset gap — no substitute on disk):**

| Key               | File             | Size     |
| ----------------- | ---------------- | -------- |
| `creatures3to5`   | `3-5_page.png`   | 941×1672 |
| `creatures6to8`   | `6-8_page.png`   | 941×1672 |
| `creatures15to17` | `15-17_page.png` | 941×1672 |

Route missing exports to the journal asset pipeline — not an engineering wiring task.

---

## Task 3 — Chapter scope

**Chapters wired today:** Stillwater + Deep Current only (`fieldJournalChapters.ts`).

| Chapter      | Repointed | Already correct                         | Asset gap (941×1672)                            |
| ------------ | --------- | --------------------------------------- | ----------------------------------------------- |
| Stillwater   | 6         | 1 (`creatures0to2`)                     | 3 spreads                                       |
| Deep Current | 0         | 9 (`creatures44to46`…`creatures72to74`) | 5 spreads (`creatures30to32`…`creatures42to43`) |

Repo totals: 17 `*_page.png` under `assets/journal/`; 2 `*_576x1024.png` (unused suffix variants — not wired).

No Moonwater / Bloom-Touched / Echo / Charged Depths chapter wiring in code today.

---

## Task 4 — On-device measurement (manual sign-off required)

**Status:** Not done — pending measured numbers and on-device seam check from device run.

This agent environment cannot run Xcode Instruments on a physical iPhone. **Configuration change alone is not sign-off.**

### Build

```bash
npx expo run:ios --configuration Release
```

### Instruments checklist (iPhone 12 class device)

- [ ] Open Net → Stillwater → land on spread 4 (`creatures9to11`) — post-fix should load 576×1024 assets
- [ ] Record GPU texture memory for steady-state prev/current/next window
- [ ] Page through spreads 2–8; confirm memory does not grow unbounded
- [ ] Open Craft Bench, return to Net; record **total app memory** vs 120 MB budget

### Estimated decode sizes (RGBA, journal spread textures only)

| Scenario              | Per spread | 3-spread window | + open book (576×1024) |
| --------------------- | ---------- | --------------- | ---------------------- |
| Before (3×941×1672)   | ~6.0 MB    | ~18 MB          | ~20 MB                 |
| After (3×576×1024)    | ~2.25 MB   | ~6.75 MB        | ~9 MB                  |
| After (3×532×1024)    | ~2.08 MB   | ~6.25 MB        | ~8.3 MB                |
| Mixed (1×941 + 2×576) | —          | ~10.5 MB        | ~12.8 MB               |

Stillwater spreads 2–3 and 6 (`creatures3to5`, `creatures6to8`, `creatures15to17`) still decode at 941×1672 when active — expect intermediate totals when those pages are visible.

**Record measured before/after figures here after device run:**

| Metric                                 | Before    | After     |
| -------------------------------------- | --------- | --------- |
| GPU textures (3-spread window)         | _pending_ | _pending_ |
| Total app memory (Net + Craft session) | _pending_ | _pending_ |

---

## Task 5 — Conditional follow-up

**Status:** Pending Task 4 device numbers. Do **not** implement unless measurement shows risk.

**If still over 120 MB after this wiring fix:**

1. **Recommended first:** Asset pipeline exports for 8 remaining 941×1672 spreads (3 Stillwater + 5 Deep Current) — cheapest lever, no code change.
2. **Second line (separate task):** Reduce prev texture window in `SkiaPageCurlOverlay` — product/animation tradeoff; requires dedicated QA.

Do not recompress or regenerate PNGs in engineering without design approval.
