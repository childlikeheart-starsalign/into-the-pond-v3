import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { resolveChildCheckCta } from "@/src/features/childProfile/resolveChildCheckCta";

describe("resolveChildCheckCta", () => {
  test("missing or invalid display name → Quick Check", () => {
    assert.deepEqual(resolveChildCheckCta(null), {
      kind: "quick_check",
      label: "Begin Quick Check",
    });
    assert.deepEqual(resolveChildCheckCta(undefined), {
      kind: "quick_check",
      label: "Begin Quick Check",
    });
    assert.deepEqual(resolveChildCheckCta(""), {
      kind: "quick_check",
      label: "Begin Quick Check",
    });
    assert.deepEqual(resolveChildCheckCta("Quiet Tester"), {
      kind: "quick_check",
      label: "Begin Quick Check",
    });
  });

  test("known displayArchetypeName → Deep Check", () => {
    assert.deepEqual(resolveChildCheckCta("Storm Child"), {
      kind: "deep_check",
      label: "Begin Deep Check",
    });
    assert.deepEqual(resolveChildCheckCta("Still Pond"), {
      kind: "deep_check",
      label: "Begin Deep Check",
    });
  });
});
