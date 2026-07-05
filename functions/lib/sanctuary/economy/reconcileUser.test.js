"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const reconcileUser_1 = require("./reconcileUser");
function ledgerEntry(overrides) {
  return {
    id: "ledger_1",
    uid: "user_a",
    timestamp: Date.now(),
    actionType: "lesson_complete",
    source: "practice_completion",
    deltaCurrentWonder: 0,
    deltaStoredWonder: 0,
    deltaParts: 0,
    deltaMaterials: {},
    idempotencyKey: "lesson:1",
    metadata: {},
    schemaVersion: 1,
    ...overrides,
  };
}
(0, node_test_1.default)("foldLedgerEntries sums wonder, parts, and materials", () => {
  const sums = (0, reconcileUser_1.foldLedgerEntries)([
    ledgerEntry({
      deltaCurrentWonder: 5,
      deltaParts: 2,
      deltaMaterials: { feather: 1 },
    }),
    ledgerEntry({
      id: "e2",
      actionType: "craft_start",
      source: "rod_craft_investment",
      deltaStoredWonder: -10,
      deltaParts: -3,
      deltaMaterials: { scale: 2, glimmerdust: 1 },
    }),
  ]);
  strict_1.default.deepEqual(sums, {
    currentWonder: 5,
    storedWonder: -10,
    parts: -1,
    feather: 1,
    scale: 2,
    glimmerdust: 1,
  });
});
(0, node_test_1.default)(
  "buildReconcileReport detects drift when user doc exceeds ledger sums",
  () => {
    const entries = [
      ledgerEntry({ deltaCurrentWonder: 5, deltaStoredWonder: -10, deltaParts: -1 }),
    ];
    const emptyBaits = {
      feather_bait: 0,
      scale_bait: 0,
      glimmerdust_bait: 0,
      random_bait: 0,
    };
    const report = (0, reconcileUser_1.buildReconcileReport)(
      "user_a",
      (0, reconcileUser_1.foldLedgerEntries)(entries),
      entries.length,
      {
        currentWonder: 5,
        storedWonder: 90,
        parts: -1,
        feather: 0,
        scale: 0,
        glimmerdust: 0,
        lifetimeWonderEarned: 5,
        baits: emptyBaits,
      },
      5,
      emptyBaits,
    );
    strict_1.default.equal(report.hasDrift, true);
    strict_1.default.equal(report.drift.storedWonder, 100);
  },
);
(0, node_test_1.default)("buildReconcileReport hasDrift false when aggregates match", () => {
  const entries = [
    ledgerEntry({
      deltaCurrentWonder: 12,
      deltaStoredWonder: 0,
      deltaParts: 3,
      deltaMaterials: { feather: 2 },
    }),
  ];
  const emptyBaits = {
    feather_bait: 0,
    scale_bait: 0,
    glimmerdust_bait: 0,
    random_bait: 0,
  };
  const report = (0, reconcileUser_1.buildReconcileReport)(
    "user_a",
    (0, reconcileUser_1.foldLedgerEntries)(entries),
    entries.length,
    {
      currentWonder: 12,
      storedWonder: 0,
      parts: 3,
      feather: 2,
      scale: 0,
      glimmerdust: 0,
      lifetimeWonderEarned: 12,
      baits: emptyBaits,
    },
    12,
    emptyBaits,
  );
  strict_1.default.equal(report.hasDrift, false);
});
(0, node_test_1.default)("buildReconcileReport detects lifetimeWonderEarned drift", () => {
  const entries = [ledgerEntry({ deltaCurrentWonder: 8, deltaStoredWonder: 2 })];
  const emptyBaits = {
    feather_bait: 0,
    scale_bait: 0,
    glimmerdust_bait: 0,
    random_bait: 0,
  };
  const report = (0, reconcileUser_1.buildReconcileReport)(
    "user_a",
    (0, reconcileUser_1.foldLedgerEntries)(entries),
    entries.length,
    {
      currentWonder: 8,
      storedWonder: 2,
      parts: 0,
      feather: 0,
      scale: 0,
      glimmerdust: 0,
      lifetimeWonderEarned: 5,
      baits: emptyBaits,
    },
    10,
    emptyBaits,
  );
  strict_1.default.equal(report.hasDrift, true);
  strict_1.default.equal(report.drift.lifetimeWonderEarned, -5);
});
(0, node_test_1.default)("buildReconcileReport detects bait inventory drift", () => {
  const entries = [
    ledgerEntry({
      actionType: "bait_craft",
      source: "bait_craft",
      metadata: { baitKey: "feather_bait" },
    }),
  ];
  const ledgerBaits = {
    feather_bait: 1,
    scale_bait: 0,
    glimmerdust_bait: 0,
    random_bait: 0,
  };
  const userBaits = {
    feather_bait: 0,
    scale_bait: 0,
    glimmerdust_bait: 0,
    random_bait: 0,
  };
  const report = (0, reconcileUser_1.buildReconcileReport)(
    "user_a",
    (0, reconcileUser_1.foldLedgerEntries)(entries),
    entries.length,
    {
      currentWonder: 0,
      storedWonder: 0,
      parts: 0,
      feather: 0,
      scale: 0,
      glimmerdust: 0,
      lifetimeWonderEarned: 0,
      baits: userBaits,
    },
    0,
    ledgerBaits,
  );
  strict_1.default.equal(report.hasDrift, true);
  strict_1.default.equal(report.drift.baits.feather_bait, -1);
});
