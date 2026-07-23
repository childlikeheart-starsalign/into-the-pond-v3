# Sanctuary Header Manual QA

**Component:** `SanctuaryHeader`  
**Devices:** iPhone SE (2nd/3rd Gen), iPhone 15, iPhone 15 Pro Max  
**Orientation:** Portrait only  
**Theme:** Into the Pond Storybook UI

Cross-linked from [responsive-qa.md](./responsive-qa.md).

**Asset prep:**

- Crop slot PNGs from composite overlay: `npm run sanctuary:extract-header-slots`
- Black letterbox → transparent: `npm run sanctuary:process-header-assets` (backs up to `assets/sanctuary/header/originals/`)
- Set `USE_COMPOSITE_PLACEHOLDER_STRETCH = false` in `sanctuaryHeaderAssets.ts` once intrinsic art is in place (default after extract)

**Composite production path:** cropped `header_illustration_strip` at **128pt** band replaces paper + frame; legacy decomposed stack remains behind `USE_HEADER_COMPOSITE_OVERLAY = false`.

**Dev tuning (`__DEV__` only):**

- Triple-tap the child name on the sanctuary header to open the layout tuning panel
- Nudge overlay (steppers or drag overlay when Overlay target is selected), band height, avatar center Y, and per-slot optical offsets
- Tap **Copy constants** → paste into `src/features/sanctuary/sanctuaryHeaderLayout.ts`
- **Reset** restores shipped constants and clears saved dev overrides (AsyncStorage)

---

## Device Matrix

| Device            | iOS | Pass | Notes |
| ----------------- | --- | ---- | ----- |
| iPhone SE         |     | ☐    |       |
| iPhone 15         |     | ☐    |       |
| iPhone 15 Pro Max |     | ☐    |       |

---

## Layout QA

| Test                              | Expected Result                                                                          | Pass | Notes                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------- |
| Header height                     | Composite overlay: **128pt** + SafeArea (legacy paper path: 182–188pt + SafeArea)        | ☐    | Overlay rect fills the 128pt band with the cropped header-strip artwork   |
| Composite overlay (no black band) | Parchment visible; no opaque letterbox above/below florals                               | ☐    | Run `npm run sanctuary:process-header-assets` on all header PNGs          |
| Transparent wreath hole           | Avatar or soft placeholder visible through center; no black disc                         | ☐    | Overlay z7 above avatar z4; hole must be alpha in PNG                     |
| Composite slot decoratives        | `month_note`, `wonder_bottle`, `botanical_overlay`, `settings_button` deco above overlay | ☐    | Deliverables §3 slots; `contain` resize (no stretch except paper 9-slice) |
| Composite z-order                 | Avatar through wreath hole; decoratives at slot positions                                | ☐    | overlay z7 → deco z7 → live z8                                            |
| Avatar remains centered           | Optical center maintained                                                                | ☐    |                                                                           |
| Child name aligns beneath avatar  | Horizontally centered                                                                    | ☐    |                                                                           |
| Wonder bottle aligns top-right    | Never touches notch/Dynamic Island                                                       | ☐    |                                                                           |
| Settings button aligns top-right  | Minimum 48×48pt hit target                                                               | ☐    |                                                                           |
| No overlapping elements           | All spacing preserved                                                                    | ☐    |                                                                           |

---

## Long Child Name

Test value: `Alexandertheodore` (18 characters)

| Test                      | Expected Result        | Pass | Notes |
| ------------------------- | ---------------------- | ---- | ----- |
| Name remains readable     | No clipping            | ☐    |       |
| Name stays centered       | No optical shift       | ☐    |       |
| Avatar position unchanged | Never moves vertically | ☐    |       |
| Settings unaffected       | No overlap             | ☐    |       |
| Wonder section unaffected | No collision           | ☐    |       |

---

## Wonder Value QA

| Wonder | Expected                                | Pass |
| ------ | --------------------------------------- | ---- |
| 0      | Displays "0", proper alignment          | ☐    |
| 9      | Single digit centered                   | ☐    |
| 999    | Three digits fit naturally              | ☐    |
| 10000  | Five digits readable, no bottle overlap | ☐    |

