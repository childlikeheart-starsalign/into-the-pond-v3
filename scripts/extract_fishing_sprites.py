#!/usr/bin/env python3
"""Extract fishing UI sprites from the supplied 1080x1920 mockups.

Coordinates are normalized to the mockup artboard. Rod crops keep only the rod
art and embedded labels; the RN UI supplies the solid frosted panel behind them.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/Fishing/40.png"
LOCK_SOURCE = ROOT / "assets/Fishing/41.png"
OUT = ROOT / "assets/Fishing"


def crop_norm(image: Image.Image, box: tuple[float, float, float, float]) -> Image.Image:
    width, height = image.size
    left, top, right, bottom = box
    return image.crop(
        (
            round(left * width),
            round(top * height),
            round(right * width),
            round(bottom * height),
        )
    )


def keep_largest_components(image: Image.Image, *, max_components: int = 1) -> Image.Image:
    """Drop stray alpha islands from extracted sprites."""
    sprite = image.convert("RGBA")
    pixels = sprite.load()
    width, height = sprite.size
    seen: set[tuple[int, int]] = set()
    components: list[list[tuple[int, int]]] = []

    for y in range(height):
        for x in range(width):
            if (x, y) in seen or pixels[x, y][3] == 0:
                continue

            component: list[tuple[int, int]] = []
            queue: deque[tuple[int, int]] = deque([(x, y)])
            seen.add((x, y))

            while queue:
                cx, cy = queue.popleft()
                component.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    if (nx, ny) in seen or pixels[nx, ny][3] == 0:
                        continue
                    seen.add((nx, ny))
                    queue.append((nx, ny))

            components.append(component)

    keep = {
        point
        for component in sorted(components, key=len, reverse=True)[:max_components]
        for point in component
    }
    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] > 0 and (x, y) not in keep:
                r, g, b, _ = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)
    return sprite


def isolate_sprite(image: Image.Image, *, remove_rod_label: bool = False) -> Image.Image:
    """Make pale mockup panel/background pixels transparent."""
    sprite = image.convert("RGBA")
    pixels = sprite.load()
    width, height = sprite.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            sat = max(r, g, b) - min(r, g, b)

            # Mockup frosted panels and parchment are pale and low-contrast.
            if lum > 176 and sat < 62:
                a = 0
            elif r > 203 and g > 198 and b > 193:
                a = 0

            # Labels are now preserved from the original art; only use this
            # cutoff for one-off cleanup passes.
            if remove_rod_label and y > height * 0.95 and x > width * 0.18:
                a = 0

            pixels[x, y] = (r, g, b, a)
    return sprite


def isolate_rod_sprite(image: Image.Image) -> Image.Image:
    """Keep rod strokes/effects and embedded labels, but drop baked scenery."""
    sprite = image.convert("RGBA")
    pixels = sprite.load()
    width, height = sprite.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            sat = max(r, g, b) - min(r, g, b)

            is_dark_art = lum < 150 and sat > 8
            is_handle_or_line = lum < 175 and sat > 22 and not (g > r + 18 and g > b + 10)
            is_blue_effect = b > r + 18 and b >= g - 4 and sat > 30 and lum < 232
            is_fire_effect = r > 150 and g > 70 and b < 145 and r > b + 24 and sat > 42 and lum < 226
            is_gold_effect = r > 165 and g > 115 and b < 150 and r > b + 35 and sat > 34
            is_label = y > height * 0.58 and lum < 198 and sat > 10
            is_foliage = g > r + 6 and g > b + 4 and 90 < lum < 195 and sat < 55
            is_flower_bleed = r > 150 and g > 130 and b > 120 and sat < 48 and lum > 120
            is_corner_scenery = (
                x < width * 0.12
                and y > height * 0.84
                and (b > r + 8 or (r > 125 and g < 115 and b > 95))
            )
            keep = (
                (is_dark_art or is_handle_or_line or is_blue_effect or is_fire_effect or is_gold_effect or is_label)
                and not is_foliage
                and not is_flower_bleed
                and not is_corner_scenery
            )

            # Drop frosted cell fills and pale vertical gutter lines between mockup columns.
            is_frosted_cell = lum > 128 and sat < 60
            if is_frosted_cell:
                keep = False
            if is_label or is_blue_effect or is_fire_effect or is_gold_effect:
                keep = True
            if is_dark_art or is_handle_or_line:
                keep = True

            # Strip mockup edge bleed on the crop sides; keep handles/effects only.
            if x < width * 0.14 and y < height * 0.7:
                keep = False
            if x < width * 0.06 and not (y > height * 0.68 and lum < 168 and sat > 18):
                keep = False
            if x > width * 0.92:
                is_lightning = lum > 175 and sat < 95 and r > 130
                is_right_effect = is_fire_effect or is_gold_effect or is_blue_effect or is_lightning
                if not (is_right_effect or is_label):
                    keep = False

            if not keep:
                a = 0

            pixels[x, y] = (r, g, b, a)
    return sprite


def isolate_preview_rod(image: Image.Image) -> Image.Image:
    """Keep rod/effect art for the preview card, excluding tier labels/background."""
    sprite = isolate_sprite(image)
    return trim_transparent(remove_preview_rod_artifacts(sprite), padding=4)


def remove_preview_rod_artifacts(image: Image.Image) -> Image.Image:
    """Remove labels and source-edge strips without broad-cropping rod art."""
    sprite = image.convert("RGBA")
    pixels = sprite.load()
    width, height = sprite.size
    seen: set[tuple[int, int]] = set()

    for y in range(height):
        for x in range(width):
            if (x, y) in seen or pixels[x, y][3] == 0:
                continue

            component: list[tuple[int, int]] = []
            queue: deque[tuple[int, int]] = deque([(x, y)])
            seen.add((x, y))

            while queue:
                cx, cy = queue.popleft()
                component.append((cx, cy))
                for nx in (cx - 1, cx, cx + 1):
                    for ny in (cy - 1, cy, cy + 1):
                        if nx == cx and ny == cy:
                            continue
                        if nx < 0 or ny < 0 or nx >= width or ny >= height:
                            continue
                        if (nx, ny) in seen or pixels[nx, ny][3] == 0:
                            continue
                        seen.add((nx, ny))
                        queue.append((nx, ny))

            xs = [point[0] for point in component]
            ys = [point[1] for point in component]
            left, right = min(xs), max(xs)
            top, bottom = min(ys), max(ys)
            comp_width = right - left + 1
            comp_height = bottom - top + 1
            comp_area = len(component)

            is_left_edge_strip = left <= 2 and comp_height > height * 0.18 and comp_width > 5
            is_right_edge_strip = right >= width - 3 and comp_height > height * 0.18 and comp_width > 5
            is_left_edge_fragment = left <= 2 and comp_area < 1800
            is_right_edge_fragment = right >= width - 3 and comp_area < 1800
            is_bottom_label = top > height * 0.54 and left > width * 0.18 and comp_width > 12

            if (
                is_left_edge_strip
                or is_right_edge_strip
                or is_left_edge_fragment
                or is_right_edge_fragment
                or is_bottom_label
            ):
                for px, py in component:
                    r, g, b, _ = pixels[px, py]
                    pixels[px, py] = (r, g, b, 0)

    return sprite


def isolate_preview_bait(image: Image.Image) -> Image.Image:
    """Keep bait art for the preview card while removing source-scene bleed."""
    sprite = isolate_sprite(image)
    pixels = sprite.load()
    width, height = sprite.size
    for y in range(height):
        for x in range(width):
            if y > height * 0.88:
                r, g, b, _ = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)
    return trim_transparent(sprite, padding=4)


def isolate_basic_rod(image: Image.Image) -> Image.Image:
    """The basic rod sits over detailed flowers, so keep only the rod/handle component."""
    sprite = image.convert("RGBA")
    pixels = sprite.load()
    width, height = sprite.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            sat = max(r, g, b) - min(r, g, b)
            keep_blue_shaft = b >= g - 8 and lum < 135 and sat > 12
            keep_handle = r > 110 and g > 70 and b < 115 and sat > 28
            if y > height * 0.78 or not (keep_blue_shaft or keep_handle):
                a = 0
            pixels[x, y] = (r, g, b, a)
    return keep_largest_components(sprite, max_components=2)


def isolate_lock(image: Image.Image) -> Image.Image:
    """Keep only the heart-lock icon; drop rod art and tier labels."""
    sprite = image.convert("RGBA")
    pixels = sprite.load()
    width, height = sprite.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            sat = max(r, g, b) - min(r, g, b)

            is_heart = r > 145 and b > 105 and r > g + 12
            is_gold = r > 145 and g > 95 and b < 120 and r > b + 35
            is_shadow = 85 < lum < 178 and sat > 18 and r >= b

            if not (is_heart or is_gold or is_shadow):
                a = 0
            elif lum > 214 and sat < 38:
                a = 0

            # Tier labels ("Rare", "Epic") are magenta script at the slot bottom.
            if y > height * 0.66:
                a = 0

            # Rod line art and desaturated locked rods on the left edge.
            if x < width * 0.18 and lum < 190 and sat < 58:
                a = 0

            pixels[x, y] = (r, g, b, a)
    return keep_largest_components(sprite, max_components=2)


def trim_transparent(image: Image.Image, *, padding: int = 2) -> Image.Image:
    """Trim fully transparent bounds and add a small padding margin."""
    rgba = image.convert("RGBA")
    alpha = rgba.split()[-1]
    bbox = alpha.getbbox()
    if bbox is None:
        return rgba

    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(rgba.width, right + padding)
    bottom = min(rgba.height, bottom + padding)
    return rgba.crop((left, top, right, bottom))


def zero_transparent_rgb(image: Image.Image) -> Image.Image:
    """Avoid scaled-edge bleed from RGB data hidden behind transparent pixels."""
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                pixels[x, y] = (r, g, b, a)
    return rgba


# Rod art only — crop boxes are intentionally taller than the visible rod
# strokes so effects/handles are not clipped after contain-scaling in RN.
ROD_CROPS: list[tuple[str, tuple[float, float, float, float]]] = [
    ("rod_basic", (0.000, 0.590, 0.200, 0.735)),
    ("rod_rare_1", (0.200, 0.590, 0.400, 0.735)),
    ("rod_rare_2", (0.400, 0.590, 0.600, 0.735)),
    ("rod_rare_3", (0.600, 0.590, 0.800, 0.735)),
    ("rod_rare_4", (0.800, 0.590, 1.000, 0.735)),
    ("rod_rare_5", (0.000, 0.735, 0.200, 0.880)),
    ("rod_epic_1", (0.200, 0.735, 0.400, 0.880)),
    ("rod_epic_2", (0.400, 0.735, 0.600, 0.880)),
    ("rod_epic_3", (0.600, 0.735, 0.800, 0.880)),
    ("rod_epic_4", (0.800, 0.735, 1.000, 0.880)),
]

BAIT_CROPS: list[tuple[str, tuple[float, float, float, float]]] = [
    ("bait_basic", (0.055, 0.478, 0.115, 0.555)),
    ("bait_mid", (0.145, 0.478, 0.205, 0.555)),
    ("bait_premium", (0.235, 0.478, 0.295, 0.555)),
]

PREVIEW_ROD_CROPS = ROD_CROPS
PREVIEW_BAIT_CROPS = BAIT_CROPS

# Heart-lock icon only from a locked slot in 41.png.
LOCK_CROP = (0.220, 0.625, 0.380, 0.725)


def save_crop(
    image: Image.Image,
    box: tuple[float, float, float, float],
    path: Path,
    *,
    isolate: bool = False,
    rod: bool = False,
    remove_rod_label: bool = False,
    lock: bool = False,
    basic_rod: bool = False,
    trim: bool = True,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    crop = crop_norm(image, box)
    if basic_rod:
        crop = isolate_basic_rod(crop)
        crop = trim_transparent(crop)
    elif rod:
        crop = isolate_rod_sprite(crop)
    elif lock:
        crop = isolate_lock(crop)
        crop = trim_transparent(crop)
    elif isolate:
        crop = isolate_sprite(crop, remove_rod_label=remove_rod_label)
        if trim:
            crop = trim_transparent(crop)
    crop = zero_transparent_rgb(crop)
    crop.save(path, optimize=False)
    print(f"wrote {path.relative_to(ROOT)} ({crop.size[0]}x{crop.size[1]})")


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    lock_source = Image.open(LOCK_SOURCE).convert("RGBA")

    for name, box in ROD_CROPS:
        save_crop(
            source,
            box,
            OUT / "rods" / f"{name}.png",
            isolate=False,
            rod=True,
            remove_rod_label=False,
            basic_rod=False,
            trim=False,
        )

    for name, box in PREVIEW_ROD_CROPS:
        crop = isolate_preview_rod(crop_norm(source, box))
        path = OUT / "preview" / "rods" / f"{name}.png"
        path.parent.mkdir(parents=True, exist_ok=True)
        crop = zero_transparent_rgb(crop)
        crop.save(path, optimize=False)
        print(f"wrote {path.relative_to(ROOT)} ({crop.size[0]}x{crop.size[1]})")

    for name, box in BAIT_CROPS:
        save_crop(source, box, OUT / "baits" / f"{name}.png", isolate=True)

    for name, box in PREVIEW_BAIT_CROPS:
        crop = isolate_preview_bait(crop_norm(source, box))
        path = OUT / "preview" / "baits" / f"{name}.png"
        path.parent.mkdir(parents=True, exist_ok=True)
        crop = zero_transparent_rgb(crop)
        crop.save(path, optimize=False)
        print(f"wrote {path.relative_to(ROOT)} ({crop.size[0]}x{crop.size[1]})")

    save_crop(lock_source, LOCK_CROP, OUT / "lock_heart.png", lock=True)


if __name__ == "__main__":
    main()
