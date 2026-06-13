#!/usr/bin/env python3
"""Normalize stillwater journal spreads to match creatures_0-2 framing."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
STILLWATER = ROOT / "assets/journal/stillwater"
REF_NAME = "creatures_0-2.png"
TAB_LEFT = 467
CANVAS = (576, 1024)


def lum(r: int, g: int, b: int) -> float:
    return 0.299 * r + 0.587 * g + 0.114 * b


def wood_top_y(im: Image.Image) -> int:
    w, h = im.size
    px = im.load()
    for y in range(h - 1, int(h * 0.5), -1):
        dark = sum(1 for x in range(w) if lum(*px[x, y]) < 50)
        if dark / w < 0.25:
            return y
    return int(h * 0.5)


def left_page_edge(im: Image.Image) -> int:
    w, h = im.size
    px = im.load()
    for x in range(w):
        parchment = sum(
            1
            for y in range(int(h * 0.12), int(h * 0.88))
            if px[x, y][0] > 170 and px[x, y][1] > 155
        )
        if parchment > (h * 0.76) * 0.12:
            return x
    return 0


def fit_page_slot(
    src: Image.Image,
    slot_w: int,
    slot_h: int,
    ref_slot: Image.Image,
) -> Image.Image:
    """Scale page to slot width; bottom-align in slot on reference parchment."""
    sw, sh = src.size
    scale = slot_w / sw
    nh = max(1, int(round(sh * scale)))
    resized = src.resize((slot_w, nh), Image.Resampling.LANCZOS)

    if nh > slot_h:
        top = max(0, nh - slot_h)
        return resized.crop((0, top, slot_w, top + slot_h))

    canvas = ref_slot.copy()
    y_offset = slot_h - nh
    canvas.paste(resized, (0, y_offset))
    return canvas


def normalize_spread(ref: Image.Image, src: Image.Image) -> Image.Image:
    ref_left = left_page_edge(ref)
    ref_bottom = wood_top_y(ref)
    src_bottom = wood_top_y(src)

    slot_w = TAB_LEFT - ref_left
    slot_h = ref_bottom
    ref_slot = ref.crop((ref_left, 0, TAB_LEFT, ref_bottom))

    page = src.crop((ref_left, 0, TAB_LEFT, src_bottom))
    fitted = fit_page_slot(page, slot_w, slot_h, ref_slot)

    out = ref.copy()
    out.paste(fitted, (ref_left, 0))

    # Restore reference wood, candle, and fabric tabs from creatures 0–2.
    out.paste(ref.crop((0, ref_bottom, CANVAS[0], CANVAS[1])), (0, ref_bottom))
    out.paste(ref.crop((TAB_LEFT, 0, CANVAS[0], CANVAS[1])), (TAB_LEFT, 0))

    return out


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Normalize journal spreads to reference framing.")
    parser.add_argument(
        "--min-creature",
        type=int,
        default=0,
        help="Only normalize spreads whose first creature index is >= this value (default: 0).",
    )
    args = parser.parse_args()

    ref_path = STILLWATER / REF_NAME
    ref = Image.open(ref_path).convert("RGB")
    assert ref.size == CANVAS, f"Reference must be {CANVAS}, got {ref.size}"

    for path in sorted(STILLWATER.glob("creatures_*.png")):
        if path.name == REF_NAME:
            continue
        first_index = int(path.stem.replace("creatures_", "").split("-")[0])
        if first_index < args.min_creature:
            continue
        src = Image.open(path).convert("RGB")
        if src.size != CANVAS:
            src = src.resize(CANVAS, Image.Resampling.LANCZOS)
        out = normalize_spread(ref, src)
        out.save(path)
        print(f"normalized {path.name}")


if __name__ == "__main__":
    main()
