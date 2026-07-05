#!/usr/bin/env python3
"""Prepare fishing cast overlay and lock assets with transparency."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FISHING_DIR = ROOT / "assets" / "Fishing"
CURSOR_ASSETS = Path.home() / ".cursor/projects/Users-hjcfung-Documents-into-the-pond-v3/assets"

CAST_SOURCE = CURSOR_ASSETS / "new-fishingmodallayout-2417e99b-686d-46fb-b191-226d0d48c3c9.png"
LOCK_SOURCE = CURSOR_ASSETS / (
    "Hand-drawn_in_a_charcoal_or_ink-wash_style._Slightly_irregular_lifework."
    "-15-387f0a31-39d1-4d2b-9b88-75e2cb4c2ca0.png"
)

CAST_OUT = FISHING_DIR / "fishing_cast_overlay.png"
LOCK_OUT = FISHING_DIR / "fishing_lock.png"


def is_checkerboard_pixel(r: int, g: int, b: int) -> bool:
    """Light gray checkerboard matte from ChatGPT exports."""
    avg = (r + g + b) / 3
    spread = max(r, g, b) - min(r, g, b)
    return spread < 18 and 160 <= avg <= 245


def is_white_matte_pixel(r: int, g: int, b: int) -> bool:
    avg = (r + g + b) / 3
    spread = max(r, g, b) - min(r, g, b)
    # Pure export background.
    if r > 248 and g > 248 and b > 248:
        return True
    # Near-white matte left by soft cuts (avoid warm parchment interiors).
    return avg >= 243 and spread <= 28


def defringe_edge_halos(
    image: Image.Image,
    *,
    luminance_threshold: float = 232,
    max_spread: int = 36,
    passes: int = 2,
) -> Image.Image:
    """Remove 1–2px bright halos adjacent to transparency without eroding paper fill."""
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    for _ in range(passes):
        to_clear: list[tuple[int, int]] = []
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                if a == 0:
                    continue

                touches_transparent = False
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        touches_transparent = True
                        break
                    if pixels[nx, ny][3] == 0:
                        touches_transparent = True
                        break

                if not touches_transparent:
                    continue

                avg = (r + g + b) / 3
                spread = max(r, g, b) - min(r, g, b)
                if avg >= luminance_threshold and spread <= max_spread:
                    to_clear.append((x, y))

        for x, y in to_clear:
            pixels[x, y] = (0, 0, 0, 0)

    return rgba


def key_matte(image: Image.Image, *, white_matte: bool = False) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            keyed = is_white_matte_pixel(r, g, b) if white_matte else is_checkerboard_pixel(r, g, b)
            if keyed:
                pixels[x, y] = (r, g, b, 0)

    return rgba


def trim_to_content(image: Image.Image, *, padding: int = 4) -> Image.Image:
    rgba = image.convert("RGBA")
    bbox = rgba.getbbox()
    if bbox is None:
        return rgba

    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(rgba.width, right + padding)
    bottom = min(rgba.height, bottom + padding)
    return rgba.crop((left, top, right, bottom))


def prepare_cast_overlay(source: Path, output: Path) -> None:
    image = Image.open(source)
    keyed = key_matte(image, white_matte=True)
    cleaned = defringe_edge_halos(keyed)
    output.parent.mkdir(parents=True, exist_ok=True)
    cleaned.save(output, format="PNG")
    print(f"Wrote cast overlay {output} ({cleaned.size[0]}x{cleaned.size[1]})")


def prepare_lock(source: Path, output: Path) -> None:
    image = Image.open(source)
    keyed = key_matte(image, white_matte=True)
    trimmed = trim_to_content(keyed, padding=6)
    output.parent.mkdir(parents=True, exist_ok=True)
    trimmed.save(output, format="PNG")
    print(f"Wrote lock asset {output} ({trimmed.size[0]}x{trimmed.size[1]})")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cast-source", type=Path, default=CAST_SOURCE)
    parser.add_argument("--lock-source", type=Path, default=LOCK_SOURCE)
    parser.add_argument("--cast-out", type=Path, default=CAST_OUT)
    parser.add_argument("--lock-out", type=Path, default=LOCK_OUT)
    args = parser.parse_args()

    if not args.cast_source.exists():
        raise SystemExit(f"Cast source not found: {args.cast_source}")
    if not args.lock_source.exists():
        raise SystemExit(f"Lock source not found: {args.lock_source}")

    prepare_cast_overlay(args.cast_source, args.cast_out)
    prepare_lock(args.lock_source, args.lock_out)


if __name__ == "__main__":
    main()
