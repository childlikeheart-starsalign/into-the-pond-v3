import assert from "node:assert/strict";
import test from "node:test";

import { evaluateFeatureFlag, parseFeatureFlagDoc } from "./evaluateFeatureFlag";

const UID = "dev_uid_1";
const OTHER = "other_uid";

test("rolloutState off → false for every uid, including allowlistUids", () => {
  assert.equal(
    evaluateFeatureFlag({ rolloutState: "off", allowlistUids: [UID, OTHER] }, UID),
    false,
  );
  assert.equal(evaluateFeatureFlag({ rolloutState: "off", allowlistUids: [UID] }, OTHER), false);
});

test("rolloutState allowlist → true only for listed uids", () => {
  const flag = { rolloutState: "allowlist" as const, allowlistUids: [UID] };
  assert.equal(evaluateFeatureFlag(flag, UID), true);
  assert.equal(evaluateFeatureFlag(flag, OTHER), false);
  assert.equal(evaluateFeatureFlag(flag, null), false);
  assert.equal(evaluateFeatureFlag(flag, ""), false);
});

test("rolloutState all → true for every uid", () => {
  const flag = { rolloutState: "all" as const, allowlistUids: [] };
  assert.equal(evaluateFeatureFlag(flag, UID), true);
  assert.equal(evaluateFeatureFlag(flag, OTHER), true);
  assert.equal(evaluateFeatureFlag(flag, null), false);
});

test("missing or invalid flag doc → false", () => {
  assert.equal(evaluateFeatureFlag(null, UID), false);
  assert.equal(evaluateFeatureFlag(undefined, UID), false);
  assert.equal(evaluateFeatureFlag(parseFeatureFlagDoc({ rolloutState: "nope" }), UID), false);
});

test("parseFeatureFlagDoc keeps string allowlist entries only", () => {
  const parsed = parseFeatureFlagDoc({
    rolloutState: "allowlist",
    allowlistUids: [UID, 1, null, OTHER],
  });
  assert.deepEqual(parsed, {
    rolloutState: "allowlist",
    allowlistUids: [UID, OTHER],
  });
});
