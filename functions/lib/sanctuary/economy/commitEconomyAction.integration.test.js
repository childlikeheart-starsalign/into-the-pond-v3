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
const types_1 = require("./types");
const idempotency_1 = require("./idempotency");
const UID = "test_uid_atomicity";
function mockRef(path) {
  return {
    path,
    collection: (name) => mockRef(`${path}/${name}`),
    doc: (id) => mockRef(`${path}/${id}`),
  };
}
class MockTransaction {
  constructor(userData = { currentWonder: 10, storedWonder: 5 }) {
    this.writes = [];
    this.idempotencyHits = new Map();
    this.userData = userData;
  }
  seedIdempotency(idempotencyKey, response) {
    const docId = (0, idempotency_1.idempotencyDocId)(idempotencyKey);
    this.idempotencyHits.set(`users/${UID}/economyIdempotency/${docId}`, {
      response,
      ledgerEntryId: "ledger_existing",
    });
  }
  async get(ref) {
    if (ref.path === `users/${UID}`) {
      return { exists: true, data: () => ({ ...this.userData }) };
    }
    if (ref.path.includes("/economyIdempotency/")) {
      const docId = ref.path.split("/").pop() ?? "";
      const hit = [...this.idempotencyHits.entries()].find(([p]) => p.endsWith(`/${docId}`));
      if (hit) {
        return { exists: true, data: () => hit[1] };
      }
    }
    return { exists: false, data: () => undefined };
  }
  set(ref, data) {
    this.writes.push({ path: ref.path, data });
  }
}
function wonderWrites(tx) {
  return tx.writes.filter(
    (w) =>
      w.path.includes("/economyLedger/") ||
      (w.path === `users/${UID}` &&
        ("currentWonder" in w.data || "storedWonder" in w.data || "inventory" in w.data)),
  );
}
(0, node_test_1.default)(
  "commitEconomyAction schedules no writes when build throws INSUFFICIENT_WONDER",
  async () => {
    const userRef = mockRef(`users/${UID}`);
    const tx = new MockTransaction({ currentWonder: 1, storedWonder: 0 });
    await strict_1.default.rejects(
      () =>
        (0, commitEconomyAction_1.commitEconomyAction)({
          tx: tx,
          userRef,
          uid: UID,
          idempotencyKey: "bait_craft:fail_tx",
          actionType: "bait_craft",
          build: ({ account }) => {
            const { account: nextAccount, transaction } = (0,
            applyLedgerEntry_1.applyWonderSpendInMemory)(account, {
              source: "bait_craft",
              amount: 99,
              transactionId: "tx_fail",
              pool: "current",
            });
            const entry = (0, applyLedgerEntry_1.buildEconomyLedgerEntry)({
              uid: UID,
              actionType: "bait_craft",
              source: "bait_craft",
              transaction,
              idempotencyKey: "bait_craft:fail_tx",
            });
            return { entry, nextAccount, response: { ok: true } };
          },
        }),
      (error) => {
        strict_1.default.ok(error instanceof types_1.EconomyError);
        strict_1.default.equal(error.code, "INSUFFICIENT_WONDER");
        return true;
      },
    );
    strict_1.default.equal(wonderWrites(tx).length, 0);
  },
);
(0, node_test_1.default)("commitEconomyAction idempotency hit writes nothing", async () => {
  const userRef = mockRef(`users/${UID}`);
  const tx = new MockTransaction();
  tx.seedIdempotency("practice:2026-06-22:tried_validation", { success: true, wonderAwarded: 5 });
  const result = await (0, commitEconomyAction_1.commitEconomyAction)({
    tx: tx,
    userRef,
    uid: UID,
    idempotencyKey: "practice:2026-06-22:tried_validation",
    actionType: "practice_complete",
    build: () => {
      throw new Error("build should not run on idempotency hit");
    },
  });
  strict_1.default.equal(result.committed, false);
  strict_1.default.equal(wonderWrites(tx).length, 0);
});
(0, node_test_1.default)(
  "commitEconomyAction fresh commit writes user projection and ledger atomically",
  async () => {
    const userRef = mockRef(`users/${UID}`);
    const tx = new MockTransaction({ currentWonder: 10, storedWonder: 5 });
    const result = await (0, commitEconomyAction_1.commitEconomyAction)({
      tx: tx,
      userRef,
      uid: UID,
      idempotencyKey: "practice:2026-06-22:followed_child_lead",
      actionType: "practice_complete",
      build: ({ account }) => {
        const { account: nextAccount, transaction } = (0,
        applyLedgerEntry_1.applyWonderEarnInMemory)(account, {
          source: "practice_completion",
          amount: 3,
          transactionId: "tx_practice",
        });
        const entry = (0, applyLedgerEntry_1.buildEconomyLedgerEntry)({
          uid: UID,
          actionType: "practice_complete",
          source: "practice_completion",
          transaction,
          idempotencyKey: "practice:2026-06-22:followed_child_lead",
        });
        return {
          entry,
          nextAccount,
          response: { success: true, wonderAwarded: 3 },
        };
      },
    });
    strict_1.default.equal(result.committed, true);
    const ledgerWrites = tx.writes.filter((w) => w.path.includes("/economyLedger/"));
    const userWrites = tx.writes.filter((w) => w.path === `users/${UID}`);
    strict_1.default.equal(ledgerWrites.length, 1);
    strict_1.default.equal(userWrites.length, 1);
    strict_1.default.equal(userWrites[0]?.data.currentWonder, 13);
    strict_1.default.equal(ledgerWrites[0]?.data.deltaCurrentWonder, 3);
  },
);
