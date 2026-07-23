# Cast finish — Pure field-note: implementation plan

**Status:** Implemented (2026-07-21). Phases A–B shipped in code; rollout items below remain ops/QA.  
**Responds to:** [`cast-finish-pure-field-note-sonnet-brief.md`](cast-finish-pure-field-note-sonnet-brief.md)  
**Date context:** July 2026

---

## Pre-flight (resolved)

### 1. `poolTier` `"common"` vs ring display `"basic"`

**Not a discrepancy — two vocabularies that were never reconciled.**

| Layer                    | Values                                               | Where                                                                                                      |
| ------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Catalog / encounter enum | `common \| rare \| epic`                             | `src/data/creatures/types.ts`, `shared/sanctuary/types.ts`, all 150 creatures, `creatureRefs.generated.ts` |
| Ring display layer       | `empty \| basic \| rare \| epic`                     | `PondRippleDisplayTier` in `pondRippleCatalog.ts`                                                          |
| Bridge                   | `rarityIndicator: "common"` → display band `"basic"` | `rarityIndicatorToDisplayTier()`                                                                           |

`docs/data/creature-probabilities.json` is not stale:

- Creature `"tier": "common"` = catalog `poolTier`.
- `meta.poolCatchRates.basic` = catch rates for **`rodRequired: "basic"`** rod pool (Wooden rod), not display tier or `poolTier`.

**B2 scope (corrected):** Rename **ring-layer identifiers only**:

- `PondRippleDisplayTier`, `PondRippleCreatureTier`
- `rarityIndicatorToDisplayTier()` return value `"basic"` → `"common"`
- A11y labels, fixtures, `POND_RIPPLE_BAND_ORDER`
- Comment `common → basic display band` → align wording

**Explicitly untouched** (correctly use `"basic"` elsewhere):

- `rodRequired`, `RodType`, bait tier, `SheetCWeightProfile`, UI rod id

Smaller, cleaner diff than a catalog-wide rename.

**Before B2 ships:** Grep for `PondRippleDisplayTier` / `PondRippleCreatureTier` outside the files named in B2; confirm no missed call sites for the ring rename.

### 2. `visualMetaphor` vs JSON `description`

**Resolved — no action needed for A3 source field.**

- Catalog field: `visualMetaphor` on all 150 creatures (`Creature` interface, every pool file).
- JSON export: `description: creature.visualMetaphor` in `scripts/generate-creature-probabilities.mjs` only.
- Live code: `claimCelebrationCopy.ts` → `creatureFieldNote()` reads `visualMetaphor` via `getCreatureByTypeId()`.

Phase A is fully unblocked; A3 adds `closingLine` only — zero catalog field changes.

---

## 1. Executive summary

This is subtraction with two small additions, not a rebuild. The field-note card already exists and is close to the target copy voice. Work is:

1. **PR1 (Phase A):** Remove creature portrait and layout dependencies (A1–A7), add `closingLine` (A3).
2. **PR2 (Phase B):** Sequential ring illumination (B1) and ring display tier rename (B2) — separate, higher-risk effort behind `catalogRarityRingUi`.
3. **Phase C:** Verification of already-correct architecture, not new design.

Pre-flight items are resolved; nothing in Phase A depends on B2.

---

## 2. Architecture — ceremony state machine

```
completedClaim: null
      │ claim resolves
      ▼
Modal opens (CLAIM_THRESHOLD_SCRIM)
      │
      ▼
Phase A — ring (claimRevealReady = false)
  catalogRarityRingUi ON  → CatalogRarityRing
  catalogRarityRingUi OFF → text card only (PondRippleReveal retired)
      │ onComplete
      ▼
Phase B — text (claimRevealReady = true)
  ClaimCelebrationCard — SAME component regardless of which ring ran
  title → species → fieldNote → [divider if rewards] → rewards → closingLine → Continue
      │ Continue tapped
      ▼
clearCompletedClaim()
      │
      ▼
completedClaim: null (modal closes)
```

**Exposure note:** Phase B card is **not** gated by `catalogRarityRingUi` — that flag only selects the ring in Phase A. `ClaimCelebrationCard` renders for 100% of users once PR1 ships. PR1 is a low _diff_ risk but real _exposure_ risk; use staged EAS rollout (see §7).

---

## 3. File-by-file change list

| File                                | Before                                                                                                                       | After                                                                                                    | Risk                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `ClaimCelebrationCard.tsx`          | `creaturePlate` / `creatureFrame` / `creaturePortrait` (68%, max 200px); title→portrait→species→fieldNote→❦→rewards→Continue | Portrait removed. Order: title→species→fieldNote→[divider conditional]→rewards→closingLine→Continue      | Medium — reflow all outcomes |
| `claimCelebrationCopy.ts`           | No `closingLine`                                                                                                             | Add `closingLine: string`; three outcome variants (§4). Drop `rewardHeading` ("Observed today") per §8.3 | Low — additive + one removal |
| `sanctuary.tsx`                     | Wires `CreatureCutoutPortrait` + `resolveCreatureCutoutSource`                                                               | Unwire from claim modal only                                                                             | Low                          |
| `app/cast-finish-fixture.tsx`       | Cutout art presets, hint mentions portrait                                                                                   | Text-only presets; long-name, miss, duplicate, zero-reward                                               | Low — dev-only               |
| `creatureCutoutAssets.ts` + scripts | Used by cast-finish and Net                                                                                                  | **No change** — decouple call site only                                                                  | None                         |
| `pondRippleCatalog.ts`              | Miss→`empty`; bands settle together                                                                                          | B1 sequential timing; B2 ring display rename                                                             | Medium — flag-gated          |
| `CatalogRarityRing.tsx`             | Flourish→settle→pulse, no stagger                                                                                            | Outer→inner sequential stagger (§5)                                                                      | Medium                       |
| `fishingCastArchitecture.test.ts`   | Field-note voice, no `+` in fieldNote                                                                                        | `closingLine` assertions; no portrait props; duration invariant (B)                                      | Low                          |

