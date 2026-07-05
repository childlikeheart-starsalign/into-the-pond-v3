#!/usr/bin/env python3
"""Extract reusable assets from well birthdate target mock."""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
MOCK = ROOT / "assets" / "well" / "source" / "well_birthdate_target_mock.png"
LEGACY_MOCK = ROOT / "assets" / "well" / "source" / "well_birthdate_mock.png"
WELL_ESTABLISHING = ROOT / "assets" / "well" / "well_scene_establishing.png"
OUT_BOTANICAL = ROOT / "assets" / "well" / "botanical_corner.png"
OUT_PARCHMENT = ROOT / "assets" / "well" / "parchment_ritual_sheet.png"
OUT_PLAQUE = ROOT / "assets" / "well" / "continue_plaque.png"
OUT_WELL_GHOST = ROOT / "assets" / "well" / "well_ghost_blurred.png"
OUT_BIRTHDATE_CARD = ROOT / "assets" / "well" / "well_birthdate_card.png"
CARD_SOURCE = ROOT / "assets" / "well" / "source" / "well_birthdate_card_source.png"
PREVIEW = ROOT / "assets" / "well" / "source" / "_birthdate_assets_preview.png"

BOTANICAL_SEARCH = (0.55, 0.42, 0.95, 0.58)
PARCHMENT_SEARCH = (0.04, 0.385, 0.96, 0.60)


def is_botanical_pixel(r: int, g: int, b: int, a: int) -> bool:
    return a > 100 and g > r + 10 and g > 80


def is_ink(r: int, g: int, b: int, a: int) -> bool:
    if a < 80:
        return False
    # Dark brown body / placeholder text
    if r < 140 and g < 130 and b < 115:
        return True
    # Sage green caps labels
    if g > r + 4 and g > b + 8 and 85 < g < 175 and r < 150:
        return True
    return False


def is_parchment(r: int, g: int, b: int, a: int) -> bool:
    if a < 180:
        return False
    if r > 246 and g > 242 and b > 235:
        return False
    return r > 215 and g > 200 and b > 170


def is_wood(r: int, g: int, b: int, a: int) -> bool:
    return a >= 200 and 80 < r < 165 and 50 < g < 125 and 35 < b < 95 and r > g > b


def is_gold_border(r: int, g: int, b: int, a: int) -> bool:
    return a > 150 and r > 150 and g > 120 and b > 80 and r > g > b


def atomic_save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_name(f"{path.stem}.tmp{path.suffix}")
    img.save(tmp_path, optimize=True)
    size = tmp_path.stat().st_size
    if size < 1024:
        tmp_path.unlink(missing_ok=True)
        raise ValueError(f"Refusing to replace {path.name}: temp PNG too small ({size} bytes)")
    os.replace(tmp_path, path)


def trim_alpha(img: Image.Image, predicate) -> Image.Image:
    px = img.load()
    w, h = img.size
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if predicate(*px[x, y]):
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
    if maxx < 0:
        return img
    pad = 2
    return img.crop(
        (
            max(0, minx - pad),
            max(0, miny - pad),
            min(w, maxx + pad + 1),
            min(h, maxy + pad + 1),
        )
    )


def extract_botanical(sheet: Image.Image) -> Image.Image:
    w, h = sheet.size
    x0 = int(w * BOTANICAL_SEARCH[0])
    y0 = int(h * BOTANICAL_SEARCH[1])
    x1 = int(w * BOTANICAL_SEARCH[2])
    y1 = int(h * BOTANICAL_SEARCH[3])
    region = sheet.crop((x0, y0, x1, y1)).convert("RGBA")
    cut = trim_alpha(region, is_botanical_pixel)
    px = cut.load()
    cw, ch = cut.size
    for y in range(ch):
        for x in range(cw):
            r, g, b, a = px[x, y]
            if is_botanical_pixel(r, g, b, a):
                px[x, y] = (r, g, b, 255)
            else:
                px[x, y] = (0, 0, 0, 0)
    return cut


def extract_parchment(sheet: Image.Image) -> Image.Image:
    w, h = sheet.size
    x0 = int(w * PARCHMENT_SEARCH[0])
    y0 = int(h * PARCHMENT_SEARCH[1])
    x1 = int(w * PARCHMENT_SEARCH[2])
    y1 = int(h * PARCHMENT_SEARCH[3])
    card = sheet.crop((x0, y0, x1, y1)).convert("RGBA")
    px = card.load()
    cw, ch = card.size
    for y in range(ch):
        for x in range(cw):
            r, g, b, a = px[x, y]
            if is_ink(r, g, b, a):
                px[x, y] = (247, 241, 230, 255)
            elif not is_parchment(r, g, b, a) and a < 80:
                px[x, y] = (0, 0, 0, 0)
            elif not is_parchment(r, g, b, a) and a > 30:
                px[x, y] = (r, g, b, min(a, 180))
    return trim_alpha(card, lambda r, g, b, a: a > 40)


