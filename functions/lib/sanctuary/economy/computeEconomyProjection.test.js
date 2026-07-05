"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const computeEconomyProjection_1 = require("./computeEconomyProjection");
const foldLedger_1 = require("./foldLedger");
const compactionConstants_1 = require("./compactionConstants");
const types_1 = require("./types");
const UID = "ledger_cap_uid";
function mockRef(path) {
  return {
    path,
    collection: (name) => {
      const collectionPath = `${path}/${name}`;
      if (name === "economyLedger") {
        return mockLedgerCollection(collectionPath);
      }
      return mockRef(collectionPath);
    },
    doc: (id) => mockRef(`${path}/${id}`),
  };
}
function mockLedgerCollection(path) {
  const ref = mockRef(path);
  return Object.assign(ref, {
    where: (_field, _op, value) => ({
      orderBy: (_field, _dir) => ({
        _isLedgerTailQuery: true,
        ledgerPath: path,
        minTimestampExclusive: value,
      }),
    }),
  });
}
function ledgerEntry(index) {
  return {
    id: `entry_${String(index).padStart(4, "0")}`,
    uid: UID,
    timestamp: 1_700_000_000_000 + index,
    actionType: "practice_complete",
    source: "practice_completion",
    deltaCurrentWonder: 1,
    deltaStoredWonder: 1,
    deltaParts: 0,
    deltaMaterials: {},
    idempotencyKey: `practice:${index}`,
    metadata: {},
    schemaVersion: 1,
  };
}
class LedgerCapTransaction {
  constructor() {
    this.ledger = new Map();
    this.checkpoint = null;
  }
  seedEntries(count) {
    for (let i = 1; i <= count; i += 1) {
      const entry = ledgerEntry(i);
      this.ledger.set(entry.id, entry);
    }
  }
  async get(ref) {
    if ("_isLedgerTailQuery" in ref) {
      const entries = [...this.ledger.values()]
        .filter((entry) => entry.timestamp > ref.minTimestampExclusive)
        .sort((a, b) => a.timestamp - b.timestamp);
      const docs = entries.map((entry) => ({ id: entry.id, data: () => entry }));
      return { size: docs.length, docs, empty: docs.length === 0 };
    }
    if (ref.path === `users/${UID}/economyLedger`) {
      const docs = [...this.ledger.values()].map((entry) => ({
        id: entry.id,
        data: () => entry,
      }));
      return { size: docs.length, docs, empty: docs.length === 0 };
    }
    if (
      ref.path ===
      `users/${UID}/economyLedgerCheckpoint/${types_1.ECONOMY_LEDGER_CHECKPOINT_DOC_ID}`
    ) {
      return {
        exists: this.checkpoint !== null,
        data: () => this.checkpoint ?? undefined,
      };
    }
    return { exists: false, data: () => undefined };
  }
}
(0, node_test_1.default)(
  "computeEconomyProjectionInTransaction throws LEDGER_READ_LIMIT without checkpoint at 450+ entries",
  async () => {
    const tx = new LedgerCapTransaction();
    tx.seedEntries(computeEconomyProjection_1.MAX_LEDGER_READS_PER_TX);
    const userRef = mockRef(`users/${UID}`);
    const pending = ledgerEntry(9999);
    await strict_1.default.rejects(
      () =>
        (0, computeEconomyProjection_1.computeEconomyProjectionInTransaction)(tx, userRef, pending),
      (error) => {
        strict_1.default.ok(error instanceof types_1.EconomyError);
        strict_1.default.equal(error.code, "LEDGER_READ_LIMIT");
        return true;
      },
    );
  },
);
(0, node_test_1.default)(
  "computeEconomyProjectionInTransaction succeeds with checkpoint + tail for 500 entries",
  async () => {
    const tx = new LedgerCapTransaction();
    tx.seedEntries(500);
    const sorted = (0, foldLedger_1.sortLedgerEntriesByTimestamp)([...tx.ledger.values()]);
    tx.checkpoint = (0, foldLedger_1.buildCheckpointFromSortedEntries)(
      sorted,
      compactionConstants_1.COMPACT_KEEP_TAIL_ENTRIES,
      "admin",
    );
    strict_1.default.ok(tx.checkpoint);
    const userRef = mockRef(`users/${UID}`);
    const pending = ledgerEntry(9999);
    const { projection, meta } = await (0,
    computeEconomyProjection_1.computeEconomyProjectionInTransaction)(tx, userRef, pending);
    strict_1.default.equal(meta.usedCheckpoint, true);
    strict_1.default.equal(meta.tailEntryCount, compactionConstants_1.COMPACT_KEEP_TAIL_ENTRIES);
    strict_1.default.ok(projection.currentWonder > 0);
  },
);
(0, node_test_1.default)(
  "computeEconomyProjectionInTransaction throws when tail exceeds COMPACT_TAIL_HARD_LIMIT",
  async () => {
    const tx = new LedgerCapTransaction();
    tx.seedEntries(computeEconomyProjection_1.COMPACT_TAIL_HARD_LIMIT);
    tx.checkpoint = {
      schemaVersion: 1,
      foldedThroughTimestamp: 0,
      foldedThroughEntryId: "none",
      foldedEntryCount: 0,
      foldSums: {
        currentWonder: 0,
        storedWonder: 0,
        parts: 0,
        feather: 0,
        scale: 0,
        glimmerdust: 0,
      },
      lifetimeWonderEarned: 0,
      compactedAt: Date.now(),
      compactedBy: "admin",
    };
    const userRef = mockRef(`users/${UID}`);
    const pending = ledgerEntry(9999);
    await strict_1.default.rejects(
      () =>
        (0, computeEconomyProjection_1.computeEconomyProjectionInTransaction)(tx, userRef, pending),
      (error) => {
        strict_1.default.ok(error instanceof types_1.EconomyError);
        strict_1.default.equal(error.code, "LEDGER_READ_LIMIT");
        return true;
      },
    );
  },
);
