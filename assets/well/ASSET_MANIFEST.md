# Well of Questions — Asset Inventory

**Build atlas cards:** `npm run generate:atlas-entry-cards`  
**Build birthdate gate assets:** `npm run extract:well-birthdate-assets`  
**Bake scene gradients (top hood / closeup bottom vignette):** `npm run bake:well-scene-gradients`  
**Rebuild focus card shell (strip bottom mist, top glow):** `npm run bake:todays-focus-card-shell`

## Included in repo

| File                             | Size     | Purpose                                                     |
| -------------------------------- | -------- | ----------------------------------------------------------- |
| `well_scene_establishing.png`    | 9:16     | Phase A garden well scene — top hood baked                  |
| `well_ghost_blurred.png`         | 9:16     | Birthdate gate ghost layer (establishing + 1px blur)        |
| `well_scene_closeup.png`         | 9:16     | Phase C top-down well — top hood + bottom vignette baked    |
| `well_birthdate_card.png`        | 682×1024 | Unified birthdate gate card — RGBA, black matte keyed out   |
| `parchment_ritual_sheet.png`     | ~436×220 | Legacy horizontal sheet (superseded by well_birthdate_card) |
| `continue_plaque.png`            | ~473×265 | Carved wooden Continue plaque from target mock              |
| `botanical_corner.png`           | —        | Birthdate card bottom-right sprig overlay                   |
| `source/well_birthdate_mock.png` | 576×1024 | Reference mock for asset extraction                         |
| `todays_focus_card.png`          | 505×836  | Flip card front — trimmed, transparent outside card shape   |
| `todays_focus_card_back.png`     | 505×836  | Flip card back — same trimmed art                           |
| `depth_rating_leaf.png`          | —        | Depth rating row + reward leaf arc                          |
| `well_insight_glow.png`          | 512×512  | Reward reveal golden bloom (RGBA)                           |
| `well_atlas_saved_icon.png`      | 48×48    | Open-book stamp beside atlas label                          |

## Rules

- Live typography overlaid in `TodaysFocusCardFront` / `TodaysFocusCardBack`
- Card aspect ratio: **682 / 1024**
