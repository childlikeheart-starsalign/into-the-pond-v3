# Craft journey assumptions (Phase 1 lock-in)

Confirmed for implementation / scenario math from the fishing & craft content package:

## 3.1 — No retroactive parts / Wonder on migration backfill

Migrating a legacy user with a `completedLessons` map may reconcile rod _state_ (e.g. `locked` → `craftable`) from backfilled `lessonProgress`, but does **not** retroactively grant the parts or Wonder the parent would have earned at lesson time.

## `giftSource` on `playerRods`

`giftSource` is a real schema field on `users/{uid}/playerRods/{domainRodId}` (see `PlayerRodDoc` / progression `PlayerRodRecord`). Journey gift of `rare_wildcard` sets `giftSource: "journey_gift"`.

## 3.3 — Diary deep vs surface (locked default)

Until product overrides: treat each diary submission as **deep** for journey Wonder math (`storedWonder +8` alongside `currentWonder +2` surface award documented in journey scenarios). Constants live in `shared/sanctuary/progression/craftJourneyWonder.ts`. Surface-only diaries are out of scope for Wonder projections until a depth mapping ships.

Journey economy scenarios in `docs/handoff/phase1-fishing/03-craft-journey-scenarios.md` that assume every diary is deep are **valid under this default**.
