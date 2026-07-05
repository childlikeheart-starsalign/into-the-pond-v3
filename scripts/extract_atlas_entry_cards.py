#!/usr/bin/env python3
"""Cut category pile shells from atlas_entry_cards_sheet.png (682×1024, 2×4 grid)."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SHEET = ROOT / "assets" / "child-atlas" / "source" / "atlas_entry_cards_sheet.png"
OUT_DIR = ROOT / "assets" / "child-atlas" / "entry-cards"
PREVIEW = ROOT / "assets" / "child-atlas" / "source" / "_cut_preview.png"

BLACK_THRESHOLD = 25
PAD = 2

# Slot search rects tuned on atlas_entry_cards_sheet.png
SLOTS: list[tuple[str, tuple[int, int, int, int]]] = [
    ("curiosity", (53, 36, 278, 298)),
    ("worries", (351, 36, 278, 298)),
    ("worries_variant", (52, 349, 278, 242)),
    ("excitement", (351, 349, 278, 242)),
    ("interests", (52, 605, 279, 218)),
    ("emotional", (351, 604, 279, 219)),
    ("social", (52, 838, 279, 186)),
    ("imagination", (350, 836, 280, 188)),
]


def is_card_pixel(r: int, g: int, b: int) -> bool:
    return r > BLACK_THRESHOLD or g > BLACK_THRESHOLD or b > BLACK_THRESHOLD


def trim_outline(region: Image.Image) -> Image.Image:
    rgba = region.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_card_pixel(r, g, b):
                px[x, y] = (r, g, b, 255)
            else:
                px[x, y] = (0, 0, 0, 0)

    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 0:
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)

    if maxx < minx:
        return rgba

    left = max(0, minx - PAD)
    top = max(0, miny - PAD)
    right = min(w, maxx + PAD + 1)
    bottom = min(h, maxy + PAD + 1)
    return rgba.crop((left, top, right, bottom))


def extract_slot(sheet: Image.Image, name: str, rect: tuple[int, int, int, int]) -> Image.Image:
    x, y, w, h = rect
    region = sheet.crop((x, y, x + w, y + h))
    return trim_outline(region)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()

    if not SHEET.exists():
        raise SystemExit(f"Missing master sheet: {SHEET}")

    sheet = Image.open(SHEET).convert("RGB")
    if sheet.size != (682, 1024):
        print(f"warning: expected 682×1024, got {sheet.size}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cuts: list[Image.Image] = []

    for name, rect in SLOTS:
        cut = extract_slot(sheet, name, rect)
        out = OUT_DIR / f"{name}.png"
        cut.save(out, optimize=True)
        cuts.append(cut)
        print(f"wrote {out.relative_to(ROOT)} ({cut.size[0]}×{cut.size[1]})")

    if args.preview:
        cols, rows = 2, 4
        cell_w = max(c.size[0] for c in cuts)
        cell_h = max(c.size[1] for c in cuts)
        preview = Image.new("RGBA", (cols * cell_w + 20, rows * cell_h + 20), (250, 247, 242, 255))
        for i, cut in enumerate(cuts):
            r, c = divmod(i, cols)
            preview.alpha_composite(
                cut,
                (10 + c * cell_w + (cell_w - cut.size[0]) // 2, 10 + r * cell_h + (cell_h - cut.size[1]) // 2),
            )
        preview.save(PREVIEW, optimize=True)
        print(f"wrote {PREVIEW.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
