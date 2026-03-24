#!/usr/bin/env python3
"""Generate monochrome PNG icons for LINE quick reply (run: pip install pillow && python3 scripts/generate-nicha-menu-icons.py)."""
from __future__ import annotations

import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    raise SystemExit("Install Pillow: pip install pillow") from None

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "nicha-menu"
W = H = 96


def save(name: str, draw_fn) -> None:
    im = Image.new("RGB", (W, H), (255, 255, 255))
    d = ImageDraw.Draw(im)
    draw_fn(d)
    OUT.mkdir(parents=True, exist_ok=True)
    im.save(OUT / f"{name}.png", "PNG")
    print("wrote", OUT / f"{name}.png")


def draw_bind(d: ImageDraw.ImageDraw) -> None:
    d.arc((18, 28, 46, 56), 200, 520, fill=(26, 26, 26), width=3)
    d.arc((50, 40, 78, 68), 20, 340, fill=(26, 26, 26), width=3)
    d.line((44, 44, 52, 52), fill=(26, 26, 26), width=3)


def draw_bill(d: ImageDraw.ImageDraw) -> None:
    d.rectangle((28, 20, 68, 76), outline=(26, 26, 26), width=3)
    d.line((36, 34, 60, 34), fill=(26, 26, 26), width=2)
    d.line((36, 46, 60, 46), fill=(26, 26, 26), width=2)
    d.line((36, 58, 56, 58), fill=(26, 26, 26), width=2)


def draw_building(d: ImageDraw.ImageDraw) -> None:
    d.polygon([(48, 22), (22, 44), (22, 74), (74, 74), (74, 44)], outline=(26, 26, 26), width=3)
    d.rectangle((32, 50, 40, 74), outline=(26, 26, 26), width=2)
    d.rectangle((56, 50, 64, 74), outline=(26, 26, 26), width=2)
    d.rectangle((40, 38, 56, 50), outline=(26, 26, 26), width=2)


def draw_add(d: ImageDraw.ImageDraw) -> None:
    d.ellipse((22, 22, 74, 74), outline=(26, 26, 26), width=3)
    d.line((48, 34, 48, 62), fill=(26, 26, 26), width=3)
    d.line((34, 48, 62, 48), fill=(26, 26, 26), width=3)


def draw_help(d: ImageDraw.ImageDraw) -> None:
    d.ellipse((22, 22, 74, 74), outline=(26, 26, 26), width=3)
    d.arc((34, 32, 62, 52), 200, 340, fill=(26, 26, 26), width=3)
    d.ellipse((45, 60, 51, 66), fill=(26, 26, 26))


def main() -> None:
    save("bind", draw_bind)
    save("bill", draw_bill)
    save("building", draw_building)
    save("add", draw_add)
    save("help", draw_help)


if __name__ == "__main__":
    main()
