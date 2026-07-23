import assert from "node:assert/strict";
import test from "node:test";

import {
  HARD_CHILD_CAP,
  canAccessChild,
  canCreateNextChild,
  filterAllowedInterests,
  isChildCompanionId,
  resolveAccountTier,
  tierChildLimit,
} from "./tierAccess";

test("canAccessChild(1, *) is true even for free / missing-like free resolution", () => {
  assert.equal(canAccessChild(1, "free"), true);
  assert.equal(canAccessChild(1, "wooden"), true);
  assert.equal(canAccessChild(1, "fiberglass"), true);
  assert.equal(canAccessChild(1, "lifetime"), true);
});

test("resolveAccountTier falls back to free on missing/malformed subscription", () => {
  assert.equal(resolveAccountTier(undefined), "free");
  assert.equal(resolveAccountTier(null), "free");
  assert.equal(resolveAccountTier({}), "free");
  assert.equal(resolveAccountTier({ subscriptionStatus: "nope" }), "free");
  assert.equal(resolveAccountTier({ isLifetime: true }), "lifetime");
  assert.equal(resolveAccountTier({ subscriptionStatus: "wooden" }), "wooden");
});

test("free cannot access childOrder 2; paid can up to 3", () => {
  assert.equal(canAccessChild(2, "free"), false);
  assert.equal(canAccessChild(2, "wooden"), true);
  assert.equal(canAccessChild(3, "fiberglass"), true);
  assert.equal(canAccessChild(4, "lifetime"), false);
});

test("tier limits and hard cap", () => {
  assert.equal(tierChildLimit("free"), 1);
  assert.equal(tierChildLimit("wooden"), 3);
  assert.equal(HARD_CHILD_CAP, 3);
  assert.deepEqual(canCreateNextChild(0, "free"), { ok: true, nextOrder: 1 });
  assert.deepEqual(canCreateNextChild(1, "free"), { ok: false, reason: "tier_limit" });
  assert.deepEqual(canCreateNextChild(3, "lifetime"), { ok: false, reason: "hard_cap" });
  assert.deepEqual(canCreateNextChild(2, "wooden"), { ok: true, nextOrder: 3 });
});

test("companion + interests validation helpers", () => {
  assert.equal(isChildCompanionId("blackbird"), true);
  assert.equal(isChildCompanionId("dragon"), false);
  assert.deepEqual(
    filterAllowedInterests(["curious", "dragon", "gentle", "curious", "playful", "creative"]),
    ["curious", "gentle", "playful"],
  );
});
