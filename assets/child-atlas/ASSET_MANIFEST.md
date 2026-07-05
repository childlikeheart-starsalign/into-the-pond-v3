# Child Atlas — Asset Inventory

**Build entry cards:** `npm run generate:atlas-entry-cards`

## Master sheet

| File                                 | Size     | Purpose                                              |
| ------------------------------------ | -------- | ---------------------------------------------------- |
| `source/atlas_entry_cards_sheet.png` | 682×1024 | 2×4 category pile sprite sheet (do not edit by hand) |

## Generated — `entry-cards/`

| File                  | Category            |
| --------------------- | ------------------- |
| `curiosity.png`       | curiosity           |
| `worries.png`         | worries (primary)   |
| `worries_variant.png` | worries stack depth |
| `excitement.png`      | excitement          |
| `interests.png`       | interests           |
| `emotional.png`       | emotional           |
| `social.png`          | social              |
| `imagination.png`     | imagination         |

**`identity`** uses generic `atlas_entry_card_bg.png` until dedicated art.

## Background layers

| File                   | Purpose                  |
| ---------------------- | ------------------------ |
| `paper_texture.png`    | Seamless kraft tile      |
| `topo_contours.png`    | Ghosted contour lines    |
| `empty_trail.png`      | Empty state dotted trail |
| `wavy_divider.png`     | Focus slide divider      |
| `icons/{category}.png` | Category stamps (96×96)  |

## Rules

- Baked titles on pile shells are intentional
- Entry body text is live UI overlaid via `atlasEntryCardLayout.ts`
