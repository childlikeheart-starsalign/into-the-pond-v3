# Cast finish — Pure field-note briefing for implementation planning

**Status:** Implemented in app (2026-07-21). See implementation plan §10 for remaining rollout.  
**Audience:** Claude Sonnet (or similar) tasked with producing a detailed, phased implementation plan.  
**Repo:** `into-the-pond-v3` (Expo Router / React Native)  
**Date context:** July 2026

**Implementation plan:** [`cast-finish-pure-field-note-implementation-plan.md`](cast-finish-pure-field-note-implementation-plan.md)

---

## Pre-flight (resolved — read before Phase B)

### 1. Catalog `poolTier` vs ring display `"basic"`

Two correct vocabularies, never reconciled:

- **Catalog / encounter:** `poolTier = "common" | "rare" | "epic"` (always has been `"common"`, not `"basic"`).
- **Ring UI:** `PondRippleDisplayTier = "empty" | "basic" | "rare" | "epic"`, bridged by `rarityIndicatorToDisplayTier()` (`rarityIndicator: "common"` → `"basic"`).

`creature-probabilities.json` `"tier": "common"` is catalog `poolTier`. `meta.poolCatchRates.basic` keys the **`rodRequired: "basic"`** rod pool — not display tier.

**B2 scope:** Ring-layer rename only (`empty`→miss, `basic`→common in display types/labels). Do **not** rename `rodRequired`, bait tier, `RodType`, or `SheetCWeightProfile` `"basic"`.

### 2. `visualMetaphor` vs JSON `description`

- **Catalog:** `visualMetaphor` on all 150 creatures — real source field.
- **JSON export:** `description` is alias only (`description: creature.visualMetaphor` in generator).
- **Live code:** `creatureFieldNote()` in `claimCelebrationCopy.ts` already reads `visualMetaphor`. **A3 needs no source-field change.**

---

## Your task

Produce a **detailed implementation plan** for the cast-finish experience described below. You should:

