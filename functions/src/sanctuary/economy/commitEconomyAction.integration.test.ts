import assert from "node:assert/strict";
import test from "node:test";

import { commitEconomyAction } from "./commitEconomyAction";
import {
  applyWonderEarnInMemory,
  applyWonderSpendInMemory,
  buildAuditOnlyLedgerEntry,
  buildEconomyLedgerEntry,
} from "./applyLedgerEntry";
import { buildCompensationLedgerEntry, compensationIdempotencyKey } from "./compensation";
import { EconomyError } from "./types";
import { idempotencyDocId, ledgerEntryIdForKey } from "./idempotency";
import { craftCollectKey, rodEquipKey } from "./callableIdempotencyKeys";
import type { EconomyLedgerEntry } from "./types";
import type { WonderAccount } from "../types";

const UID = "test_uid_atomicity";

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

type ScheduledWrite = { path: string; data: Record<string, unknown> };

class MockTransaction {
  readonly writes: ScheduledWrite[] = [];
  private readonly userData: Record<string, unknown>;
  private readonly idempotencyHits = new Map<string, Record<string, unknown>>();
  private readonly ledgerEntries = new Map<string, EconomyLedgerEntry>();

  constructor(userData: Record<string, unknown> = { currentWonder: 10, storedWonder: 5 }) {
    this.userData = userData;
    this.seedOpeningLedgerFromUserData();
  }

  private seedOpeningLedgerFromUserData() {
    const currentWonder = (this.userData.currentWonder as number | undefined) ?? 0;
    const storedWonder = (this.userData.storedWonder as number | undefined) ?? 0;
    const inventory =
      (this.userData.inventory as
        | {
            parts?: number;
            baitMaterials?: { feather?: number; scale?: number; glimmerdust?: number };
          }
        | undefined) ?? {};
    const parts = inventory.parts ?? 0;
    const feather = inventory.baitMaterials?.feather ?? 0;
    const scale = inventory.baitMaterials?.scale ?? 0;
    const glimmerdust = inventory.baitMaterials?.glimmerdust ?? 0;

    if (
      currentWonder === 0 &&
      storedWonder === 0 &&
      parts === 0 &&
      feather === 0 &&
      scale === 0 &&
      glimmerdust === 0
    ) {
      return;
    }

    const entry: EconomyLedgerEntry = {
      id: "ledger_seed_opening_balance",
      uid: UID,
      timestamp: Date.now(),
      actionType: "compensation",
      source: "economy_compensation",
      deltaCurrentWonder: currentWonder,
      deltaStoredWonder: storedWonder,
      deltaParts: parts,
      deltaMaterials: { feather, scale, glimmerdust },
      idempotencyKey: "seed:opening_balance",
      metadata: { seededForTests: true },
      schemaVersion: 1,
    };
    this.ledgerEntries.set(entry.id, entry);
  }

  seedIdempotency(idempotencyKey: string, response: unknown) {
    const docId = idempotencyDocId(idempotencyKey);
    this.idempotencyHits.set(`users/${UID}/economyIdempotency/${docId}`, {
      response,
      ledgerEntryId: "ledger_existing",
    });
  }

  async get(ref: MockDocRef) {
    if (ref.path === `users/${UID}`) {
      return { exists: true, data: () => ({ ...this.userData }) };
    }
    if (ref.path === `users/${UID}/economyLedger`) {
      const docs = [...this.ledgerEntries.values()].map((entry) => ({
        id: entry.id,
        data: () => entry,
      }));
      return { size: docs.length, docs, empty: docs.length === 0 };
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

  set(ref: MockDocRef, data: Record<string, unknown>) {
    this.writes.push({ path: ref.path, data });
    if (ref.path.includes("/economyLedger/")) {
      const id = ref.path.split("/").pop() ?? "";
      this.ledgerEntries.set(id, data as EconomyLedgerEntry);
    }
  }
}

function wonderWrites(tx: MockTransaction) {
  return tx.writes.filter(
    (w) =>
      w.path.includes("/economyLedger/") ||
      (w.path === `users/${UID}` &&
        ("currentWonder" in w.data || "storedWonder" in w.data || "inventory" in w.data)),
  );
}

test("commitEconomyAction schedules no writes when build throws INSUFFICIENT_WONDER", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({ currentWonder: 1, storedWonder: 0 });

  await assert.rejects(
    () =>
      commitEconomyAction({
        tx: tx as unknown as FirebaseFirestore.Transaction,
        userRef,
        uid: UID,
        idempotencyKey: "bait_craft:fail_tx",
        actionType: "bait_craft",
        build: ({ account }) => {
          const { transaction } = applyWonderSpendInMemory(account, {
            source: "bait_craft",
            amount: 99,
            transactionId: "tx_fail",
            pool: "current",
          });
          const entry = buildEconomyLedgerEntry({
            uid: UID,
            actionType: "bait_craft",
            source: "bait_craft",
            transaction,
            idempotencyKey: "bait_craft:fail_tx",
          });
          return { entry, response: { ok: true } };
        },
      }),
    (error: unknown) => {
      assert.ok(error instanceof EconomyError);
      assert.equal(error.code, "INSUFFICIENT_WONDER");
      return true;
    },
  );

  assert.equal(wonderWrites(tx).length, 0);
});

test("commitEconomyAction idempotency hit writes nothing", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction();
  tx.seedIdempotency("practice:2026-06-22:tried_validation", { success: true, wonderAwarded: 5 });

  const result = await commitEconomyAction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    idempotencyKey: "practice:2026-06-22:tried_validation",
    actionType: "practice_complete",
    build: () => {
      throw new Error("build should not run on idempotency hit");
    },
  });

  assert.equal(result.committed, false);
  assert.equal(wonderWrites(tx).length, 0);
});

