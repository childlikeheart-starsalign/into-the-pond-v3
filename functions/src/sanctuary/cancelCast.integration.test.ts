import assert from "node:assert/strict";
import test from "node:test";
import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import { runCancelCastInTransaction } from "./cancelCastTransaction";
import { CANCEL_CAST_GRACE_MS, CANCEL_CAST_MAX_PER_WINDOW } from "./castTiming";
import { castCancelKey, idempotencyDocId } from "./economy";
import type { EconomyLedgerEntry } from "./economy/types";
import type { FishingPityState } from "./types";

const UID = "test_uid_cancel_cast";

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
  private writeStarted = false;

  constructor(userData: Record<string, unknown> = {}) {
    this.userData = {
      currentWonder: 100,
      storedWonder: 50,
      lifetimeWonderEarned: 100,
      ...userData,
    };
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
    if (this.writeStarted) {
      throw new Error("Firestore transactions require all reads to be executed before all writes.");
    }
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
    this.writeStarted = true;
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

const PITY: FishingPityState = {
  consecutiveChanceMisses: 4,
  epicTopRareDryStreak: { epic_fire: 2 },
};

function activeCastFixture(overrides: Record<string, unknown> = {}) {
  const now = Date.now();
  return {
    castId: "cast_cancel_test_1",
    readyTimestamp: Timestamp.fromMillis(now + 2 * 60 * 60 * 1000),
    createdAt: Timestamp.fromMillis(now - 1_000),
    rodType: "basic",
    baitUsed: "bait_basic",
    baitDeducted: false,
    ...overrides,
  };
}

test("runCancelCastInTransaction clears activeCast and does not touch fishingPity", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({
    fishingPity: PITY,
    activeCast: activeCastFixture(),
  });

  const result = await runCancelCastInTransaction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
  });

  assert.equal(result.success, true);
  assert.equal(result.baitRefunded, false);
  const user = tx.getUserData();
  assert.equal(user.activeCast, null);
  assert.deepEqual(user.fishingPity, PITY);
  const cancelLedgers = tx.ledgerWrites().filter((w) => w.data.actionType === "cast_cancel");
  assert.equal(cancelLedgers.length, 1);
  assert.equal(
    (cancelLedgers[0]?.data.metadata as { pityUnchanged?: boolean })?.pityUnchanged,
    true,
  );
});

test("runCancelCastInTransaction refunds consumable bait", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({
    fishingPity: PITY,
    inventory: {
      baits: { feather_bait: 0, scale_bait: 1, glimmerdust_bait: 0, random_bait: 0 },
    },
    activeCast: activeCastFixture({
      baitUsed: "bait_mid",
      baitDeducted: true,
    }),
  });

  const result = await runCancelCastInTransaction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
  });

  assert.equal(result.baitRefunded, true);
  const baits = (tx.getUserData().inventory as { baits: Record<string, number> }).baits;
  assert.equal(baits.scale_bait, 2);
  assert.deepEqual(tx.getUserData().fishingPity, PITY);
});

test("runCancelCastInTransaction rejects after grace window", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const now = Date.now();
  const tx = new MockTransaction({
    fishingPity: PITY,
    activeCast: activeCastFixture({
      createdAt: Timestamp.fromMillis(now - CANCEL_CAST_GRACE_MS - 1),
    }),
  });

  await assert.rejects(
    () =>
      runCancelCastInTransaction({
        tx: tx as unknown as FirebaseFirestore.Transaction,
        userRef,
        uid: UID,
        nowMs: now,
      }),
    (err: unknown) => err instanceof HttpsError && err.message.includes("recall window"),
  );
  assert.deepEqual(tx.getUserData().fishingPity, PITY);
  assert.ok(tx.getUserData().activeCast);
});

test("runCancelCastInTransaction rejects when createdAt missing", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const cast = activeCastFixture();
  delete (cast as { createdAt?: Timestamp }).createdAt;
  const tx = new MockTransaction({
    fishingPity: PITY,
    activeCast: cast,
  });

  await assert.rejects(
    () =>
      runCancelCastInTransaction({
        tx: tx as unknown as FirebaseFirestore.Transaction,
        userRef,
        uid: UID,
      }),
    (err: unknown) => err instanceof HttpsError && err.message.includes("create time"),
  );
});

test("runCancelCastInTransaction enforces rate limit", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const now = Date.now();
  const recent = Array.from({ length: CANCEL_CAST_MAX_PER_WINDOW }, (_, i) => now - i * 1000);
  const tx = new MockTransaction({
    fishingPity: PITY,
    castCancelRecentMs: recent,
    activeCast: activeCastFixture({ createdAt: Timestamp.fromMillis(now - 500) }),
  });

  await assert.rejects(
    () =>
      runCancelCastInTransaction({
        tx: tx as unknown as FirebaseFirestore.Transaction,
        userRef,
        uid: UID,
        nowMs: now,
      }),
    (err: unknown) => err instanceof HttpsError && err.code === "resource-exhausted",
  );
  assert.deepEqual(tx.getUserData().fishingPity, PITY);
});

test("runCancelCastInTransaction rejects when no active cast", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({
    fishingPity: PITY,
    activeCast: null,
    lastClaimedCastId: "cast_already_claimed",
  });

  await assert.rejects(
    () =>
      runCancelCastInTransaction({
        tx: tx as unknown as FirebaseFirestore.Transaction,
        userRef,
        uid: UID,
      }),
    (err: unknown) => err instanceof HttpsError && err.message.includes("No active cast"),
  );
  assert.deepEqual(tx.getUserData().fishingPity, PITY);
});

test("runCancelCastInTransaction returns idempotency cache on retry", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const cached = {
    success: true as const,
    castId: "cast_cancel_test_1",
    baitRefunded: false,
  };
  const tx = new MockTransaction({
    fishingPity: PITY,
    activeCast: activeCastFixture(),
  });
  tx.seedIdempotency(castCancelKey("cast_cancel_test_1"), cached);

  const result = await runCancelCastInTransaction({
    tx: tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    uid: UID,
  });

  assert.deepEqual(result, cached);
  assert.equal(tx.writes.length, 0);
  assert.deepEqual(tx.getUserData().fishingPity, PITY);
});
