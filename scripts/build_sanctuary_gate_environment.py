#!/usr/bin/env python3
"""Flatten approved gate background layers into a single 9:16 portrait scene."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BG_DIR = ROOT / "assets" / "gate" / "background"
OUT = BG_DIR / "sanctuary_gate_environment.png"

CANVAS_W = 2048
CANVAS_H = 4096
BG_RGB = (250, 247, 242)  # theme colors.bg


def paste_pct(
    canvas: Image.Image,
    filename: str,
    *,
    left: float | None = None,
    right: float | None = None,
    top: float | None = None,
    bottom: float | None = None,
    width: float,
    height: float,
    opacity: float = 1.0,
) -> None:
    path = BG_DIR / filename
    layer = Image.open(path).convert("RGBA")
    target_w = int(CANVAS_W * width)
    target_h = int(CANVAS_H * height)
    layer = layer.resize((target_w, target_h), Image.Resampling.LANCZOS)

    if opacity < 1.0:
        alpha = layer.getchannel("A")
        alpha = alpha.point(lambda p: int(p * opacity))
        layer.putalpha(alpha)

    if left is not None:
        x = int(CANVAS_W * left)
    else:
        assert right is not None
        x = int(CANVAS_W * (1 - right - width))

    if top is not None:
        y = int(CANVAS_H * top)
    else:
        assert bottom is not None
        y = int(CANVAS_H * (1 - bottom - height))

    canvas.alpha_composite(layer, (x, y))


def main() -> None:
    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (*BG_RGB, 255))

    # Matches GateBackgroundLayer placement — edges only, center stays quiet.
    paste_pct(canvas, "window_left.png", left=0, top=0.04, width=0.42, height=0.34, opacity=0.95)
    paste_pct(canvas, "glass_jar_large.png", left=0.06, top=0.28, width=0.22, height=0.16)
    paste_pct(canvas, "ivy_hanging_segment.png", right=0, top=0, width=0.28, height=0.22)
    paste_pct(canvas, "wildflower_cluster_left.png", left=0, bottom=0.18, width=0.30, height=0.14)
    paste_pct(canvas, "wildflower_cluster_right.png", right=0, bottom=0.20, width=0.28, height=0.14)
    paste_pct(canvas, "wooden_shelf_segment.png", right=0.04, top=0.36, width=0.24, height=0.12, opacity=0.9)

    canvas.convert("RGB").save(OUT, optimize=True)
    print(f"Wrote {OUT} ({CANVAS_W}x{CANVAS_H})")


if __name__ == "__main__":
    main()