1. Read the cited files in this repo (paths are relative to the project root).
2. Propose phased PRs with file-level diffs, test updates, and QA steps.
3. **Give product/UX insight** where this brief leaves decisions open (see [Open decisions](#open-decisions-resolved-in-implementation-plan)).
4. Do **not** implement yet — plan only.
5. Flag risks, regressions, and what to defer vs ship together.

---

## Product intent (canonical)

**Pure field-note — text only. The ring is the entire spectacle budget.**

After a cast is claimed, the player sees:

1. **Ring ceremony** (full visual spectacle) — already partially built.
2. **Field-note card** (quiet text) — names what happened like a naturalist's notebook:
   - Title (journal heading)
   - Creature name in display type (on catch/duplicate)
   - **One written line** (observation — catalog `visualMetaphor`)
   - Reward line(s) when consolation applies
   - **Closing line** — outcome-specific journal settle (see implementation plan §4)
   - Continue

**Explicitly excluded from the card:**

- Creature image / cutout / portrait / stamp
- Collection progress (`12/150`, percentages, "3 new")
- Preview banners
- Any extra ornament beyond minimal journal structure

**Brand rules (must respect):**

- Warm palette tokens (`#FAF7F2` bg, `#1F1A17` text — never pure black)
- Playfair/Cormorant for display headlines; Inter for body/buttons
- Mobile: 48px min tap targets, 16px horizontal padding, 24px section gaps
- No progress-as-a-number on this screen (collection counts belong elsewhere, e.g. Net tab)

---

## Current architecture (as-built)

### Cast lifecycle

```
startCast → client countdown (readyAt) → claimCast (Cloud Function) → completedClaim → Modal ceremony → clearCompletedClaim
```

| Concern                 | File                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| Hook (sole cast owner)  | `src/features/fishing/useActiveCast.ts`                                               |
| Server claim            | `src/features/fishing/fishingServerCast.ts` → `claimCast` in `functions/src/index.ts` |
| Sanctuary orchestration | `app/(tabs)/sanctuary.tsx`                                                            |
| Fishing UI (cast start) | `src/features/fishing/FishingModal.tsx`                                               |

### Vocabulary note (catalog vs ring)

| Concept            | Values                                                                                                        | File                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Catalog `poolTier` | `common`, `rare`, `epic`                                                                                      | `src/data/creatures/types.ts`    |
| Ring display bands | `empty`, `basic`, `rare`, `epic`                                                                              | `pondRippleCatalog.ts`           |
| Radial order (B1)  | **Epic outer → miss/empty inner** — supersedes legacy Basic-outer lock doc on ordering only, not width ratios | `POND_RIPPLE_BAND_ORDER`         |
| Mapping            | `common` rarityIndicator → ring band `basic`                                                                  | `rarityIndicatorToDisplayTier()` |

### Claim modal ceremony (sanctuary.tsx)

- `completedClaim` triggers a full-screen `Modal` with warm scrim (`CLAIM_THRESHOLD_SCRIM`).
- **Phase A — ring:** `revealOverlay` on `ClaimCelebrationCard` while `claimRevealReady === false`.
  - If `catalogRarityRingUi` flag ON → `CatalogRarityRing`
  - Else → legacy `PondRippleReveal`
- **Phase B — text:** After `onComplete`, `claimRevealReady = true` → journal text + Continue.
- **`catalogRarityRingUi` does not gate the text card** — only which ring runs in Phase A.
- Blocks back dismiss until ring completes.
- Snapshots subscription tier at claim time for ring band unlock (`claimSubscriptionSnapshotRef`).

### Ring components

| File                                           | Role                                                            |
| ---------------------------------------------- | --------------------------------------------------------------- |
| `src/features/fishing/CatalogRarityRing.tsx`   | Flag-on ring ceremony; flourish → settle → pulse on caught band |
| `src/features/fishing/PondRippleReveal.tsx`    | Legacy wrapper (flag off)                                       |
| `src/features/fishing/WatercolorPondPlate.tsx` | SVG watercolor bands                                            |
| `src/features/fishing/pondRippleCatalog.ts`    | Band ratios, tier mapping, ceremony de-dupe keys                |

Feature flag: `catalogRarityRingUi` — default OFF until session hydrate (`src/features/fishing/featureFlags.ts`).

### Field-note card (needs refactor)

| File                                            | Role                                                          |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `src/features/fishing/ClaimCelebrationCard.tsx` | Parchment card UI (`WellCardShell` + Today's Focus card-back) |
| `src/features/fishing/claimCelebrationCopy.ts`  | Copy builder from `ServerClaimSummary`                        |

**Current layout order (WRONG for target spec):**

```
title → creature portrait plate → species name → field note → ❦ divider → rewards → Continue
```

**Target layout order:**

```
title → species name → one written line → [divider if rewards] → rewards → closing line → Continue
```

**Current gap:** Card still renders `creaturePortrait` (68% width plate, max 200px). Wired from:

- `app/(tabs)/sanctuary.tsx` → `CreatureCutoutPortrait` + `resolveCreatureCutoutSource`
- `app/cast-finish-fixture.tsx` (dev QA)

Cutout pipeline (`src/features/fishing/creatureCutoutAssets.ts`, aliases, normalize script) should **stay in repo** for Net/other surfaces — only **decouple from cast finish**.

### Copy (claimCelebrationCopy.ts)

Already largely aligned:

- Titles: "A visitor from the pond" / "A familiar visitor" / "The pond answered gently"
- `fieldNote`: catalog `visualMetaphor` (≤100 chars), wired via `creatureFieldNote()` — **already live**
- Rewards: lines with `(+N)` subordinate amounts (implementation plan drops "Observed today" heading)
- **Missing:** `closingLine` (three outcome variants — see implementation plan §4)

Tests in `src/features/fishing/fishingCastArchitecture.test.ts` assert field-note voice, no `+` in fieldNote, reward label patterns.

### Dev fixtures

- `app/cast-finish-fixture.tsx` — full ceremony presets (still mentions cutout art)
- `app/pond-ripple-fixture.tsx` — ring-only smoke

---

## Gap analysis — what needs implementing

### Phase A — Pure text card (highest priority)

| #   | Work item                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------- |
| A1  | Remove `creaturePlate` / `creatureFrame` / `creaturePortrait` from `ClaimCelebrationCard`                  |
| A2  | Reorder content: title → species → fieldNote → divider (if rewards) → rewards → **closingLine** → Continue |
| A3  | Add `closingLine` to `ClaimCelebrationCopy` + `buildClaimCelebrationCopy` (no catalog field changes)       |
| A4  | Unwire `CreatureCutoutPortrait` from `sanctuary.tsx` and `cast-finish-fixture.tsx`                         |
| A5  | Typography/spacing + content-driven card sizing (drop 420px/84% portrait-tuned height)                     |
| A6  | Remove dead `previewOnly` prop if unused                                                                   |
| A7  | Update tests + fixture presets + dev hint copy                                                             |

### Phase B — Ring as sole spectacle (enhancement)

| #   | Work item                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | **Sequential band illuminate** (outer → inner) — NOT built today                                                                                  |
| B2  | Ring display rename only: `empty`→miss, `basic`→common in `PondRippleDisplayTier` / labels / fixtures — **not** catalog `poolTier` or rod `basic` |
| B3  | Ring scale/stage tuning (defer until B1 QA)                                                                                                       |
| B4  | Feature-flag rollout; retire `PondRippleReveal` after bake period                                                                                 |

### Phase C — Architecture hardening (verify, don't redesign)

| #   | Work item                                           |
| --- | --------------------------------------------------- |
| C1  | Ceremony idempotency — already exists               |
| C2  | Error field-notes separate from claim modal         |
| C3  | Audio + analytics — wire-through after PR1          |
| C4  | `claimCeremonyBlocking` — no new casts during modal |

---

## Key code references

**Ceremony gate (sanctuary.tsx ~466–520):**

- Modal visible when `completedClaim != null`
- `showContinue={claimRevealReady}` — Continue hidden during ring
- `revealOverlay` = ring component until complete

**Copy builder signature:**

```typescript
// claimCelebrationCopy.ts
export type ClaimCelebrationCopy = {
  title: string;
  speciesName: string | null;
  fieldNote: string; // visualMetaphor via creatureFieldNote()
  rewardHeading: string | null; // drop per implementation plan
  rewardLines: QuietRewardLine[];
  closingLine: string; // ADD
};
```

**Ring tier mapping:**

```typescript
// pondRippleCatalog.ts
outcomeToDisplayTier(claim); // miss → "empty", else rarityIndicator → "basic"|"rare"|"epic"
// catalog poolTier "common" maps to ring band "basic" today; B2 renames ring band to "common"
```

---

## Open decisions (resolved in implementation plan)

All eight items from the original brief are resolved in [`cast-finish-pure-field-note-implementation-plan.md`](cast-finish-pure-field-note-implementation-plan.md) §8. Summary:

- Conditional divider; keep `(+N)` rewards; drop "Observed today"
- Ship Phase A first; fixed-total-duration ring animation (§5)
- Three outcome-specific closing lines; content-driven card sizing

---

## Explicitly out of scope

- Creature cutout asset generation/normalization scripts (keep; don't delete)
- Net tab collection UI (`app/(tabs)/net.tsx`)
- Encounter engine / economy bugs (`poolComplete`, etc.)
- Pond ripple catalog ratios (30/70/150) — decorative geometry, not numeric UI
- `docs/data/creature-probabilities.json` reference data (note: JSON `description` = catalog `visualMetaphor`)

---

## Testing expectations

See implementation plan §6. Run: `npm run test:fishing`

---

## Suggested phasing

| PR  | Scope                                 | Risk                           |
| --- | ------------------------------------- | ------------------------------ |
| PR1 | Pure text card (A1–A7)                | Medium exposure — no flag gate |
| PR2 | Ring sequential + tier labels (B1–B2) | Medium — flag-gated            |
| PR3 | Flag rollout + legacy removal (B4)    | Medium — prod exposure         |

---

## Instructions to Sonnet

The approved plan lives in [`cast-finish-pure-field-note-implementation-plan.md`](cast-finish-pure-field-note-implementation-plan.md). Use this brief for product context and file paths; use the implementation plan for execution sequencing, copy table, animation spec, and rollout.

When implementing, start with **PR1 (Phase A only)** unless explicitly asked to include Phase B.
