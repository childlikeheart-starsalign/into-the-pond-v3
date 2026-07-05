import assert from "node:assert/strict";
import test from "node:test";
import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import {
  deriveCastIdFromRequestId,
  runCreateCastInTransaction,
  CAST_DURATION_MS,
} from "./createCastTransaction";
import { castCreateKey, idempotencyDocId } from "./economy";
import type { EconomyLedgerEntry } from "./economy/types";

const UID = "test_uid_create_cast";

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
  private userData: Record<string, unknown>;
  private readonly idempotencyHits = new Map<string, Record<string, unknown>>();
  private readonly ledgerEntries = new Map<string, EconomyLedgerEntry>();

  constructor(
    userData: Record<string, unknown> = {
      currentWonder: 100,
      storedWonder: 50,
      lifetimeWonderEarned: 100,
    },
  ) {
    this.userData = userData;
    this.seedOpeningLedgerFromUserData();
  }

  private seedOpeningLedgerFromUserData() {
    const currentWonder = (this.userData.currentWonder as number | undefined) ?? 0;
    const storedWonder = (this.userData.storedWonder as number | undefined) ?? 0;
    if (currentWonder === 0 && storedWonder === 0) return;
    const entry: EconomyLedgerEntry = {
      id: "ledger_seed_opening_balance",
      uid: UID,
      timestamp: Date.now(),
      actionType: "compensation",
      source: "economy_compensation",
      deltaCurrentWonder: currentWonder,
      deltaStoredWonder: storedWonder,
      deltaParts: 0,
      deltaMaterials: {},
      idempotencyKey: "seed:opening_balance",
      metadata: { seededForTests: true },
      schemaVersion: 1,
    };
    this.ledgerEntries.set(entry.id, entry);
  }

  seedIdempotency(idempotencyKey: string, response: unknown) {
    const docId = idempotencyDocId(idempotencyKey);
    this.idempotencyHits.set(`users/${UID}/economyIdempotency/${docId}`, { response });
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
    if (ref.path.includes("/playerRods/")) {
      return { exists: true, data: () => ({ state: "ready" }) };
    }
    return { exists: false, data: () => undefined };
  }

  set(ref: MockDocRef, data: Record<string, unknown>) {
    this.writes.push({ path: ref.path, data });
    if (ref.path.includes("/economyLedger/")) {
      const id = ref.path.split("/").pop() ?? "";
      this.ledgerEntries.set(id, data as EconomyLedgerEntry);
    }
    if (ref.path === `users/${UID}`) {
      this.userData = { ...this.userData, ...data };
    }
  }

  getUserData() {
    return { ...this.userData };
  }

  ledgerWrites() {
    return this.writes.filter((w) => w.path.includes("/economyLedger/"));
  }
}

test("deriveCastIdFromRequestId is stable and server-derived", () => {
  const requestId = "cast_client_req_1";
  const castId = deriveCastIdFromRequestId(requestId);
  assert.equal(castId, deriveCastIdFromRequestId(requestId));
  assert.ok(castId.startsWith("cast_"));
});

test("runCreateCastInTransaction idempotency hit writes no activeCast", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction();
  const requestId = "req_idempotent_cast";
  const castId = deriveCastIdFromRequestId(requestId);
  const readyAt = Date.now() + CAST_DURATION_MS;
  const cached = { success: true as const, castId, readyAt };

  tx.seedIdempotency(castCreateKey(requestId), cached);

  const result = await runCreateCastInTransaction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    requestId,
    rodType: "basic",
    baitUsed: "random_bait",
  });

  assert.deepEqual(result, cached);
  assert.equal(tx.writes.filter((w) => "activeCast" in w.data).length, 0);
});

test("runCreateCastInTransaction rejects second cast while another is active", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({
    activeCast: {
      castId: "cast_other_active",
      readyTimestamp: Timestamp.fromMillis(Date.now() + 60_000),
    },
  });

  await assert.rejects(
    () =>
      runCreateCastInTransaction({
        tx: tx as unknown as FirebaseFirestore.Transaction,
        userRef,
        uid: UID,
        requestId: "req_new_cast",
        rodType: "basic",
        baitUsed: "random_bait",
      }),
    (error: unknown) => {
      assert.ok(error instanceof HttpsError);
      assert.equal(error.code, "failed-precondition");
      return true;
    },
  );
});

