# Sanctuary Gate — Production Asset Inventory

Hand-painted watercolor · botanical storybook · parchment · deckled edges · sage / moss / olive / lavender.

**Rules:** PNG, transparent background, no text, no prices, no baked UI copy, no complete screens.

**Reference:** [`../reference/sanctuary-gate-reference.png`](../reference/sanctuary-gate-reference.png)

## Directory layout

```
assets/sanctuary-gate/
  reference/
    sanctuary-gate-reference.png
  ui/
    01-cards/
    02-buttons/
    03-badges/
    04-icons/
    05-decorative/
    06-illustrations/
    07-header/
    08-background/
    ASSET_MANIFEST.md
```

**Total assets:** 40 / 40 created

---

# 1. CARDS — `01-cards/`

## A1. Current Access Card — [x]

|             |                                    |
| ----------- | ---------------------------------- |
| **File**    | `01-cards/current_access_card.png` |
| **Size**    | 1400 × 900                         |
| **Purpose** | Container for active entitlement   |

**Contains:** deckled parchment · subtle botanical corner flourishes · aged paper texture · soft shadow baked into card

**Must NOT contain:** cottage illustration · text · ribbon · account state

**9-slice cap insets:** Top 140 · Left 140 · Bottom 140 · Right 140 · stretch center only

---

## A2. Pricing Card — Standard — [x]

|              |                                      |
| ------------ | ------------------------------------ |
| **File**     | `01-cards/pricing_card_standard.png` |
| **Size**     | 1400 × 900                           |
| **Used for** | Wooden Rod · Fiberglass Rod          |

**Contains:** parchment body · deckled edges · internal content regions implied by texture only · botanical corner decoration

**Must NOT contain:** rod artwork · prices · dividers · text

**9-slice cap insets:** Top 130 · Left 130 · Bottom 130 · Right 130

---

## A3. Pricing Card — Premium — [x]

|              |                                     |
| ------------ | ----------------------------------- |
| **File**     | `01-cards/pricing_card_premium.png` |
| **Size**     | 1400 × 900                          |
| **Used for** | Lifetime Access                     |

**Contains:** richer parchment · subtle gold botanical edging · slightly elevated visual hierarchy

**Must NOT contain:** key artwork · price · CTA

**9-slice cap insets:** Top 160 · Left 160 · Bottom 160 · Right 160

---

## A4. Account Footer Card — [x]

|             |                                    |
| ----------- | ---------------------------------- |
| **File**    | `01-cards/account_footer_card.png` |
| **Size**    | 1200 × 400                         |
| **Purpose** | Compact account / footer strip     |

**Contains:** compact parchment strip · small botanical corners

---

# 2. BUTTON SYSTEM — `02-buttons/`

## B1. Standard CTA — [x]

|           |                                  |
| --------- | -------------------------------- |
| **File**  | `02-buttons/button_standard.png` |
| **Size**  | 800 × 220                        |
| **State** | `AVAILABLE`                      |

**Used for:** Wooden Monthly · Wooden Lifetime · Fiberglass Monthly · Lifetime Access

---

## B2. Recommended CTA — [x]

|          |                                     |
| -------- | ----------------------------------- |
| **File** | `02-buttons/button_recommended.png` |
| **Size** | 800 × 220                           |
| **When** | `tier.isRecommended == true`        |

**Contains:** warmer wood · gold trim · slightly richer shadow

---

## B3. Disabled CTA — [x]

|          |                                  |
| -------- | -------------------------------- |
| **File** | `02-buttons/button_disabled.png` |
| **Size** | 800 × 220                        |
| **When** | `tier.state == .unavailable`     |

**Contains:** faded wood · lower contrast

---

# 3. BADGE SYSTEM — `03-badges/`

## C1. Most Chosen Ribbon — [x]

|           |                                    |
| --------- | ---------------------------------- |
| **File**  | `03-badges/ribbon_most_chosen.png` |
| **Style** | pale lavender · watercolor cloth   |

---

## C2. Best Value Ribbon — [x]

|           |                                   |
| --------- | --------------------------------- |
| **File**  | `03-badges/ribbon_best_value.png` |
| **Style** | warm botanical gold               |

---

## C3. Owned Wax Seal — [x]

|           |                                                     |
| --------- | --------------------------------------------------- |
| **File**  | `03-badges/wax_seal_owned.png`                      |
| **Style** | moss green wax · botanical embossing · blank center |

---

## C4. Active Wax Seal — [x]

|              |                                 |
| ------------ | ------------------------------- |
| **File**     | `03-badges/wax_seal_active.png` |
| **Used for** | Current Plan                    |

---

# 4. ICON FAMILY — `04-icons/`

All icons: transparent PNG · dark moss ink · single stroke weight · 128 × 128 master (~24 pt @2x)

| ID  | File                       | Meaning        | Status |
| --- | -------------------------- | -------------- | ------ |
| D1  | `04-icons/icon_key.png`    | Unlock Tools   | [x]    |
| D2  | `04-icons/icon_book.png`   | Lessons        | [x]    |
| D3  | `04-icons/icon_sprout.png` | Growth         | [x]    |
| D4  | `04-icons/icon_heart.png`  | Belonging      | [x]    |
| D5  | `04-icons/icon_tool.png`   | Equipment      | [x]    |
| D6  | `04-icons/icon_update.png` | Future Updates | [x]    |

