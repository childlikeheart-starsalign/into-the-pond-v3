#!/usr/bin/env python3
"""Generate 02-fishing-outcomes-matrix.csv with 150 pre-stubbed rows."""

import csv
from pathlib import Path

RODS = [
    ("basic", "basic", "any"),
    ("rare_fire", "rare", "fire"),
    ("rare_water", "rare", "water"),
    ("rare_wind", "rare", "wind"),
    ("rare_electric", "rare", "electric"),
    ("rare_wildcard", "rare", "any"),
    ("epic_fire", "epic", "fire"),
    ("epic_water", "epic", "water"),
    ("epic_wind", "epic", "wind"),
    ("epic_electric", "epic", "electric"),
]

BAITS = ["bait_basic", "bait_mid", "bait_premium"]
WONDER_LEVELS = [0, 25, 45, 65, 90]

HEADERS = [
    "row_id",
    "rod_id",
    "rod_tier",
    "rod_element",
    "bait_used",
    "current_wonder",
    "expected_creature_pool",
    "expected_catch",
    "expected_miss_reason",
    "notes",
]

def main() -> None:
    out = Path(__file__).resolve().parent.parent / "deliverables" / "02-fishing-outcomes-matrix.csv"
    rows = []
    n = 0
    for rod_id, tier, element in RODS:
        for bait in BAITS:
            for wonder in WONDER_LEVELS:
                n += 1
                rows.append({
                    "row_id": n,
                    "rod_id": rod_id,
                    "rod_tier": tier,
                    "rod_element": element,
                    "bait_used": bait,
                    "current_wonder": wonder,
                    "expected_creature_pool": "",
                    "expected_catch": "",
                    "expected_miss_reason": "",
                    "notes": "",
                })

    with out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=HEADERS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {out}")


if __name__ == "__main__":
    main()
