import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { HttpsError } from "firebase-functions/v2/https";

import { validateAndScoreQuickCheckTally } from "./submitChildQuickCheck";

describe("validateAndScoreQuickCheckTally", () => {
  test("scores a full valid tally", () => {
    const { scored } = validateAndScoreQuickCheckTally([
      "storm",
      "storm",
      "storm",
      "wall",
      "spark",
    ]);
    assert.equal(scored.primaryArchetype, "storm");
    assert.equal(scored.displayArchetypeName, "Storm Child");
    assert.equal(scored.tieOccurred, false);
  });

  test("rejects wrong length", () => {
    assert.throws(
      () => validateAndScoreQuickCheckTally(["storm"]),
      (err: unknown) => err instanceof HttpsError && err.code === "invalid-argument",
    );
  });

  test("rejects invalid archetype entries", () => {
    assert.throws(
      () => validateAndScoreQuickCheckTally(["storm", "wall", "spark", "storm", "not-a-path"]),
      (err: unknown) => err instanceof HttpsError && err.code === "invalid-argument",
    );
  });
});
