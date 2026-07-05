#!/usr/bin/env python3
"""Deprecated — use scripts/process_sanctuary_tab_bar_strip.mjs instead.

Crops the parchment strip from assets/images/sanctuary/tab_bar_parchment_strip_source.png.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "images" / "sanctuary" / "Afternoon:background.png"
OUT = ROOT / "assets" / "images" / "sanctuary" / "sanctuary_tab_bar_strip.png"

# Matches SANCTUARY_TAB_BAR_STRIP_HEIGHT_RATIO in sanctuaryNavLayout.ts
STRIP_HEIGHT_RATIO = 0.14


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source image: {SOURCE}")

    sheet = Image.open(SOURCE).convert("RGBA")
    width, height = sheet.size
    strip_height = max(1, round(height * STRIP_HEIGHT_RATIO))
    top = height - strip_height
    strip = sheet.crop((0, top, width, height))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    strip.save(OUT, optimize=True)
    print(f"wrote {OUT.relative_to(ROOT)} ({strip.size[0]}×{strip.size[1]})")


if __name__ == "__main__":
    main()
