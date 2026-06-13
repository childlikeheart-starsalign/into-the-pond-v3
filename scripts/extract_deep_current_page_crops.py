#!/usr/bin/env python3
"""Extract page-only crops from deep-current spread PNGs (creatures 30+)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPREADS = ROOT / "assets/journal/stillwater"
OUT = ROOT / "assets/journal/deep-current/pages"

# Matches JOURNAL_PAGE_CROP_REF in fieldJournalLayout.ts (stillwater pages/*_page.png).
CROP_LEFT = 57
CROP_TOP = 0
CROP_WIDTH = 410
CROP_HEIGHT = 837
MIN_CREATURE = 30


def extract_page(spread_path: Path, out_path: Path) -> None:
    src = Image.open(spread_path).convert("RGBA")
    if src.size != (576, 1024):
        src = src.resize((576, 1024), Image.Resampling.LANCZOS)
    crop = src.crop(
        (
            CROP_LEFT,
            CROP_TOP,
            CROP_LEFT + CROP_WIDTH,
            CROP_TOP + CROP_HEIGHT,
        )
    )
    OUT.mkdir(parents=True, exist_ok=True)
    crop.save(out_path, optimize=True)
    print(f"wrote {out_path.relative_to(ROOT)}")


def main() -> None:
    for spread_path in sorted(SPREADS.glob("creatures_*.png")):
        first = int(spread_path.stem.replace("creatures_", "").split("-")[0])
        if first < MIN_CREATURE:
            continue
        stem = spread_path.stem.replace("creatures_", "")
        out_path = OUT / f"creatures_{stem}_page.png"
        extract_page(spread_path, out_path)


if __name__ == "__main__":
    main()
