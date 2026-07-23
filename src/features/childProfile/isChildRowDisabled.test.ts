import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { isChildRowDisabled } from "@/src/features/childProfile/isChildRowDisabled";

describe("isChildRowDisabled", () => {
  test("inaccessible always disabled", () => {
    assert.equal(
      isChildRowDisabled({
        accessible: false,
        switchingBlocked: false,
        isActive: false,
        childResultPeekEnabled: true,
      }),
      true,
    );
  });

  test("switchingBlocked always disabled", () => {
    assert.equal(
      isChildRowDisabled({
        accessible: true,
        switchingBlocked: true,
        isActive: false,
        childResultPeekEnabled: true,
      }),
      true,
    );
  });

  test("flag off: active row disabled (production parity)", () => {
    assert.equal(
      isChildRowDisabled({
        accessible: true,
        switchingBlocked: false,
        isActive: true,
        childResultPeekEnabled: false,
      }),
      true,
    );
  });

  test("flag on: active row enabled for peek", () => {
    assert.equal(
      isChildRowDisabled({
        accessible: true,
        switchingBlocked: false,
        isActive: true,
        childResultPeekEnabled: true,
      }),
      false,
    );
  });

  test("flag off: non-active accessible row enabled", () => {
    assert.equal(
      isChildRowDisabled({
        accessible: true,
        switchingBlocked: false,
        isActive: false,
        childResultPeekEnabled: false,
      }),
      false,
    );
  });
});
