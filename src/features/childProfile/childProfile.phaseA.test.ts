import assert from "node:assert/strict";
import test from "node:test";

import { childProfileFlowReducer, createEmptyDraft, createInitialFlowState } from "./flowReducer";
import { resolveActiveChildIdAfterEntitlement } from "./resolveActiveChildId";
import { resolveHeaderChildName } from "./dualRead";
import type { ChildrenSummaryEntry } from "./types";
import { ChildLimitReachedError, isChildLimitReachedError } from "./childLimitReached";

test("draftId is fixed for flow instance across Review re-entry", () => {
  const initial = createInitialFlowState("first_run", "draft_fixed_1");
  assert.equal(initial.draftId, "draft_fixed_1");

  let state = childProfileFlowReducer(initial, {
    type: "ADVANCE",
    patch: { name: "Mira" },
  });
  state = childProfileFlowReducer(state, {
    type: "ADVANCE",
    patch: { dob: "2018-06-01" },
  });
  state = childProfileFlowReducer(state, {
    type: "ADVANCE",
    patch: { companionId: "blackbird" },
  });
  state = childProfileFlowReducer(state, { type: "ENTER_REVIEW" });
  assert.equal(state.step, "reviewing");
  assert.equal(state.draftId, "draft_fixed_1");

  state = childProfileFlowReducer(state, { type: "BACK" });
  assert.equal(state.step, "interests");
  assert.equal(state.draftId, "draft_fixed_1");

  state = childProfileFlowReducer(state, { type: "ENTER_REVIEW" });
  assert.equal(state.step, "reviewing");
  assert.equal(state.draftId, "draft_fixed_1");
});

test("ENTER_REVIEW with missing name (add_child path) routes to name step", () => {
  const state = childProfileFlowReducer(
    {
      step: "interests",
      draft: {
        name: "",
        dob: "2018-06-01",
        companionId: "blackbird",
        interests: [],
      },
      draftId: "draft_a",
    },
    { type: "ENTER_REVIEW" },
  );
  assert.equal(state.step, "name");
  assert.equal(state.draftId, "draft_a");
});

test("ENTER_REVIEW with complete draft enters reviewing", () => {
  const state = childProfileFlowReducer(
    {
      step: "interests",
      draft: {
        name: "Mira",
        dob: "2018-06-01",
        companionId: "blackbird",
        interests: ["curious"],
      },
      draftId: "draft_b",
    },
    { type: "ENTER_REVIEW" },
  );
  assert.equal(state.step, "reviewing");
  if (state.step === "reviewing") {
    assert.equal(state.draftId, "draft_b");
    assert.equal(state.draft.name, "Mira");
  }
});

test("SEAL_LIMIT_REACHED is distinct from network error retry", () => {
  let state = childProfileFlowReducer(
    {
      step: "reviewing",
      draft: {
        name: "Mira",
        dob: "2018-06-01",
        companionId: "goldfinch",
        interests: [],
      },
      draftId: "draft_c",
    },
    { type: "SEAL", startedAt: 1 },
  );
  state = childProfileFlowReducer(state, { type: "SEAL_LIMIT_REACHED" });
  assert.equal(state.step, "limit_reached");
  assert.ok(isChildLimitReachedError(new ChildLimitReachedError()));
});

test("SEAL_SUCCESS from sealing yields confirmed", () => {
  let state = childProfileFlowReducer(
    {
      step: "reviewing",
      draft: {
        name: "Mira",
        dob: "2018-06-01",
        companionId: "goldfinch",
        interests: [],
      },
      draftId: "draft_c",
    },
    { type: "SEAL", startedAt: 1 },
  );
  state = childProfileFlowReducer(state, {
    type: "SEAL_SUCCESS",
    childId: "child_1",
    childOrder: 1,
  });
  assert.equal(state.step, "confirmed");
  if (state.step === "confirmed") {
    assert.equal(state.childId, "child_1");
  }
});

test("createEmptyDraft starts blank", () => {
  assert.deepEqual(createEmptyDraft(), {
    name: "",
    dob: "",
    companionId: null,
    interests: [],
  });
});

test("downgrade: activeChildId on child #2 falls back to childOrder 1", () => {
  const summary: ChildrenSummaryEntry[] = [
    { childId: "c1", name: "One", companionId: "blackbird", childOrder: 1 },
    { childId: "c2", name: "Two", companionId: "butterfly", childOrder: 2 },
  ];
  const resolved = resolveActiveChildIdAfterEntitlement("c2", summary, {
    subscriptionStatus: "free",
    isLifetime: false,
  });
  assert.equal(resolved, "c1");
});

test("downgrade: accessible child #2 stays selected on wooden", () => {
  const summary: ChildrenSummaryEntry[] = [
    { childId: "c1", name: "One", companionId: "blackbird", childOrder: 1 },
    { childId: "c2", name: "Two", companionId: "butterfly", childOrder: 2 },
  ];
  const resolved = resolveActiveChildIdAfterEntitlement("c2", summary, {
    subscriptionStatus: "wooden",
    isLifetime: false,
  });
  assert.equal(resolved, "c2");
});

test("header name prefers active child from summary", () => {
  const name = resolveHeaderChildName({
    summary: [
      { childId: "c1", name: "Mira", companionId: "blackbird", childOrder: 1 },
      { childId: "c2", name: "Leo", companionId: "goldfinch", childOrder: 2 },
    ],
    activeChildId: "c2",
    legacyDisplayName: "Parent",
  });
  assert.equal(name, "Leo");
});
