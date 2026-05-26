#!/usr/bin/env python3
"""Extract ICON STATES tab icons from the design spec sheet into transparent PNGs."""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_CANDIDATES = [
    ROOT / "assets/design/spec-sheet-tab-icons.png",
    Path(
        "/Users/hjcfung/.cursor/projects/Users-hjcfung-Documents-into-the-pond-v3/assets/"
        "ChatGPT_Image_May_23__2026_at_02_24_55_PM-561c2468-44c4-4840-a88f-8037d4cf329d.png"
    ),
]
OUT_DIR = ROOT / "assets/images/tab-icons"

# Full-sheet coords for the ICON STATES 4×2 grid (tuned against spec sheet).
SECTION = (470, 300, 1010, 665)
GRID = dict(left=188, top=66, width=338, height=200)
COLS = 4
ROWS = 2
TAB_ORDER = ["net", "classroom", "store", "gate"]
STATE_ORDER = ["inactive", "active"]
ICON_FRAC_TOP = 0.12
ICON_FRAC_BOTTOM = 0.58
CELL_PAD_X = 6
CELL_PAD_TOP = 2


def find_source() -> Path:
    for candidate in SRC_CANDIDATES:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"Source sheet not found. Expected {SRC_CANDIDATES[0]}")


def is_background(r: int, g: int, b: int) -> bool:
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    spread = max(r, g, b) - min(r, g, b)
    # Parchment fill
    if r > 228 and g > 218 and b > 200 and lum > 215 and spread < 28:
        return True
    # Checkerboard light squares only (very flat neutrals)
    if lum > 225 and spread < 12:
        return True
    if lum > 250:
        return True
    return False


def remove_background_flood(img: Image.Image) -> Image.Image:
    """Remove background using corner color + tolerance (preserves light ink lines)."""
    px = img.load()
    w, h = img.size
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    rs = [px[x, y][0] for x, y in corners]
    gs = [px[x, y][1] for x, y in corners]
    bs = [px[x, y][2] for x, y in corners]
    br, bg, bb = sum(rs) // 4, sum(gs) // 4, sum(bs) // 4
    tol = 28

    def near_bg(r: int, g: int, b: int) -> bool:
        return abs(r - br) <= tol and abs(g - bg) <= tol and abs(b - bb) <= tol

    visited = [[False] * w for _ in range(h)]
    stack: list[tuple[int, int]] = [(x, y) for x, y in corners]

    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or visited[y][x]:
            continue
        visited[y][x] = True
        r, g, b, a = px[x, y]
        if not near_bg(r, g, b) and not is_background(r, g, b):
            continue
        px[x, y] = (r, g, b, 0)
        stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    # Also clear obvious paper pixels not reached (e.g. enclosed white)
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and is_background(r, g, b):
                px[x, y] = (r, g, b, 0)
    return img


def trim_alpha(img: Image.Image, pad: int = 8) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad)
    y1 = min(img.height, y1 + pad)
    return img.crop((x0, y0, x1, y1))


def main() -> None:
    src = find_source()
    design_copy = SRC_CANDIDATES[0]
    design_copy.parent.mkdir(parents=True, exist_ok=True)
    if src.resolve() != design_copy.resolve():
        shutil.copy2(src, design_copy)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(design_copy).convert("RGBA")
    section = sheet.crop(SECTION)

    col_w = GRID["width"] / COLS
    row_h = GRID["height"] / ROWS

    for row in range(ROWS):
        for col in range(COLS):
            x0 = int(GRID["left"] + col * col_w)
            y0 = int(GRID["top"] + row * row_h)
            x1 = int(GRID["left"] + (col + 1) * col_w)
            y1 = int(GRID["top"] + (row + 1) * row_h)
            cell = section.crop((x0, y0, x1, y1))
            inner = cell.crop(
                (
                    CELL_PAD_X,
                    CELL_PAD_TOP,
                    max(CELL_PAD_X + 1, cell.width - CELL_PAD_X),
                    cell.height,
                )
            )
            y_start = int(inner.height * ICON_FRAC_TOP)
            y_end = max(y_start + 1, int(inner.height * ICON_FRAC_BOTTOM))
            icon = inner.crop((0, y_start, inner.width, y_end))
            icon = remove_background_flood(icon)
            icon = trim_alpha(icon)
            name = f"{TAB_ORDER[col]}-{STATE_ORDER[row]}.png"
            out_path = OUT_DIR / name
            icon.save(out_path)
            print(f"{name}\t{icon.size[0]}x{icon.size[1]}")

    print(f"Wrote 8 icons to {OUT_DIR}")


if __name__ == "__main__":
    main()
