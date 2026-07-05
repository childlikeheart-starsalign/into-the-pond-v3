# PrimaryButton migration report

## Call-site count

- **`layout.btnPrimary` usages found:** 12 (across 8 files)
- **Extended primary CTAs migrated:** ChildBirthDateStep (`continueBtn`), WellBirthdateCard (`continuePill`), DiaryEntry discard (`btnSecondary` → destructive PrimaryButton)
- **Excluded (custom illustrated layouts):** [`RodCollectionMoment.tsx`](src/features/craftBench/RodCollectionMoment.tsx) — bespoke craft moment; kept existing `continueBtn`
- **A11y-only (no PrimaryButton):** [`ChildAtlasCategoryPile.tsx`](src/features/childAtlas/ChildAtlasCategoryPile.tsx)

## Image scaling

- Source assets: **844×260** PNG (destructive source file is JPEG data at 1024×345 — used as provided, not modified)
- **Decision:** `capInsets` `{ left: 140, top: 52, right: 140, bottom: 52 }` + `resizeMode="stretch"` on `ImageBackground`
- **Why:** Button widths span full modal width (~320–390pt) with label lengths from ~5–24 chars; capInsets preserves corner botanical art while allowing horizontal stretch without the naive full-image squash that would distort corner sprigs

## Text contrast

- **Color:** `#FAF7F2` (warm cream from palette tokens)
- **Why:** Brighter than prior `#FFFFFF` on `btnPrimary`; reads clearly on standard, recommended, destructive, and disabled wood tones

## VoiceOver contract (enforced by wrapper)

- `accessibilityRole="button"` always
- `accessibilityLabel` explicit per approved Task 2 table (falls back to visible `label` only if omitted)
- `accessibilityState={{ disabled, busy }}` wired from props
- Disabled visual always uses `button_disabled.png` regardless of variant

## Manual verification checklist

- [ ] Visual: each migrated screen — plaque not distorted, text legible
- [ ] Disabled: birth-date Continue before month/year selected shows disabled plaque
- [ ] VoiceOver: priority screens (Diary discard, birth date, sanctuary modals, Child Atlas piles)
- [ ] Untouched: Sanctuary hub, Well scene CTAs, Fishing modal, Classroom landmarks, Gate, narrative archetype/tap-to-advance