---

## Dynamic Island / Notch QA

| Device            | Expected Result                | Pass |
| ----------------- | ------------------------------ | ---- |
| iPhone 15         | No overlap with Dynamic Island | ☐    |
| iPhone 15 Pro Max | No overlap with Dynamic Island | ☐    |
| iPhone SE         | Correct top safe area spacing  | ☐    |

---

## VoiceOver QA

Expected reading order: Month → Wonder → Child name → Settings

| Element    | Expected VoiceOver                       | Pass |
| ---------- | ---------------------------------------- | ---- |
| Month      | "Current month, June"                    | ☐    |
| Wonder     | "Wonder: 128"                            | ☐    |
| Child name | "Oliver"                                 | ☐    |
| Settings   | "Settings. Double tap to open settings." | ☐    |

Decorative layers (paper, botanical, bottle art, frame) must be skipped.

---

## Interaction QA

| Test                               | Expected Result | Pass |
| ---------------------------------- | --------------- | ---- |
| Settings hit area ≥48pt            | ☐               |
| Avatar tap area (if enabled) ≥48pt | ☐               |
| Reduced Motion disables fades      | ☐               |

---

## Animation QA

| Test                          | Expected Result     | Pass |
| ----------------------------- | ------------------- | ---- |
| Avatar fades in               | ≤200ms opacity only | ☐    |
| Wonder updates fade           | ≤200ms              | ☐    |
| No scaling / bounce / shimmer | ☐                   |

---

## Visual Consistency

| Test                                                   | Expected Result | Pass |
| ------------------------------------------------------ | --------------- | ---- |
| Colors match palette (`#FAF7F2`, `#1F1A17`, `#5B514A`) | ☐               |
| No pure black or system fonts                          | ☐               |
| No rasterized text in PNGs                             | ☐               |

---

## Implementation Deliverables §6 — Acceptance Checklist

| #   | Criterion                                         | Composite                             | Legacy                    | Pass |
| --- | ------------------------------------------------- | ------------------------------------- | ------------------------- | ---- |
| 1   | Header height 170–190pt + safe area               | **128pt** + safe (approved exception) | 182–188pt + safe          | ☐    |
| 2   | Avatar diameter fixed; never stretches            | 86–96pt fixed                         | same                      | ☐    |
| 3   | Paper stretches via 9-slice; corners intact       | overlay `cover` replaces paper        | `header_paper_bg` 9-slice | ☐    |
| 4   | Botanical crops naturally                         | `botanical_overlay` contain           | same                      | ☐    |
| 5   | Month label visible on SE                         | live text + `month_note` deco         | same                      | ☐    |
| 6   | Wonder bottle/count clear of notch                | deliverables slots                    | same                      | ☐    |
| 7   | Child name centered; 18 chars                     | Playfair live text                    | same                      | ☐    |
| 8   | Wonder 0 / 9 / 999 / 10000 fits                   | Inter live text                       | same                      | ☐    |
| 9   | Settings ≥48×48pt tap target                      | `Pressable` z8                        | same                      | ☐    |
| 10  | VoiceOver: Month → Wonder → Child name → Settings | ☐                                     | ☐                         | ☐    |
| 11  | Decorative layers hidden from a11y                | `DecorativeImage` flags               | same                      | ☐    |
| 12  | Fades ≤200ms opacity only                         | 180ms                                 | same                      | ☐    |
| 13  | No rasterized text in PNGs                        | live text only                        | same                      | ☐    |
| 14  | Palette `#FAF7F2` / `#1F1A17` / `#5B514A`         | ☐                                     | ☐                         | ☐    |
| 15  | Storybook journal margin, not toolbar             | ☐                                     | ☐                         | ☐    |

---

**Question:** Does the header feel like the upper margin of a cherished field journal rather than an app toolbar?

☐ **PASS** — Storybook journal margin  
☐ **FAIL** — Conventional app toolbar; revise layout constants