---

## 4. Copy spec table

| Outcome   | title                      | speciesName   | fieldNote                                               | rewardHeading | rewardLines        | closingLine                                 |
| --------- | -------------------------- | ------------- | ------------------------------------------------------- | ------------- | ------------------ | ------------------------------------------- |
| New catch | "A visitor from the pond"  | creature name | `visualMetaphor`, ≤100 chars, via `creatureFieldNote()` | **drop**      | `(+N)` unchanged   | "A new page has settled into your journal." |
| Duplicate | "A familiar visitor"       | creature name | same source                                             | **drop**      | `(+N)` unchanged   | "Another page, well-worn and welcome."      |
| Miss      | "The pond answered gently" | `null`        | existing miss copy                                      | **drop**      | existing / omitted | "The journal waits, unhurried."             |

Three distinct closing lines (§8.7). **Approved 2026-07-21** — live in `claimCelebrationCopy.ts`.

---

## 5. Animation spec (Phase B)

| Parameter              | Value                                                  |
| ---------------------- | ------------------------------------------------------ |
| Per-band duration      | 300–450ms                                              |
| Easing                 | ease-in-out                                            |
| Direction              | outer (epic) → inner (miss/empty), always              |
| Pre-beat               | 150–200ms near-invisible disturbance before first band |
| Hold on matched result | 600–900ms                                              |
| **Total duration**     | **1.6–2.6s, fixed regardless of outcome**              |

**Hard constraint:** Total duration must not vary by outcome. Miss (innermost) must not resolve faster/slower than epic (outermost) — duration must not leak the result. Test explicitly (§6).

No bounce, scale-pop, or blur — reuse stacked-opacity halo in `WatercolorPondPlate`.

---

## 6. Test plan + manual QA

**Automated:**

- [x] `closingLine` present and non-empty for all 3 outcomes
- [x] No collection-fraction pattern (`\d+/\d+`, `%`) in celebration copy including `closingLine`
- [x] Card has zero `creaturePlate` / `CreatureCutoutPortrait` references post-refactor
- [x] **Sequence total duration identical** across forced miss/common/rare/epic fixtures (B regression guard)
- [x] Divider renders only when `rewardLines.length > 0`

**Manual QA:**

- Catch: common × rare × epic × free/wooden/fiberglass/lifetime
- Miss, duplicate, zero-reward catch
- Longest and shortest `visualMetaphor` in catalog — no clip, no awkward whitespace
- `pond-ripple-fixture` — unaffected unless B ships in same build

Run: `npm run test:fishing`

---

## 7. Rollout strategy

**PR1 (card refactor):** No feature flag. Staged release via EAS (preview → monitored → production). No flag gate once merged.

**PR2 (ring sequential + B2):** Behind existing `catalogRarityRingUi`. Confirm allowlist vs full before merge.

**PR3 (flag 100% + legacy removal):** `PondRippleReveal` already removed; flag OFF path is text-card-only. Flip `catalogRarityRingUi` to `all` after bake period.

---

## 10. Remaining rollout (2026-07-21)

- [x] Wire `catalogRarityRingUi` in `sanctuary.tsx` (ring ON/OFF)
- [x] Oscar fishing SFX in `assets/audio/fishing/` + `fishingCraftAudio.ts`
- [x] PostHog: `fishing_claim_resolved`, `pond_ripple_complete`, `claim_celebration_dismissed`
- [x] Backend smoke: `npm run smoke:claim-cast`
- [x] Ring always-on in sanctuary (`CatalogRarityRing`; `PondRippleReveal` removed). Flag doc seeded `all` for consistency; UI does not gate on `catalogRarityRingUi`.
- [x] Live sanctuary UI claim QA checklist: [`.qa/live-sanctuary-claim-qa.md`](../../.qa/live-sanctuary-claim-qa.md) (human rows remain for device sign-off)
- [x] Firestore seed: `npx tsx scripts/seed-feature-flags.ts --flag=catalogRarityRingUi --state=all`

## 8. Resolved open decisions

| #     | Decision                                                                                        |
| ----- | ----------------------------------------------------------------------------------------------- |
| 1 & 6 | **Divider:** one instance between fieldNote and rewards, **only when `rewardLines.length > 0`** |
| 2     | **Reward `(+N)`:** keep numeric — not collection-progress-as-number                             |
| 3     | **"Observed today":** drop — redundant with title + fieldNote                                   |
| 4     | **Phase scope:** A-only first (PR1 alone)                                                       |
| 5     | **Animation:** §5 concrete values; fixed total duration is hard                                 |
| 7     | **Closing line:** three outcome-specific variants (§4), not one shared line                     |
| 8     | **Card sizing:** content-driven / `onLayout`; do not keep 420px/84% tuned for removed portrait  |

---

## 9. Deferred items

- **B3 (ring scale/stage tuning)** — after B1 validated in QA
- **B4 legacy removal** — complete (`PondRippleReveal` removed; flag OFF = no ring)
- ~~**C3 (audio/analytics)**~~ — shipped 2026-07-21
- **Ring-adjacent grep (B2)** — complete

---

## PR phasing

| PR  | Scope                                 | Risk                           |
| --- | ------------------------------------- | ------------------------------ |
| PR1 | Pure text card (A1–A7)                | Medium exposure / low diff     |
| PR2 | Ring sequential + tier labels (B1–B2) | Medium — animation, flag-gated |
| PR3 | Flag rollout + legacy removal (B4)    | Medium — prod exposure         |