test("runCreateCastInTransaction same requestId retry reconciles existing activeCast", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const requestId = "req_retry_same_cast";
  const castId = deriveCastIdFromRequestId(requestId);
  const readyAt = Date.now() + CAST_DURATION_MS;
  const tx = new MockTransaction({
    activeCast: {
      castId,
      readyTimestamp: Timestamp.fromMillis(readyAt),
    },
  });

  const result = await runCreateCastInTransaction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    requestId,
    rodType: "basic",
    baitUsed: "random_bait",
  });

  assert.equal(result.castId, castId);
  assert.equal(tx.writes.filter((w) => "activeCast" in w.data).length, 0);
});

test("runCreateCastInTransaction fresh cast writes activeCast once", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction();
  const requestId = "req_fresh_cast";

  const result = await runCreateCastInTransaction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    requestId,
    rodType: "basic",
    baitUsed: "random_bait",
  });

  assert.equal(result.success, true);
  const activeCastWrites = tx.writes.filter((w) => w.path === `users/${UID}` && w.data.activeCast);
  assert.equal(activeCastWrites.length, 1);
});

test("runCreateCastInTransaction deducts feather_bait when balance is 1", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({
    inventory: {
      baits: { feather_bait: 1, scale_bait: 0, glimmerdust_bait: 0, random_bait: 0 },
    },
  });

  await runCreateCastInTransaction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    requestId: "req_feather_bait",
    rodType: "basic",
    baitUsed: "feather_bait",
  });

  const userData = tx.getUserData();
  assert.equal((userData.inventory as { baits: Record<string, number> }).baits.feather_bait, 0);
});

test("runCreateCastInTransaction rejects feather_bait when balance is 0", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({
    inventory: {
      baits: { feather_bait: 0, scale_bait: 0, glimmerdust_bait: 0, random_bait: 0 },
    },
  });

  await assert.rejects(
    () =>
      runCreateCastInTransaction({
        tx: tx as unknown as FirebaseFirestore.Transaction,
        userRef,
        uid: UID,
        requestId: "req_no_bait",
        rodType: "basic",
        baitUsed: "feather_bait",
      }),
    (error: unknown) => {
      assert.ok(error instanceof HttpsError);
      assert.equal(error.code, "failed-precondition");
      return true;
    },
  );
});

test("runCreateCastInTransaction does not deduct random_bait", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({
    inventory: {
      baits: { feather_bait: 0, scale_bait: 0, glimmerdust_bait: 0, random_bait: 5 },
    },
  });

  await runCreateCastInTransaction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    requestId: "req_random_bait",
    rodType: "basic",
    baitUsed: "random_bait",
  });

  const userData = tx.getUserData();
  assert.equal((userData.inventory as { baits: Record<string, number> }).baits.random_bait, 5);
  const inventoryWrites = tx.writes.filter((w) => "inventory" in w.data);
  assert.equal(inventoryWrites.length, 1);
  assert.equal(
    (inventoryWrites[0]!.data.inventory as { baits: Record<string, number> }).baits.random_bait,
    5,
  );
});

test("runCreateCastInTransaction fresh cast writes cast_create ledger entry", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction();
  const requestId = "req_ledger_cast";

  await runCreateCastInTransaction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    requestId,
    rodType: "basic",
    baitUsed: "random_bait",
  });

  const ledgerWrites = tx.ledgerWrites();
  assert.equal(ledgerWrites.length, 1);
  assert.equal(ledgerWrites[0]!.data.actionType, "cast_create");
  assert.equal(ledgerWrites[0]!.data.deltaCurrentWonder, 0);
});

test("runCreateCastInTransaction idempotency hit writes no ledger", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction();
  const requestId = "req_ledger_idem";
  const castId = deriveCastIdFromRequestId(requestId);
  const cached = { success: true as const, castId, readyAt: Date.now() + CAST_DURATION_MS };

  tx.seedIdempotency(castCreateKey(requestId), cached);

  await runCreateCastInTransaction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
    requestId,
    rodType: "basic",
    baitUsed: "random_bait",
  });

  assert.equal(tx.ledgerWrites().length, 0);
});
