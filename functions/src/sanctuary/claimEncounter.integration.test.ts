import assert from "node:assert/strict";
import test from "node:test";
import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import {
  executeClaimCastInTransaction,
  fishingClaimDocId,
  resolveClaimCastId,
  type UserClaimEconomyDoc,
} from "./claimEncounter";
import { uiRodIdToDomain } from "./castMapping";
import { CREATURE_REFS } from "./creatureCatalog";
import { fishingClaimKey, idempotencyDocId } from "./economy";
import type { EconomyLedgerEntry } from "./economy/types";
import { filterCreaturesByRodPermission } from "./progression/rodFishingAccess";

const UID = "test_uid_claim_cast";

function basicRodPoolCreatureIds(currentWonder = 500): string[] {
  const rodId = uiRodIdToDomain("basic");
  return filterCreaturesByRodPermission(rodId, CREATURE_REFS)
    .filter((creature) => currentWonder >= creature.peakWonderGate)
    .map((creature) => creature.creatureTypeId);
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

const SAMPLE_CLAIM_SUMMARY = {
  outcome: "miss" as const,
  rarityIndicator: "common" as const,
  wonderAwarded: 2,
  materialsAwarded: 1,
};

class MockTransaction {
  readonly writes: ScheduledWrite[] = [];
  private userData: Record<string, unknown>;
  private readonly idempotencyHits = new Map<string, Record<string, unknown>>();
  private readonly collectionDocs = new Map<string, Record<string, unknown>>();
  private readonly creatureDocs = new Map<string, Record<string, unknown>>();
  private readonly ledgerEntries = new Map<string, EconomyLedgerEntry>();

  constructor(userData: Record<string, unknown> = { currentWonder: 10, storedWonder: 5 }) {
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

  seedCreatures(creatureTypeIds: string[]) {
    for (const id of creatureTypeIds) {
      this.creatureDocs.set(id, { creatureTypeId: id });
    }
  }

  async get(ref: MockDocRef) {
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
    if (ref.path === `users/${UID}/economyLedger`) {
      const docs = [...this.ledgerEntries.values()].map((entry) => ({
        id: entry.id,
        data: () => entry,
      }));
      return { size: docs.length, docs, empty: docs.length === 0 };
    }
    if (ref.path === `users/${UID}/creatures`) {
      const docs = [...this.creatureDocs.entries()].map(([id, data]) => ({
        id,
        data: () => data,
      }));
      return { docs, empty: docs.length === 0 };
    }
    const stored = this.collectionDocs.get(ref.path);
    if (stored) {
      return { exists: true, data: () => stored };
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
    } else {
      this.collectionDocs.set(ref.path, data);
    }
  }

  ledgerWrites() {
    return this.writes.filter((w) => w.path.includes("/economyLedger/"));
  }

  creatureWrites() {
    return this.writes.filter((w) => w.path.includes("/creatures/"));
  }
}

test("resolveClaimCastId prefers activeCast over lastClaimedCastId", () => {
  const data: UserClaimEconomyDoc = {
    activeCast: { castId: "cast_active" },
    lastClaimedCastId: "cast_old",
  };
  assert.equal(resolveClaimCastId(data), "cast_active");
});

test("resolveClaimCastId uses lastClaimedCastId when activeCast cleared", () => {
  const data: UserClaimEconomyDoc = {
    activeCast: null,
    lastClaimedCastId: "cast_claimed",
  };
  assert.equal(resolveClaimCastId(data), "cast_claimed");
});

test("fishingClaimDocId is deterministic per castId", () => {
  assert.equal(fishingClaimDocId("cast_abc"), "claim_cast_abc");
});

test("executeClaimCastInTransaction duplicate outcome commits single ledger entry", async () => {
  const castId = "dup_0";
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({
    currentWonder: 500,
    storedWonder: 500,
    lifetimeWonderEarned: 500,
    lastFishingResetDate: Timestamp.now(),
    activeCast: {
      castId,
      readyTimestamp: Timestamp.fromMillis(Date.now() - 1000),
      rodType: "basic",
      baitUsed: "random_bait",
    },
    inventory: { parts: 0, baitMaterials: { feather: 0, scale: 0, glimmerdust: 0 } },
  });

  tx.seedCreatures(basicRodPoolCreatureIds());

  const result = await executeClaimCastInTransaction(
    tx as unknown as FirebaseFirestore.Transaction,
    UID,
    userRef,
  );

  assert.equal(result.claimSummary.outcome, "duplicate");
  assert.equal(result.claimSummary.wonderAwarded, 1);
  assert.equal(result.claimSummary.materialsAwarded, 1);

  const ledgerWrites = tx.writes.filter((w) => w.path.includes("/economyLedger/"));
  assert.equal(ledgerWrites.length, 1);
  const entry = ledgerWrites[0]!.data;
  assert.equal(entry.deltaCurrentWonder, 1);
  assert.equal((entry.deltaMaterials as { feather: number }).feather, 1);
  assert.equal(entry.metadata.duplicate, true);
  assert.equal(entry.metadata.outcome, "duplicate");
  assert.equal(entry.source, "fishing_duplicate_consolation");

  const creatureWrites = tx.writes.filter((w) => w.path.includes("/creatures/"));
  assert.equal(creatureWrites.length, 0);

  const analyticsWrites = tx.writes.filter((w) => w.path.includes("/sanctuaryAnalytics/"));
  assert.equal(analyticsWrites.length, 1);
  assert.equal(analyticsWrites[0]!.data.duplicate, true);
  assert.equal(analyticsWrites[0]!.data.outcome, "duplicate");
});

test("executeClaimCastInTransaction post-success retry returns idempotency cache", async () => {
  const castId = "cast_retry_success";
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({
    currentWonder: 10,
    activeCast: null,
    lastClaimedCastId: castId,
  });

  tx.seedIdempotency(fishingClaimKey(castId), SAMPLE_CLAIM_SUMMARY);

  const result = await executeClaimCastInTransaction(
    tx as unknown as FirebaseFirestore.Transaction,
    UID,
    userRef,
  );

  assert.deepEqual(result.claimSummary, SAMPLE_CLAIM_SUMMARY);
  assert.equal(tx.writes.filter((w) => w.path.includes("/economyLedger/")).length, 0);
});

test("executeClaimCastInTransaction rejects claim before ready", async () => {
  const castId = "cast_not_ready";
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({
    currentWonder: 10,
    lastFishingResetDate: Timestamp.now(),
    activeCast: {
      castId,
      readyTimestamp: Timestamp.fromMillis(Date.now() + 60_000),
      rodType: "basic",
      baitUsed: "random_bait",
    },
  });

  await assert.rejects(
    () =>
      executeClaimCastInTransaction(tx as unknown as FirebaseFirestore.Transaction, UID, userRef),
    (error: unknown) => {
      assert.ok(error instanceof HttpsError);
      assert.equal(error.code, "failed-precondition");
      assert.match(error.message, /not ready/i);
      return true;
    },
  );

  assert.equal(tx.writes.filter((w) => w.path.includes("/economyLedger/")).length, 0);
});

test("executeClaimCastInTransaction rejects when no cast and no recovery", async () => {
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({ activeCast: null });

  await assert.rejects(
    () =>
      executeClaimCastInTransaction(tx as unknown as FirebaseFirestore.Transaction, UID, userRef),
    (error: unknown) => {
      assert.ok(error instanceof HttpsError);
      assert.equal(error.code, "failed-precondition");
      return true;
    },
  );
});