---

# 5. DECORATIVE BOTANICALS — `05-decorative/`

| ID  | File                                              | Status |
| --- | ------------------------------------------------- | ------ |
| E1  | `05-decorative/pressed_daisy.png`                 | [x]    |
| E2  | `05-decorative/pressed_lavender.png`              | [x]    |
| E3  | `05-decorative/pressed_leaf.png`                  | [x]    |
| E4  | `05-decorative/small_butterfly.png`               | [x]    |
| E5  | `05-decorative/sparrow_perched.png`               | [x]    |
| E6  | `05-decorative/botanical_corner_top_left.png`     | [x]    |
| E7  | `05-decorative/botanical_corner_top_right.png`    | [x]    |
| E8  | `05-decorative/botanical_corner_bottom_left.png`  | [x]    |
| E9  | `05-decorative/botanical_corner_bottom_right.png` | [x]    |

---

# 6. TIER ILLUSTRATIONS — `06-illustrations/`

Independent hero art — no card · no background scene · transparent PNG.

| ID  | File                                               | Contains                                          | Status |
| --- | -------------------------------------------------- | ------------------------------------------------- | ------ |
| F1  | `06-illustrations/current_access_cottage.png`      | cottage · flowering garden · already-home feeling | [x]    |
| F2  | `06-illustrations/wooden_rod_illustration.png`     | watercolor rod · young leaves                     | [x]    |
| F3  | `06-illustrations/fiberglass_rod_illustration.png` | fiberglass rod · lavender flowers                 | [x]    |
| F4  | `06-illustrations/lifetime_key_archway.png`        | botanical arch · sanctuary key                    | [x]    |

---

# 7. STICKY HEADER — `07-header/`

| ID  | File                                             | Status |
| --- | ------------------------------------------------ | ------ |
| G1  | `07-header/sticky_header_strip.png`              | [x]    |
| G2  | `07-header/sticky_header_divider.png` (optional) | [x]    |

**G1 contains:** parchment strip · subtle botanical corners · no text

**G2 contains:** thin botanical divider line

---

# 8. BACKGROUND ELEMENTS — `08-background/`

Separated from cards for parallax / layered assembly.

| ID  | File                                         | Status |
| --- | -------------------------------------------- | ------ |
| H1  | `08-background/window_left.png`              | [x]    |
| H2  | `08-background/glass_jar_large.png`          | [x]    |
| H3  | `08-background/glass_jar_small.png`          | [x]    |
| H4  | `08-background/ivy_hanging_segment.png`      | [x]    |
| H5  | `08-background/wildflower_cluster_left.png`  | [x]    |
| H6  | `08-background/wildflower_cluster_right.png` | [x]    |
| H7  | `08-background/wooden_shelf_segment.png`     | [x]    |
| H8  | `08-background/parchment_note_small.png`     | [x]    |

---

# Button states

| State       | Asset                               |
| ----------- | ----------------------------------- |
| Available   | `02-buttons/button_standard.png`    |
| Recommended | `02-buttons/button_recommended.png` |
| Owned       | `03-badges/wax_seal_owned.png`      |
| Unavailable | `02-buttons/button_disabled.png`    |

**Current Plan badge:** `03-badges/wax_seal_active.png`

---

# Card states

## Current Access

```swift
enum AccessState {
    case active
}
```

## Pricing Card

```swift
enum PricingState {
    case available
    case recommended
    case owned
    case unavailable
}
```

---

# Recommended SwiftUI component structure

```swift
CurrentAccessCard
 ├─ 01-cards/current_access_card.png
 ├─ 06-illustrations/current_access_cottage.png
 └─ dynamic entitlement text

PricingCard
 ├─ 01-cards/pricing_card_standard.png
 ├─ tier illustration (F2 or F3)
 ├─ dynamic features
 ├─ dynamic pricing
 └─ button state (B1 / B2 / B3)

PremiumPricingCard
 ├─ 01-cards/pricing_card_premium.png
 ├─ 06-illustrations/lifetime_key_archway.png
 └─ recommendation badge (C1 or C2)

StickyHeader
 ├─ 07-header/sticky_header_strip.png
 └─ 07-header/sticky_header_divider.png (optional)

AccountFooter
 ├─ 01-cards/account_footer_card.png
 └─ 08-background/parchment_note_small.png

BackgroundLayer
 ├─ 08-background/window_left.png
 ├─ 08-background/glass_jar_large.png
 ├─ 08-background/ivy_hanging_segment.png
 ├─ 08-background/wildflower_cluster_left.png
 ├─ 08-background/wildflower_cluster_right.png
 └─ 08-background/wooden_shelf_segment.png
```

---

# SwiftUI import paths (bundle)

When adding to Xcode asset catalog or bundle, preserve filenames exactly as listed above for 1:1 mapping with component code.
