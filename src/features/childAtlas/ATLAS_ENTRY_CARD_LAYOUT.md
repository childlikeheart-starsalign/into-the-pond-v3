# Atlas Entry Card — Live Text Layout Map

Artboard reference: **278×298** (tallest cut from `curiosity.png` / `worries.png`).

Percent frames are shared across all category pile shells (same card geometry).

| Zone       | Frame (L, T, W, H)     | Live content                                                          |
| ---------- | ---------------------- | --------------------------------------------------------------------- |
| Header     | baked in PNG           | Category title + illustration (do not overlay)                        |
| Question   | 0.10, 0.43, 0.80, 0.24 | `QUESTION` label + `prompt` (Inter 13px label, 16px italic)           |
| Divider    | 0.10, 0.67, 0.80, 0.04 | `wavy_divider.png`                                                    |
| Reflection | 0.10, 0.71, 0.80, 0.18 | `WHAT YOU LEARNED` label + `reflectionText` (Inter 15px, max 3 lines) |
| Divider    | 0.10, 0.91, 0.80, 0.04 | `wavy_divider.png`                                                    |
| Metadata   | 0.10, 0.95, 0.80, 0.05 | `dateDiscovered` (Inter 12px)                                         |
| Forbidden  | corners                | botanical corners — no text                                           |

Implementation: [`atlasEntryCardLayout.ts`](atlasEntryCardLayout.ts)

**Identity** pile uses generic `atlas_entry_card_bg.png` until dedicated art is supplied.

`headline` is stored on the entry document but not rendered on the focus card.
