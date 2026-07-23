# Into the Pond v3 — Open Items & Follow-Ups

**From:** Fishing & Craft content helper package (Tasks 2, 3, 5)
**Purpose:** Items that need a decision, a fix, or a confirmation before these deliverables are treated as final. Task 1 (audio) is tracked separately.

---

## 1. Design decisions needing a yes/no before implementation

### 1.1 — `bait_mid` fully removes the Wonder gate for all rare-element rods

Under the TARGET bait/tier-removal spec (Task 5, Sheet A + Sheet D), `bait_mid` removes 1 Wonder-gate tier. Applied to `rare_fire`/`rare_water`/`rare_wind`/`rare_electric` (base gate 40W = tier 1), that drops the effective gate to **0W** — meaning any parent using mid bait can fish these rods at any Wonder level at all.

**Ask:** confirm this is intended. If not, either the tier-removal counts need adjusting, or the tier system needs an extra rung between 0 and 40W so `bait_mid` doesn't zero the gate out entirely.

### 1.2 — `bait_premium` drops the epic gate from 90W to 40W

Same mechanism, applied to epic rods (base gate 90W = tier 3, minus 2 tiers = tier 1 = 40W). That's a large accessibility jump for the highest tier.

**Ask:** confirm this is a deliberate design choice.

### 1.3 — "Target frequency" (1 in 15, 1 in 6, etc.) — per catch, or per cast?

Task 5's Sheet C base weights were built assuming these targets mean _per successful catch_. A "per cast" reading would need to also fold in catch% (a separate mechanic), which would change the base weight numbers.

**Ask:** confirm the intended reading so Sheet C's weights don't need re-deriving.

---

## 2. Bugs found in source docs (not introduced by this content pass — pre-existing)

### 2.1 — Lesson `3.7` is never covered by any subscription tier's lesson-access range

`rod_progression_plan.md`'s subscription table lists: Free `1.1–1.3`, Wooden `1.4–3.6`, Fiberglass `4.1–5.6`, Lifetime `All`. Module 3 actually has **7** lessons (`3.1`–`3.7`, confirmed in `moduleRodMap.ts`), not 6. Lesson `3.7` never appears in any range, even added cumulatively — it looks like a copy of the "6 lessons per module" pattern that doesn't hold for module 3.

**Impact:** Fiberglass (and even Wooden-tier-then-Fiberglass) users can never access lesson `3.7`, and therefore can never complete module 3's cluster or craft `rare_wind`, under the doc as written today.

**Suggested fix:** Wooden's range should likely read `1.4–3.7`.

### 2.2 — `CURRENT_ENGINE_SUMMARY.md`'s own precomputed catch-chance table has two internal errors

- **Basic @ 65W** is listed as 70%. Running the actual `ENCOUNTER_RATES` formula gives **65.8%** — 70% is only correct at 90W, where the bonus cap is designed to land exactly.
- **Wildcard @ 90W** is listed as 15%/15%. The bonus cap for this profile is reached at 24W (before the 65W gate even opens), so 65W and 90W _must_ produce the same no-bait figure by construction — the doc's own 65W row correctly says 10%, contradicting its 90W row.

**Impact:** low on its own (Task 2 used the formula-derived values, not the table's), but the source doc should be corrected so the next person reading it doesn't get a different, wrong number.

---

## 3. Documented assumptions — not verified against real code, flag for confirmation

### 3.1 — Journey 6 (premium migrator): no retroactive parts/Wonder on backfill

Assumed that migrating a legacy user with a `completedLessons` map reconciles rod _state_ (e.g. `locked` → `craftable`) from backfilled `lessonProgress`, but does **not** retroactively grant the parts/Wonder the parent would have earned at the time. The migration plan doesn't explicitly say either way.

### 3.2 — Journey 7's `giftSource: journey_gift` field may not be a real schema field

Added to the wildcard-gift Firestore snapshot because the brief's own archetype description calls it out by name, but it doesn't appear in `rod_progression_plan.md`'s actual schema section.

### 3.3 — Diary "deep" vs. "surface" Wonder awards — **locked**

Treat every diary entry as deep (+8 `storedWonder`) plus surface (+2 `currentWonder`) for Journey economy math until product ships an explicit depth mapping. See [`docs/craft-journey-assumptions.md`](../../craft-journey-assumptions.md) and `shared/sanctuary/progression/craftJourneyWonder.ts`.

---

## 4. Plain incomplete items (not open questions — just not done yet)

### 4.1 — Task 3's checkpoint count is 2–3 for Journeys 4 and 5, short of the template's "4–6" target

Journeys 4 (wonder-gated claim) and 5 (locked-rod cast rejection) are naturally single-moment scenarios — a 4th or 5th checkpoint would just repeat an unchanged document. Kept at 2–3 genuinely distinct states rather than padding with duplicates.

**Ask:** confirm this is acceptable, or let us know if padding checkpoints are specifically needed for snapshot-diff tooling.

---

## Reference — which deliverable each item traces back to

| Item          | Deliverable                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------- |
| 1.1, 1.2, 1.3 | `05-probability-tables.md`                                                                     |
| 2.1           | `rod_progression_plan.md` (source doc, not a deliverable we produced)                          |
| 2.2           | `CURRENT_ENGINE_SUMMARY.md` (source doc); values corrected in `02-fishing-outcomes-matrix.csv` |
| 3.1, 3.2, 3.3 | `03-craft-journey-scenarios.md`                                                                |
| 4.1           | `03-craft-journey-scenarios.md`                                                                |