test("commitEconomyAction fresh commit writes user projection and ledger atomically", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({ currentWonder: 10, storedWonder: 5 });

  const result = await commitEconomyAction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    idempotencyKey: "practice:2026-06-22:followed_child_lead",
    actionType: "practice_complete",
    build: ({ account }: { account: WonderAccount }) => {
      const { transaction } = applyWonderEarnInMemory(account, {
        source: "practice_completion",
        amount: 3,
        transactionId: "tx_practice",
      });
      const entry = buildEconomyLedgerEntry({
        uid: UID,
        actionType: "practice_complete",
        source: "practice_completion",
        transaction,
        idempotencyKey: "practice:2026-06-22:followed_child_lead",
      });
      return {
        entry,
        response: { success: true as const, wonderAwarded: 3 },
      };
    },
  });

  assert.equal(result.committed, true);
  const ledgerWrites = tx.writes.filter((w) => w.path.includes("/economyLedger/"));
  const userWrites = tx.writes.filter((w) => w.path === `users/${UID}`);
  assert.equal(ledgerWrites.length, 1);
  assert.equal(userWrites.length, 1);
  assert.equal(userWrites[0]?.data.currentWonder, 13);
  assert.equal(ledgerWrites[0]?.data.deltaCurrentWonder, 3);
});

test("commitEconomyAction rejects mismatched ledger entry id", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({ currentWonder: 10, storedWonder: 5 });

  await assert.rejects(
    () =>
      commitEconomyAction({
        tx: tx as unknown as FirebaseFirestore.Transaction,
        userRef,
        uid: UID,
        idempotencyKey: "well_answer:2026-06-22",
        actionType: "well_reflection",
        build: ({ account }) => {
          const { transaction } = applyWonderEarnInMemory(account, {
            source: "well_question_answered",
            amount: 12,
            transactionId: "tx_well",
          });
          const entry = buildEconomyLedgerEntry({
            uid: UID,
            actionType: "well_reflection",
            source: "well_question_answered",
            transaction,
            idempotencyKey: "well_answer:2026-06-22",
          });
          entry.id = "wrong_ledger_id";
          return { entry, response: { wonderAwarded: 12 } };
        },
      }),
    (error: unknown) => {
      assert.ok(error instanceof EconomyError);
      assert.equal(error.code, "IDEMPOTENCY_CONFLICT");
      return true;
    },
  );

  assert.equal(wonderWrites(tx).length, 0);
});

test("commitEconomyAction dual-write wonderTransactions includes ledger cross-reference", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({ currentWonder: 10, storedWonder: 5 });
  const idempotencyKey = "lesson_complete:lesson_1";

  await commitEconomyAction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    idempotencyKey,
    actionType: "lesson_complete",
    build: ({ account }) => {
      const { transaction } = applyWonderEarnInMemory(account, {
        source: "diary_deep_reflection",
        amount: 8,
        transactionId: "tx_lesson",
      });
      const entry = buildEconomyLedgerEntry({
        uid: UID,
        actionType: "lesson_complete",
        source: "diary_deep_reflection",
        transaction,
        idempotencyKey,
      });
      return { entry, response: { wonderAwarded: 8 } };
    },
  });

  const wonderTxWrites = tx.writes.filter((w) => w.path.includes("/wonderTransactions/"));
  assert.equal(wonderTxWrites.length, 1);
  assert.equal(wonderTxWrites[0]?.data.ledgerEntryId, ledgerEntryIdForKey(idempotencyKey));
  assert.equal(wonderTxWrites[0]?.data.idempotencyKey, idempotencyKey);
  assert.equal(wonderTxWrites[0]?.data.actionType, "lesson_complete");
});

