import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ageYearsFromDob,
  buildChildrenSummaryEntry,
  formatLastExploredLabel,
  stampLastVisited,
} from "./childrenSummary";

test("ageYearsFromDob computes full years", () => {
  const today = new Date(2026, 6, 16); // Jul 16 2026
  assert.equal(ageYearsFromDob("2020-07-16", today), 6);
  assert.equal(ageYearsFromDob("2020-07-17", today), 5);
  assert.equal(ageYearsFromDob("not-a-date", today), null);
});

test("buildChildrenSummaryEntry fills optional identity fields", () => {
  const entry = buildChildrenSummaryEntry({
    childId: "c1",
    name: "Oliver",
    companionId: "blackbird",
    childOrder: 1,
    displayArchetypeName: "Storm Child",
    dob: "2020-01-01",
    lastVisitedAt: "2026-07-15T20:00:00.000Z",
    today: new Date(2026, 6, 16),
  });
  assert.equal(entry.displayArchetypeName, "Storm Child");
  assert.equal(entry.ageYears, 6);
  assert.equal(entry.lastVisitedAt, "2026-07-15T20:00:00.000Z");
});

test("formatLastExploredLabel uses warm relative phrases", () => {
  const now = new Date(2026, 6, 16, 15, 0, 0); // Thu afternoon
  assert.equal(
    formatLastExploredLabel(new Date(2026, 6, 16, 9, 0, 0).toISOString(), now),
    "This morning",
  );
  assert.equal(
    formatLastExploredLabel(new Date(2026, 6, 15, 20, 0, 0).toISOString(), now),
    "Yesterday evening",
  );
  assert.equal(formatLastExploredLabel(null, now), null);
});

test("stampLastVisited updates only the selected child", () => {
  const summary = [
    {
      childId: "c1",
      name: "A",
      companionId: "blackbird" as const,
      childOrder: 1,
      lastVisitedAt: null,
    },
    {
      childId: "c2",
      name: "B",
      companionId: "butterfly" as const,
      childOrder: 2,
      lastVisitedAt: "old",
    },
  ];
  const next = stampLastVisited(summary, "c1", "now");
  assert.equal(next[0].lastVisitedAt, "now");
  assert.equal(next[1].lastVisitedAt, "old");
});
