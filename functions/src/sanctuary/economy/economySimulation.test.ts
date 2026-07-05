import assert from "node:assert/strict";
import test from "node:test";

import { commitEconomyAction } from "./commitEconomyAction";
import {
  applyWonderEarnInMemory,
  applyWonderSpendInMemory,
  buildEconomyLedgerEntry,
} from "./applyLedgerEntry";
import { foldLedgerEntries, projectionFromLedgerEntries } from "./foldLedger";
import type { EconomyLedgerEntry } from "./types";
import type { WonderAccount } from "../types";

const UID = "sim_uid";

function emptyAccount(overrides?: Partial<WonderAccount>): WonderAccount {
  return {
    userId: UID,
    currentWonder: 0,
    storedWonder: 0,
    lifetimeWonderEarned: 0,
    updatedAt: Date.now(),
    ...overrides,
  };
}

type MockDocRef = {
  path: string;
  collection: (name: string) => MockDocRef;
  doc: (id: string) => MockDocRef;
};

function mockRef(path: string): MockDocRef {
  return {
    path,
    collection: (name: string) => mockRef(`${path}/${name}`),
    doc: (id: string) => mockRef(`${path}/${id}`),
  };
}

class SimTransaction {
  readonly writes: { path: string; data: Record<string, unknown> }[] = [];
  private readonly ledger = new Map<string, EconomyLedgerEntry>();
  userData: Record<string, unknown>;

  constructor(userData: Record<string, unknown> = {}) {
    this.userData = { ...userData };
  }

  seedLedger(entry: EconomyLedgerEntry) {
    this.ledger.set(entry.id, entry);
  }

  getLedgerEntries(): EconomyLedgerEntry[] {
    return [...this.ledger.values()];
  }

  async get(ref: MockDocRef) {
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

  set(ref: MockDocRef, data: Record<string, unknown>, _opts?: { merge?: boolean }) {
    this.writes.push({ path: ref.path, data });
    if (ref.path.includes("/economyLedger/")) {
      const id = ref.path.split("/").pop() ?? "";
      this.ledger.set(id, data as EconomyLedgerEntry);
    }
    if (ref.path === `users/${UID}`) {
      this.userData = { ...this.userData, ...data };
    }
  }
}

function ledgerEntriesFromTx(tx: SimTransaction): EconomyLedgerEntry[] {
  return tx.getLedgerEntries();
}

function assertUserMatchesLedgerFold(tx: SimTransaction) {
  const entries = ledgerEntriesFromTx(tx);
  const projection = projectionFromLedgerEntries(entries);
  const inventory =
    (tx.userData.inventory as
      | {
          parts?: number;
          baitMaterials?: { feather?: number; scale?: number; glimmerdust?: number };
        }
      | undefined) ?? {};

  assert.equal(tx.userData.currentWonder, projection.currentWonder);
  assert.equal(tx.userData.storedWonder, projection.storedWonder);
  assert.equal(tx.userData.lifetimeWonderEarned, projection.lifetimeWonderEarned);
  assert.equal(tx.userData.totalWonder, projection.totalWonder);
  assert.equal(inventory.parts ?? 0, projection.parts);
  assert.equal(inventory.baitMaterials?.feather ?? 0, projection.baitMaterials.feather);
  assert.equal(inventory.baitMaterials?.scale ?? 0, projection.baitMaterials.scale);
  assert.equal(inventory.baitMaterials?.glimmerdust ?? 0, projection.baitMaterials.glimmerdust);
}

test("economy simulation: randomized earn/spend sequence keeps user doc aligned with ledger fold", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new SimTransaction({
    currentWonder: 0,
    storedWonder: 0,
    inventory: { parts: 0, baitMaterials: { feather: 0, scale: 0, glimmerdust: 0 } },
  });

  const actions = [
    { type: "earn" as const, amount: 12, key: "practice:sim:1" },
    { type: "earn" as const, amount: 8, key: "well_answer:sim:1" },
    { type: "spend" as const, amount: 5, key: "bait_craft:sim:1", pool: "current" as const },
    { type: "earn" as const, amount: 3, key: "diary:sim:1" },
    { type: "parts" as const, delta: 4, key: "lesson_complete:sim:1", wonder: 6 },
    { type: "materials" as const, feather: 2, key: "fishing_claim:sim:1" },
  ];

  let seq = 0;
  for (const action of actions) {
    seq += 1;
    const account = emptyAccount({
      currentWonder: (tx.userData.currentWonder as number) ?? 0,
      storedWonder: (tx.userData.storedWonder as number) ?? 0,
      lifetimeWonderEarned: (tx.userData.lifetimeWonderEarned as number) ?? 0,
    });

    await commitEconomyAction({
      tx: tx as unknown as FirebaseFirestore.Transaction,
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
          const { transaction } = applyWonderEarnInMemory(account, {
            source: "practice_completion",
            amount: action.amount,
            transactionId: `tx_sim_${seq}`,
          });
          return {
            entry: buildEconomyLedgerEntry({
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
          const { transaction } = applyWonderSpendInMemory(account, {
            source: "bait_craft",
            amount: action.amount,
            transactionId: `tx_sim_${seq}`,
            pool: action.pool,
          });
          return {
            entry: buildEconomyLedgerEntry({
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
          const { transaction } = applyWonderEarnInMemory(account, {
            source: "diary_deep_reflection",
            amount: action.wonder,
            transactionId: `tx_sim_${seq}`,
          });
          return {
            entry: buildEconomyLedgerEntry({
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
          entry: buildEconomyLedgerEntry({
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

  const sums = foldLedgerEntries(ledgerEntriesFromTx(tx));
  assert.equal(sums.currentWonder, tx.userData.currentWonder);
  assert.equal(sums.parts, (tx.userData.inventory as { parts?: number }).parts ?? 0);
});
