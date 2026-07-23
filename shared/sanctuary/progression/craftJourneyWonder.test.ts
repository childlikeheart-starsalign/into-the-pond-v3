import assert from "node:assert/strict";
import test from "node:test";

import {
  JOURNEY_DIARY_CURRENT_WONDER,
  JOURNEY_DIARY_STORED_WONDER,
  projectJourneyDiaryWonder,
} from "./craftJourneyWonder";

test("3.3 lock: each journey diary is deep (+8 stored) with surface (+2 current)", () => {
  assert.equal(JOURNEY_DIARY_STORED_WONDER, 8);
  assert.equal(JOURNEY_DIARY_CURRENT_WONDER, 2);
});

test("Journey 1 Day 1 — first diary balances", () => {
  assert.deepEqual(projectJourneyDiaryWonder(1), {
    storedWonder: 8,
    currentWonder: 2,
  });
});

test("Journey 1 Day 7 — six diaries before craft spend", () => {
  // Scenario table: +16 → 48 stored / +4 → 12 current after lessons 1.5–1.6 diaries
  assert.deepEqual(projectJourneyDiaryWonder(6), {
    storedWonder: 48,
    currentWonder: 12,
  });
});

test("Journey 3 Day 1 — four diaries in one day", () => {
  assert.deepEqual(projectJourneyDiaryWonder(4), {
    storedWonder: 32,
    currentWonder: 8,
  });
});
