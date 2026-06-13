# Sanctuary Gate — Card Layout Map

Artboard reference: **1400 × 900** (matches `assets/gate/cards/*.png`).

Each card is a **layout template**. Dynamic content must render only inside assigned frames.
Decorative botanical corners are **forbidden** for text (see red zones in debug overlay).

---

## current_access_card.png

Two-column composition: illustration window (left) + entitlement copy (right).

```
┌─────────────────────────────────────────────────────────────┐
│ ░░ forbidden TL          parchment safe header    forbidden ░│
│ ░░                         (no text)                  ░░░░░│
│ ┌──────────────┐  ┌─────────────────────────────────────┐  │
│ │              │  │ TITLE ZONE                          │  │
│ │ ILLUSTRATION │  ├─────────────────────────────────────┤  │
│ │   (blue)     │  │ active tier label (subtitle frame)  │  │
│ │  cottage     │  ├─────────────────────────────────────┤  │
│ │              │  │ DESCRIPTION ZONE                    │  │
│ └──────────────┘  └─────────────────────────────────────┘  │
│ ░░ forbidden BL                              forbidden BR ░│
└─────────────────────────────────────────────────────────────┘
```

| Zone         | Frame (L, T, W, H)     |
| ------------ | ---------------------- |
| Illustration | 0.05, 0.12, 0.38, 0.76 |
| Title        | 0.45, 0.18, 0.48, 0.12 |
| Active tier  | 0.45, 0.30, 0.48, 0.08 |
| Description  | 0.45, 0.38, 0.48, 0.40 |
| Features     | —                      |
| Pricing      | —                      |
| CTA          | —                      |

**Forbidden regions:** four corner botanical clusters (deckled margin).

---

## pricing_card_standard.png & pricing_card_premium.png

**Flex layout** (no absolute positioning). Artwork is background only; content uses flex columns.

```
┌─────────────────────────────────────────────────────────────┐
│ CONTENT AREA (~72% height)                                   │
│                                    [ ribbon ] [ wax seal ]   │
│ ┌──────────┐ ┌─────────────────────────────────────────────┐ │
│ │ILLUST    │ │ Title (max 2 lines)                         │ │
│ │          │ │ Description (max 3 lines)                   │ │
│ │          │ │ Lesson range                                │ │
│ └──────────┘ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ FEATURES — full card width (max 1 line each)            │  │
│ └─────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ PURCHASE FOOTER (~28% height)                                │
│ ─── parchment divider ───                                    │
│ Monthly price                                                │
│ [ Monthly CTA ]                                              │
│ Lifetime price                                               │
│ [ Lifetime CTA ]                                             │
└─────────────────────────────────────────────────────────────┘
```

Constants: `src/features/gate/pricingCardFlexLayout.ts`

| Zone            | Flex / behavior                  |
| --------------- | -------------------------------- |
| Content area    | `flex: 72`                       |
| Purchase footer | `flex: 28`                       |
| Illustration    | 32% width column in top row      |
| Header          | remaining width in top row       |
| Features        | full width, `flex: 1` in content |
| Prices + CTAs   | stacked vertically in footer     |

Owned tiers: footer hidden; content expands to full card height.

---

## pricing_card_standard.png (legacy absolute template — deprecated)

Three-column composition: illustration | info | purchase stack.

```
┌─────────────────────────────────────────────────────────────┐
│ ░ ribbon/forbidden TR                                       │
│ ┌─────────┐ ┌──────────────────┐ ┌─────────────────────┐   │
│ │ILLUST   │ │ TITLE            │ │ PRICING (labels)    │   │
│ │ (blue)  │ ├──────────────────┤ ├─────────────────────┤   │
│ │         │ │ DESCRIPTION      │ │ CTA monthly         │   │
│ │         │ ├──────────────────┤ │ CTA lifetime        │   │
│ │         │ │ FEATURES (green) │ │ (buttonFrame)       │   │
│ └─────────┘ └──────────────────┘ └─────────────────────┘   │
│ ░ forbidden BL                              forbidden BR ░│
└─────────────────────────────────────────────────────────────┘
```

| Zone          | Frame (L, T, W, H)     |
| ------------- | ---------------------- |
| Illustration  | 0.03, 0.08, 0.31, 0.84 |
| Title         | 0.35, 0.12, 0.33, 0.10 |
| Description   | 0.35, 0.22, 0.33, 0.14 |
| Features      | 0.35, 0.36, 0.33, 0.52 |
| Pricing       | 0.69, 0.14, 0.27, 0.22 |
| CTA / buttons | 0.69, 0.18, 0.27, 0.70 |

**Button slots (within template):**

- Monthly CTA: 0.69, 0.20, 0.27, 0.26
- Lifetime CTA: 0.69, 0.50, 0.27, 0.26

---

## pricing_card_premium.png

Same three-column logic; wider gold inset; single lifetime CTA.

| Zone          | Frame (L, T, W, H)     |
| ------------- | ---------------------- |
| Illustration  | 0.04, 0.10, 0.30, 0.80 |
| Title         | 0.36, 0.14, 0.32, 0.10 |
| Description   | 0.36, 0.24, 0.32, 0.14 |
| Features      | 0.36, 0.38, 0.32, 0.50 |
| Pricing       | 0.69, 0.20, 0.26, 0.16 |
| CTA / buttons | 0.69, 0.28, 0.26, 0.32 |

---

## Debug overlay legend

| Color        | Meaning                                                           |
| ------------ | ----------------------------------------------------------------- |
| Blue         | `illustrationFrame`                                               |
| Green        | `titleFrame`, `descriptionFrame`, `featuresFrame`, `pricingFrame` |
| Red          | `forbiddenRegions`                                                |
| Green dashed | `buttonFrame`                                                     |

Toggle: triple-tap **Sanctuary Gate** title in `__DEV__` builds.