def extract_continue_plaque(sheet: Image.Image) -> Image.Image:
    w, h = sheet.size
    minx, miny, maxx, maxy = w, h, -1, -1
    px = sheet.load()
    for y in range(int(h * 0.74), h):
        for x in range(w):
            if is_wood(*px[x, y]):
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
    return sheet.crop((max(0, minx - 2), max(0, miny - 2), min(w, maxx + 3), min(h, maxy + 3)))


def extract_well_ghost_blurred() -> Image.Image:
    img = Image.open(WELL_ESTABLISHING).convert("RGBA")
    return img.filter(ImageFilter.GaussianBlur(radius=1))


def key_black_background(img: Image.Image, threshold: int = 35) -> Image.Image:
    """Remove solid black matte from card art exports."""
    out = img.convert("RGBA")
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r <= threshold and g <= threshold and b <= threshold:
                px[x, y] = (0, 0, 0, 0)
    return out


def soften_bottom_glow(img: Image.Image, glow_start: float = 0.68) -> Image.Image:
    """Fade misty bottom glow into cream so the card blends with the scene."""
    cream = (250, 247, 242)
    out = img.convert("RGBA")
    px = out.load()
    w, h = out.size
    for y in range(h):
        t = max(0.0, (y - h * glow_start) / (h * (1 - glow_start)))
        if t <= 0:
            continue
        fade = t**1.4
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            nr = int(r * (1 - fade) + cream[0] * fade)
            ng = int(g * (1 - fade) + cream[1] * fade)
            nb = int(b * (1 - fade) + cream[2] * fade)
            na = int(a * (1 - fade * 0.95))
            px[x, y] = (0, 0, 0, 0) if na < 8 else (nr, ng, nb, na)
    return out


def strip_card_drop_shadow(img: Image.Image) -> Image.Image:
    """Remove baked drop shadow outside the gold card border."""
    out = img.convert("RGBA").copy()
    px = out.load()
    w, h = out.size
    last_gold = [0] * w
    for x in range(w):
        for y in range(h - 1, -1, -1):
            if is_gold_border(*px[x, y]):
                last_gold[x] = y
                break
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0:
                continue
            if last_gold[x] == 0 or y > last_gold[x]:
                px[x, y] = (0, 0, 0, 0)
    return out


def prepare_birthdate_card() -> Image.Image | None:
    if not CARD_SOURCE.exists():
        if OUT_BIRTHDATE_CARD.exists():
            card = key_black_background(Image.open(OUT_BIRTHDATE_CARD))
            return strip_card_drop_shadow(soften_bottom_glow(card))
        return None
    card = key_black_background(Image.open(CARD_SOURCE))
    return strip_card_drop_shadow(soften_bottom_glow(card))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()

    source = MOCK if MOCK.exists() else LEGACY_MOCK
    if not source.exists():
        raise SystemExit(f"Missing mock: {MOCK}")

    sheet = Image.open(source).convert("RGBA")
    OUT_BOTANICAL.parent.mkdir(parents=True, exist_ok=True)

    botanical = extract_botanical(sheet)
    botanical.save(OUT_BOTANICAL, optimize=True)
    print(f"wrote {OUT_BOTANICAL.relative_to(ROOT)} ({botanical.size[0]}×{botanical.size[1]})")

    parchment = extract_parchment(sheet)
    parchment.save(OUT_PARCHMENT, optimize=True)
    print(f"wrote {OUT_PARCHMENT.relative_to(ROOT)} ({parchment.size[0]}×{parchment.size[1]})")

    plaque = extract_continue_plaque(sheet)
    plaque.save(OUT_PLAQUE, optimize=True)
    print(f"wrote {OUT_PLAQUE.relative_to(ROOT)} ({plaque.size[0]}×{plaque.size[1]})")

    well_ghost = extract_well_ghost_blurred()
    well_ghost.save(OUT_WELL_GHOST, optimize=True)
    print(f"wrote {OUT_WELL_GHOST.relative_to(ROOT)} ({well_ghost.size[0]}×{well_ghost.size[1]})")

    card = prepare_birthdate_card()
    if card is not None:
        atomic_save_png(card, OUT_BIRTHDATE_CARD)
        print(f"wrote {OUT_BIRTHDATE_CARD.relative_to(ROOT)} ({card.size[0]}×{card.size[1]})")

    if args.preview:
        preview = Image.new("RGBA", (576, 420), (250, 247, 242, 255))
        preview.alpha_composite(parchment, (20, 20))
        preview.alpha_composite(plaque, (20, 260))
        preview.save(PREVIEW, optimize=True)
        print(f"wrote {PREVIEW.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