test("commitEconomyAction skips wonderTransactions when ECONOMY_LEDGER_ONLY=true", async () => {
  const prior = process.env.ECONOMY_LEDGER_ONLY;
  process.env.ECONOMY_LEDGER_ONLY = "true";

  try {
    const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
    const tx = new MockTransaction({ currentWonder: 10, storedWonder: 5 });
    const idempotencyKey = "practice:2026-06-29:tried_validation";

    await commitEconomyAction({
      tx: tx as unknown as FirebaseFirestore.Transaction,
      userRef,
      uid: UID,
      idempotencyKey,
      actionType: "practice_complete",
      build: ({ account }) => {
        const { transaction } = applyWonderEarnInMemory(account, {
          source: "practice_completion",
          amount: 3,
          transactionId: "tx_practice_smoke",
        });
        const entry = buildEconomyLedgerEntry({
          uid: UID,
          actionType: "practice_complete",
          source: "practice_completion",
          transaction,
          idempotencyKey,
        });
        return { entry, response: { wonderAwarded: 3 } };
      },
    });

    const wonderTxWrites = tx.writes.filter((w) => w.path.includes("/wonderTransactions/"));
    const ledgerWrites = tx.writes.filter((w) => w.path.includes("/economyLedger/"));
    assert.equal(wonderTxWrites.length, 0);
    assert.equal(ledgerWrites.length, 1);
  } finally {
    if (prior === undefined) {
      delete process.env.ECONOMY_LEDGER_ONLY;
    } else {
      process.env.ECONOMY_LEDGER_ONLY = prior;
    }
  }
});

test("commitEconomyAction zero-wonder fishing writes ledger only without wonderTransactions", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({ currentWonder: 10, storedWonder: 5, inventory: { parts: 0 } });
  const idempotencyKey = "fishing_claim:cast_zero";

  await commitEconomyAction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    idempotencyKey,
    actionType: "fishing_claim",
    build: ({ account }) => ({
      entry: {
        id: ledgerEntryIdForKey(idempotencyKey),
        uid: UID,
        timestamp: Date.now(),
        actionType: "fishing_claim",
        source: "fishing_miss_consolation",
        deltaCurrentWonder: 0,
        deltaStoredWonder: 0,
        deltaParts: 0,
        deltaMaterials: { feather: 2 },
        idempotencyKey,
        metadata: { claimId: "claim_1", wonderTransactionId: "tx_claim_1" },
        schemaVersion: 1,
      },
      response: { wonderAwarded: 0 },
    }),
  });

  const ledgerWrites = tx.writes.filter((w) => w.path.includes("/economyLedger/"));
  const wonderTxWrites = tx.writes.filter((w) => w.path.includes("/wonderTransactions/"));
  assert.equal(ledgerWrites.length, 1);
  assert.equal(ledgerWrites[0]?.data.deltaCurrentWonder, 0);
  assert.equal(wonderTxWrites.length, 0);
});

test("commitEconomyAction rod craft spend shape commits ledger with deterministic id", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({ currentWonder: 50, storedWonder: 10 });
  const idempotencyKey = "craft_start:rare_fire";

  const result = await commitEconomyAction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    idempotencyKey,
    actionType: "craft_start",
    build: ({ account }) => {
      const { account: nextAccount, transaction } = applyWonderSpendInMemory(account, {
        source: "rod_craft_investment",
        amount: 20,
        transactionId: "tx_craft",
        pool: "current",
      });
      const entry = buildEconomyLedgerEntry({
        uid: UID,
        actionType: "craft_start",
        source: "rod_craft_investment",
        transaction,
        idempotencyKey,
      });
      return { entry, response: { wonderSpent: 20 } };
    },
  });

  assert.equal(result.ledgerEntryId, ledgerEntryIdForKey(idempotencyKey));
  assert.equal(
    tx.writes.some((w) => w.path.endsWith(`/economyLedger/${result.ledgerEntryId}`)),
    true,
  );
});

test("commitEconomyAction bait craft spend shape commits ledger atomically", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({ currentWonder: 30, storedWonder: 0 });
  const idempotencyKey = "bait_craft:req_abc";

  await commitEconomyAction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    idempotencyKey,
    actionType: "bait_craft",
    build: ({ account }) => {
      const { account: nextAccount, transaction } = applyWonderSpendInMemory(account, {
        source: "bait_craft",
        amount: 5,
        transactionId: "tx_bait",
        pool: "current",
      });
      const entry = buildEconomyLedgerEntry({
        uid: UID,
        actionType: "bait_craft",
        source: "bait_craft",
        transaction,
        idempotencyKey,
      });
      return { entry, response: { wonderSpent: 5 } };
    },
  });

  assert.equal(tx.writes.filter((w) => w.path.includes("/economyLedger/")).length, 1);
});

