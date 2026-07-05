import assert from "node:assert/strict";
import test from "node:test";

import {
  DIARY_WONDER_BY_DEPTH,
  DAILY_FISHING_WONDER_CAP,
  PRACTICE_WONDER_BY_KIND,
  WELL_QUESTION_ANSWERED,
  wonderAmountForRule,
} from "./rules";

test("DAILY_FISHING_WONDER_CAP is 10", () => {
  assert.equal(DAILY_FISHING_WONDER_CAP, 10);
});

test("wonderAmountForRule returns fixed amount when min equals max", () => {
  assert.equal(wonderAmountForRule(WELL_QUESTION_ANSWERED, "any-seed"), 12);
});

test("wonderAmountForRule is deterministic for ranged rules", () => {
  const rule = DIARY_WONDER_BY_DEPTH.deep;
  const seed = "uid:lesson1:answer|answer:deep";
  const first = wonderAmountForRule(rule, seed);
  const second = wonderAmountForRule(rule, seed);
  assert.equal(first, second);
  assert.ok(first >= rule.min && first <= rule.max);
});

test("wonderAmountForRule varies by seed within range", () => {
  const rule = PRACTICE_WONDER_BY_KIND.practiced_curiosity;
  const amounts = new Set(
    ["a", "b", "uid:kind:date", "longer-seed-value"].map((seed) => wonderAmountForRule(rule, seed)),
  );
  assert.ok(amounts.size > 1, "expected multiple amounts across seeds");
  for (const amount of amounts) {
    assert.ok(amount >= rule.min && amount <= rule.max);
  }
});
