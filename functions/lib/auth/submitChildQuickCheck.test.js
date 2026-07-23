"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const https_1 = require("firebase-functions/v2/https");
const submitChildQuickCheck_1 = require("./submitChildQuickCheck");
(0, node_test_1.describe)("validateAndScoreQuickCheckTally", () => {
  (0, node_test_1.test)("scores a full valid tally", () => {
    const { scored } = (0, submitChildQuickCheck_1.validateAndScoreQuickCheckTally)([
      "storm",
      "storm",
      "storm",
      "wall",
      "spark",
    ]);
    strict_1.default.equal(scored.primaryArchetype, "storm");
    strict_1.default.equal(scored.displayArchetypeName, "Storm Child");
    strict_1.default.equal(scored.tieOccurred, false);
  });
  (0, node_test_1.test)("rejects wrong length", () => {
    strict_1.default.throws(
      () => (0, submitChildQuickCheck_1.validateAndScoreQuickCheckTally)(["storm"]),
      (err) => err instanceof https_1.HttpsError && err.code === "invalid-argument",
    );
  });
  (0, node_test_1.test)("rejects invalid archetype entries", () => {
    strict_1.default.throws(
      () =>
        (0, submitChildQuickCheck_1.validateAndScoreQuickCheckTally)([
          "storm",
          "wall",
          "spark",
          "storm",
          "not-a-path",
        ]),
      (err) => err instanceof https_1.HttpsError && err.code === "invalid-argument",
    );
  });
});
