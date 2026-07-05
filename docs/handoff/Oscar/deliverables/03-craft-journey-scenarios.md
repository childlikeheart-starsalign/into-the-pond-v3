# Craft progression test scenarios

Complete **8 journeys** below. For each checkpoint, paste a **Firestore-shaped JSON snapshot** (user doc + relevant `playerRods` + `lessonProgress` as needed).

**Economy reminders:** +1 part per lesson; +5 cluster bonus; craft costs in `craftCosts.ts`; diary Wonder 2–8 to both pools; craft spends **storedWonder** only.

---

## Journey 1 — Steady Module 1 finisher

**Archetype:** Completes lessons 1.1–1.6, crafts and equips `rare_fire`.

| Day | Narrative (what the parent did) | Parts | storedWonder | currentWonder | Notes |
| --- | ------------------------------- | ----- | ------------ | ------------- | ----- |
| 1   |                                 |       |              |               |       |
| 4   |                                 |       |              |               |       |
| 7   |                                 |       |              |               |       |
| 8   |                                 |       |              |               |       |

### Firestore snapshots

#### Checkpoint A — Day \_\_\_

```json
// users/{uid}
{}

// users/{uid}/playerRods/...
```

#### Checkpoint B — Day \_\_\_

```json

```

---

## Journey 2 — Abandons mid-craft

**Archetype:** Starts `rare_water` craft, does not return for 10+ days. Rod should end `ready` on bench; parent never collects.

| Day | Narrative | Parts | storedWonder | currentWonder | Notes |
| --- | --------- | ----- | ------------ | ------------- | ----- |
|     |           |       |              |               |       |

### Firestore snapshots

_(repeat checkpoint blocks)_

---

## Journey 3 — Collects very late

**Archetype:** Timer completes Day 3; parent collects Day 12+.

| Day | Narrative | Parts | storedWonder | currentWonder | Notes |
| --- | --------- | ----- | ------------ | ------------- | ----- |
|     |           |       |              |               |       |

### Firestore snapshots

---

## Journey 4 — Wonder gate fisher

**Archetype:** Owns `rare_fire` (equipped) but `currentWonder` too low; claim returns `wonder_gate` miss.

| Day | Narrative | Parts | storedWonder | currentWonder | Notes |
| --- | --------- | ----- | ------------ | ------------- | ----- |
|     |           |       |              |               |       |

### Firestore snapshots

---

## Journey 5 — Cast with locked rod

**Archetype:** Attempts `createCast` with rod still `locked` → server rejection.

| Day | Narrative | Parts | storedWonder | currentWonder | Notes |
| --- | --------- | ----- | ------------ | ------------- | ----- |
|     |           |       |              |               |       |

### Firestore snapshots

---

## Journey 6 — Premium migrator

**Archetype:** Existing user with `completedLessons` / backfill; rods reconcile to correct states.

| Day | Narrative | Parts | storedWonder | currentWonder | Notes |
| --- | --------- | ----- | ------------ | ------------- | ----- |
|     |           |       |              |               |       |

### Firestore snapshots

---

## Journey 7 — Wildcard journey gift

**Archetype:** All four element rares in hand → `rare_wildcard` becomes `ready` with `giftSource: journey_gift` → equip.

| Day | Narrative | Parts | storedWonder | currentWonder | Notes |
| --- | --------- | ----- | ------------ | ------------- | ----- |
|     |           |       |              |               |       |

### Firestore snapshots

---

## Journey 8 — Epic post-curriculum

**Archetype:** All 31 lessons complete, `rare_fire` in hand, crafts `epic_fire`.

| Day | Narrative | Parts | storedWonder | currentWonder | Notes |
| --- | --------- | ----- | ------------ | ------------- | ----- |
|     |           |       |              |               |       |

### Firestore snapshots

---

## Submission checklist

- [ ] 8 journeys with day-by-day narrative
- [ ] Parts/Wonder math shown at each step
- [ ] 4–6 Firestore checkpoints per journey
- [ ] Wildcard journey skips `crafting` state
- [ ] Journey 5 documents expected error (no `activeCast`)
