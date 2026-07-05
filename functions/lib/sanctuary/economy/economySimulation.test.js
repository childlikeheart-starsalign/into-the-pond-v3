"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const commitEconomyAction_1 = require("./commitEconomyAction");
const applyLedgerEntry_1 = require("./applyLedgerEntry");
const foldLedger_1 = require("./foldLedger");
const UID = "sim_uid";
function emptyAccount(overrides) {
  return {
    userId: UID,
    currentWonder: 0,
    storedWonder: 0,
    lifetimeWonderEarned: 0,
    updatedAt: Date.now(),
    ...overrides,
  };
}
function mockRef(path) {
  return {
    path,
    collection: (name) => mockRef(`${path}/${name}`),
    doc: (id) => mockRef(`${path}/${id}`),
  };
}
class SimTransaction {
  constructor(userData = {}) {
    this.writes = [];
    this.ledger = new Map();
    this.userData = { ...userData };
  }
  seedLedger(entry) {
    this.ledger.set(entry.id, entry);
  }
  getLedgerEntries() {
    return [...this.ledger.values()];
  }
  async get(ref) {
    if (ref.path === `users/${UID}`) {
      return { exists: true, data: () => ({ ...this.userData }) };
    }
    if (ref.path === `users/${UID}/economyLedger`) {
      const docs = [...this.ledger.values()].map((entry) => ({
        id: entry.id,
        data: () => entry,
      }));
      return { size: docs.length, docs, empty: docs.length === 0 };
    }
    if (ref.path.includes("/economyIdempotency/")) {
      return { exists: false, data: () => undefined };
    }
    return { exists: false, data: () => undefined };
  }
  set(ref, data, _opts) {
    this.writes.push({ path: ref.path, data });
    if (ref.path.includes("/economyLedger/")) {
      const id = ref.path.split("/").pop() ?? "";
      this.ledger.set(id, data);
    }
    if (ref.path === `users/${UID}`) {
      this.userData = { ...this.userData, ...data };
    }
  }
}
function ledgerEntriesFromTx(tx) {
  return tx.getLedgerEntries();
}
function assertUserMatchesLedgerFold(tx) {
  const entries = ledgerEntriesFromTx(tx);
  const projection = (0, foldLedger_1.projectionFromLedgerEntries)(entries);
  const inventory = tx.userData.inventory ?? {};
  strict_1.default.equal(tx.userData.currentWonder, projection.currentWonder);
  strict_1.default.equal(tx.userData.storedWonder, projection.storedWonder);
  strict_1.default.equal(tx.userData.lifetimeWonderEarned, projection.lifetimeWonderEarned);
  strict_1.default.equal(tx.userData.totalWonder, projection.totalWonder);
  strict_1.default.equal(inventory.parts ?? 0, projection.parts);
  strict_1.default.equal(inventory.baitMaterials?.feather ?? 0, projection.baitMaterials.feather);
  strict_1.default.equal(inventory.baitMaterials?.scale ?? 0, projection.baitMaterials.scale);
  strict_1.default.equal(
    inventory.baitMaterials?.glimmerdust ?? 0,
    projection.baitMaterials.glimmerdust,
  );
}
(0, node_test_1.default)(
  "economy simulation: randomized earn/spend sequence keeps user doc aligned with ledger fold",
  async () => {
    const userRef = mockRef(`users/${UID}`);
    const tx = new SimTransaction({
      currentWonder: 0,
      storedWonder: 0,
      inventory: { parts: 0, baitMaterials: { feather: 0, scale: 0, glimmerdust: 0 } },
    });
    const actions = [
      { type: "earn", amount: 12, key: "practice:sim:1" },
      { type: "earn", amount: 8, key: "well_answer:sim:1" },
      { type: "spend", amount: 5, key: "bait_craft:sim:1", pool: "current" },
      { type: "earn", amount: 3, key: "diary:sim:1" },
      { type: "parts", delta: 4, key: "lesson_complete:sim:1", wonder: 6 },
      { type: "materials", feather: 2, key: "fishing_claim:sim:1" },
    ];
    let seq = 0;
    for (const action of actions) {
      seq += 1;
      const account = emptyAccount({
        currentWonder: tx.userData.currentWonder ?? 0,
        storedWonder: tx.userData.storedWonder ?? 0,
        lifetimeWonderEarned: tx.userData.lifetimeWonderEarned ?? 0,
      });
      await (0, commitEconomyAction_1.commitEconomyAction)({
        tx: tx,
        userRef,
        uid: UID,
        idempotencyKey: action.key,
        actionType:
          action.type === "parts"
            ? "lesson_complete"
            : action.type === "materials"
              ? "fishing_claim"
              : action.type === "spend"
                ? "bait_craft"
                : "practice_complete",
        build: () => {
          if (action.type === "earn") {
            const { transaction } = (0, applyLedgerEntry_1.applyWonderEarnInMemory)(account, {
              source: "practice_completion",
              amount: action.amount,
              transactionId: `tx_sim_${seq}`,
            });
            return {
              entry: (0, applyLedgerEntry_1.buildEconomyLedgerEntry)({
                uid: UID,
                actionType: "practice_complete",
                source: "practice_completion",
                transaction,
                idempotencyKey: action.key,
              }),
              response: { ok: true },
            };
          }
          if (action.type === "spend") {
            const { transaction } = (0, applyLedgerEntry_1.applyWonderSpendInMemory)(account, {
              source: "bait_craft",
              amount: action.amount,
              transactionId: `tx_sim_${seq}`,
              pool: action.pool,
            });
            return {
              entry: (0, applyLedgerEntry_1.buildEconomyLedgerEntry)({
                uid: UID,
                actionType: "bait_craft",
                source: "bait_craft",
                transaction,
                idempotencyKey: action.key,
              }),
              response: { ok: true },
            };
          }
          if (action.type === "parts") {
            const { transaction } = (0, applyLedgerEntry_1.applyWonderEarnInMemory)(account, {
              source: "diary_deep_reflection",
              amount: action.wonder,
              transactionId: `tx_sim_${seq}`,
            });
            return {
              entry: (0, applyLedgerEntry_1.buildEconomyLedgerEntry)({
                uid: UID,
                actionType: "lesson_complete",
                source: "diary_deep_reflection",
                transaction,
                idempotencyKey: action.key,
                deltaParts: action.delta,
              }),
              response: { ok: true },
            };
          }
          return {
            entry: (0, applyLedgerEntry_1.buildEconomyLedgerEntry)({
              uid: UID,
              actionType: "fishing_claim",
              source: "fishing_catch",
              transaction: {
                id: `tx_sim_${seq}`,
                userId: UID,
                timestamp: Date.now(),
                source: "fishing_catch",
                amount: 0,
                metadata: {},
              },
              idempotencyKey: action.key,
              deltaMaterials: { feather: action.feather },
            }),
            response: { ok: true },
          };
        },
      });
      assertUserMatchesLedgerFold(tx);
    }
    const sums = (0, foldLedger_1.foldLedgerEntries)(ledgerEntriesFromTx(tx));
    strict_1.default.equal(sums.currentWonder, tx.userData.currentWonder);
    strict_1.default.equal(sums.parts, tx.userData.inventory.parts ?? 0);
  },
);