test("commitEconomyAction diary reflection earn shape uses deterministic ledger id", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({ currentWonder: 0, storedWonder: 0 });
  const idempotencyKey = "diary:req_diary_1";

  const result = await commitEconomyAction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    idempotencyKey,
    actionType: "diary_reflection",
    build: ({ account }) => {
      const { transaction } = applyWonderEarnInMemory(account, {
        source: "diary_deep_reflection",
        amount: 15,
        transactionId: "tx_diary",
      });
      const entry = buildEconomyLedgerEntry({
        uid: UID,
        actionType: "diary_reflection",
        source: "diary_deep_reflection",
        transaction,
        idempotencyKey,
      });
      return { entry, response: { wonderAwarded: 15 } };
    },
  });

  assert.equal(result.ledgerEntryId, ledgerEntryIdForKey(idempotencyKey));
});

test("commitEconomyAction well reflection earn shape commits ledger atomically", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({ currentWonder: 0, storedWonder: 0 });
  const idempotencyKey = "well_answer:2026-06-22";

  const result = await commitEconomyAction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    idempotencyKey,
    actionType: "well_reflection",
    touchReflection: true,
    build: ({ account }) => {
      const { transaction } = applyWonderEarnInMemory(account, {
        source: "well_question_answered",
        amount: 12,
        transactionId: "tx_well",
      });
      const entry = buildEconomyLedgerEntry({
        uid: UID,
        actionType: "well_reflection",
        source: "well_question_answered",
        transaction,
        idempotencyKey,
      });
      return { entry, response: { wonderAwarded: 12 } };
    },
  });

  assert.equal(result.ledgerEntryId, ledgerEntryIdForKey(idempotencyKey));
  assert.equal(tx.writes.filter((w) => w.path.includes("/economyLedger/")).length, 1);
});

test("commitEconomyAction compensation entry commits with correctsEntryId metadata", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({ currentWonder: 10, storedWonder: 5 });
  const correctsEntryId = ledgerEntryIdForKey("well_answer:2026-06-01");
  const idempotencyKey = compensationIdempotencyKey(correctsEntryId, "manual_adjustment");

  const result = await commitEconomyAction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    idempotencyKey,
    actionType: "compensation",
    build: ({ account }) => {
      const entry = buildCompensationLedgerEntry({
        uid: UID,
        correctsEntryId,
        idempotencyKey,
        deltaCurrentWonder: 3,
        deltaStoredWonder: 3,
        compensationReason: "manual_adjustment",
      });
      return { entry, response: { success: true as const } };
    },
  });

  const ledgerWrite = tx.writes.find((w) => w.path.includes("/economyLedger/"));
  assert.equal(ledgerWrite?.data.actionType, "compensation");
  assert.equal(ledgerWrite?.data.metadata?.correctsEntryId, correctsEntryId);
  assert.equal(result.ledgerEntryId, ledgerEntryIdForKey(idempotencyKey));
});

test("commitEconomyAction craft_collect audit entry has zero deltas", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({ currentWonder: 10, storedWonder: 5 });
  const rodId = "rare_fire";
  const idempotencyKey = craftCollectKey(rodId);

  await commitEconomyAction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    idempotencyKey,
    actionType: "craft_collect",
    build: ({ account }) => ({
      entry: buildAuditOnlyLedgerEntry({
        uid: UID,
        actionType: "craft_collect",
        idempotencyKey,
        source: "rod_craft_investment",
        correlationId: rodId,
        metadata: { rodId, fromState: "crafting", toState: "ready" },
      }),
      response: { success: true as const, rodId, state: "ready" as const },
    }),
  });

  const ledgerWrite = tx.writes.find((w) => w.path.includes("/economyLedger/"));
  assert.equal(ledgerWrite?.data.actionType, "craft_collect");
  assert.equal(ledgerWrite?.data.deltaCurrentWonder, 0);
  assert.equal(ledgerWrite?.data.deltaParts, 0);
});

test("commitEconomyAction rod_equip audit entry idempotent retry writes nothing", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({ currentWonder: 10, storedWonder: 5 });
  const rodId = "rare_fire";
  const idempotencyKey = rodEquipKey(rodId);
  const cached = {
    success: true as const,
    rodId,
    state: "equipped" as const,
    equippedRodId: rodId,
  };

  tx.seedIdempotency(idempotencyKey, cached);

  await commitEconomyAction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    idempotencyKey,
    actionType: "rod_equip",
    build: ({ account }) => ({
      entry: buildAuditOnlyLedgerEntry({
        uid: UID,
        actionType: "rod_equip",
        idempotencyKey,
        source: "rod_craft_investment",
        correlationId: rodId,
        metadata: { rodId, fromState: "ready", toState: "equipped" },
      }),
      response: cached,
    }),
  });

  assert.equal(tx.writes.filter((w) => w.path.includes("/economyLedger/")).length, 0);
});
