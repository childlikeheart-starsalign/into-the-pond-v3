import assert from "node:assert/strict";
import test from "node:test";

import { applyFishingClaimInTransaction } from "./applyFishingClaim";
import { fishingClaimKey, idempotencyDocId } from "./economy";
import type { EconomyLedgerEntry } from "./economy/types";
import type { FishingClaim } from "./types";
import { toClientClaimSummary } from "./fishingClaimPresentation";

const UID = "test_uid_apply_fishing_claim";

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
  private readonly collectionDocs = new Map<string, Record<string, unknown>>();
  private readonly ledgerEntries = new Map<string, EconomyLedgerEntry>();

  constructor(
    userData: Record<string, unknown> = {
      currentWonder: 500,
      storedWonder: 500,
      lifetimeWonderEarned: 500,
      inventory: { parts: 0, baitMaterials: { feather: 0, scale: 0, glimmerdust: 0 } },
    },
  ) {
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
    const entry: EconomyLedgerEntry = {
      id: "ledger_seed_opening_balance",
      uid: UID,
      timestamp: Date.now(),
      actionType: "compensation",
      source: "economy_compensation",
      deltaCurrentWonder: currentWonder,
      deltaStoredWonder: storedWonder,
      deltaParts: inventory.parts ?? 0,
      deltaMaterials: {
        feather: inventory.baitMaterials?.feather ?? 0,
        scale: inventory.baitMaterials?.scale ?? 0,
        glimmerdust: inventory.baitMaterials?.glimmerdust ?? 0,
      },
      idempotencyKey: "seed:opening_balance",
      metadata: { seededForTests: true },
      schemaVersion: 1,
    };
    if (
      entry.deltaCurrentWonder !== 0 ||
      entry.deltaStoredWonder !== 0 ||
      entry.deltaParts !== 0 ||
      (entry.deltaMaterials.feather ?? 0) !== 0 ||
      (entry.deltaMaterials.scale ?? 0) !== 0 ||
      (entry.deltaMaterials.glimmerdust ?? 0) !== 0
    ) {
      this.ledgerEntries.set(entry.id, entry);
    }
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

  getUserData() {
    return { ...this.userData };
  }

  ledgerWrites() {
    return this.writes.filter((w) => w.path.includes("/economyLedger/"));
  }

  creatureWrites() {
    return this.writes.filter((w) => w.path.includes("/creatures/"));
  }
}

const DUPLICATE_CLAIM: FishingClaim = {
  id: "claim_dup_test",
  encounterId: "enc_dup",
  userId: UID,
  claimedAt: Date.now(),
  currentWonderAtClaim: 500,
  outcome: "duplicate",
  creatureTypeId: "puddle-dart",
  creatureDisplayName: "Puddle Dart",
  poolTier: "common",
  rarityIndicator: "common",
  wonderAwarded: 1,
  materialsAwarded: 1,
  spiritMessage: "This one knows you already.",
  metadata: { castId: "dup_0" },
};

const CATCH_CLAIM: FishingClaim = {
  id: "claim_catch_test",
  encounterId: "enc_catch",
  userId: UID,
  claimedAt: Date.now(),
  currentWonderAtClaim: 500,
  outcome: "catch",
  creatureTypeId: "puddle-dart",
  creatureDisplayName: "Puddle Dart",
  poolTier: "common",
  rarityIndicator: "common",
  wonderAwarded: 0,
  materialsAwarded: 0,
  metadata: { castId: "catch_0" },
};

const MISS_CLAIM: FishingClaim = {
  id: "claim_miss_test",
  encounterId: "enc_miss",
  userId: UID,
  claimedAt: Date.now(),
  currentWonderAtClaim: 500,
  outcome: "miss",
  poolTier: "common",
  rarityIndicator: "common",
  wonderAwarded: 0,
  materialsAwarded: 2,
  spiritMessage: "The pond remembers your patience.",
  metadata: { castId: "miss_0" },
};

test("applyFishingClaimInTransaction duplicate commits single ledger with wonder and materials", async () => {
  const castId = "dup_0";
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction();

  const result = await applyFishingClaimInTransaction(
    tx as unknown as FirebaseFirestore.Transaction,
    {
      uid: UID,
      userRef,
      data: tx.getUserData(),
      claim: DUPLICATE_CLAIM,
      rodUiId: "basic",
      castId,
    },
  );

  assert.equal(result.outcome, "duplicate");
  assert.equal(result.wonderAwarded, 1);
  assert.equal(result.materialsAwarded, 1);

  const ledgerWrites = tx.ledgerWrites();
  assert.equal(ledgerWrites.length, 1);
  const entry = ledgerWrites[0]!.data;
  assert.equal(entry.deltaCurrentWonder, 1);
  assert.equal((entry.deltaMaterials as { feather: number }).feather, 1);
  assert.equal(entry.metadata.duplicate, true);
  assert.equal(entry.metadata.outcome, "duplicate");
  assert.equal(entry.metadata.creatureTypeId, "puddle-dart");
  assert.equal(entry.source, "fishing_duplicate_consolation");

  const analyticsWrites = tx.writes.filter((w) => w.path.includes("/sanctuaryAnalytics/"));
  assert.equal(analyticsWrites.length, 1);
  assert.equal(analyticsWrites[0]!.data.duplicate, true);
  assert.equal(analyticsWrites[0]!.data.outcome, "duplicate");
});

test("applyFishingClaimInTransaction duplicate idempotent retry writes no ledger", async () => {
  const castId = "dup_0";
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction();
  const cachedSummary = toClientClaimSummary(DUPLICATE_CLAIM);
  tx.seedIdempotency(fishingClaimKey(castId), cachedSummary);

  const result = await applyFishingClaimInTransaction(
    tx as unknown as FirebaseFirestore.Transaction,
    {
      uid: UID,
      userRef,
      data: tx.getUserData(),
      claim: DUPLICATE_CLAIM,
      rodUiId: "basic",
      castId,
    },
  );

  assert.deepEqual(result, cachedSummary);
  assert.equal(tx.ledgerWrites().length, 0);
  assert.equal(tx.creatureWrites().length, 0);
});

test("applyFishingClaimInTransaction catch commits zero wonder/materials and writes creature", async () => {
  const castId = "catch_0";
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction();

  const result = await applyFishingClaimInTransaction(
    tx as unknown as FirebaseFirestore.Transaction,
    {
      uid: UID,
      userRef,
      data: tx.getUserData(),
      claim: CATCH_CLAIM,
      rodUiId: "basic",
      castId,
    },
  );

  assert.equal(result.outcome, "catch");
  assert.equal(result.wonderAwarded, 0);
  assert.equal(result.materialsAwarded, 0);

  const ledgerWrites = tx.ledgerWrites();
  assert.equal(ledgerWrites.length, 1);
  const entry = ledgerWrites[0]!.data;
  assert.equal(entry.deltaCurrentWonder, 0);
  assert.equal((entry.deltaMaterials as { feather: number }).feather, 0);
  assert.equal(entry.source, "fishing_catch");
  assert.equal(entry.metadata.outcome, "catch");

  assert.equal(tx.creatureWrites().length, 1);
  assert.equal(tx.creatureWrites()[0]!.path, `users/${UID}/creatures/puddle-dart`);
});

test("applyFishingClaimInTransaction miss with materials only writes ledger without wonder", async () => {
  const castId = "miss_0";
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction();

  const result = await applyFishingClaimInTransaction(
    tx as unknown as FirebaseFirestore.Transaction,
    {
      uid: UID,
      userRef,
      data: tx.getUserData(),
      claim: MISS_CLAIM,
      rodUiId: "basic",
      castId,
    },
  );

  assert.equal(result.outcome, "miss");
  assert.equal(result.wonderAwarded, 0);
  assert.equal(result.materialsAwarded, 2);

  const ledgerWrites = tx.ledgerWrites();
  assert.equal(ledgerWrites.length, 1);
  const entry = ledgerWrites[0]!.data;
  assert.equal(entry.deltaCurrentWonder, 0);
  assert.equal((entry.deltaMaterials as { feather: number }).feather, 2);
  assert.equal(entry.source, "fishing_miss_consolation");
  assert.equal(entry.metadata.outcome, "miss");

  const wonderTxWrites = tx.writes.filter((w) => w.path.includes("/wonderTransactions/"));
  assert.equal(wonderTxWrites.length, 0);
});

test("applyFishingClaimInTransaction duplicate at fishingWonderToday 9 earns 1 and counter reaches 10", async () => {
  const castId = "dup_cap_9";
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({
    currentWonder: 500,
    storedWonder: 500,
    lifetimeWonderEarned: 500,
    fishingWonderToday: 9,
    inventory: { parts: 0, baitMaterials: { feather: 0, scale: 0, glimmerdust: 0 } },
  });

  const result = await applyFishingClaimInTransaction(
    tx as unknown as FirebaseFirestore.Transaction,
    {
      uid: UID,
      userRef,
      data: tx.getUserData(),
      claim: { ...DUPLICATE_CLAIM, id: "claim_cap_9", metadata: { castId } },
      rodUiId: "basic",
      castId,
    },
  );

  assert.equal(result.wonderAwarded, 1);
  assert.equal(tx.getUserData().fishingWonderToday, 10);
  assert.equal(tx.ledgerWrites()[0]!.data.deltaCurrentWonder, 1);
});

test("applyFishingClaimInTransaction duplicate at fishingWonderToday 10 earns 0 wonder", async () => {
  const castId = "dup_cap_10";
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({
    currentWonder: 500,
    storedWonder: 500,
    lifetimeWonderEarned: 500,
    fishingWonderToday: 10,
    inventory: { parts: 0, baitMaterials: { feather: 0, scale: 0, glimmerdust: 0 } },
  });

  const result = await applyFishingClaimInTransaction(
    tx as unknown as FirebaseFirestore.Transaction,
    {
      uid: UID,
      userRef,
      data: tx.getUserData(),
      claim: { ...DUPLICATE_CLAIM, id: "claim_cap_10", metadata: { castId } },
      rodUiId: "basic",
      castId,
    },
  );

  assert.equal(result.wonderAwarded, 0);
  assert.equal(result.materialsAwarded, 1);
  assert.equal(tx.getUserData().fishingWonderToday, 10);
  assert.equal(tx.ledgerWrites()[0]!.data.deltaCurrentWonder, 0);
});

test("applyFishingClaimInTransaction partial cap at fishingWonderToday 9 with wonder 2 earns 1 only", async () => {
  const castId = "dup_cap_partial";
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const tx = new MockTransaction({
    currentWonder: 500,
    storedWonder: 500,
    lifetimeWonderEarned: 500,
    fishingWonderToday: 9,
    inventory: { parts: 0, baitMaterials: { feather: 0, scale: 0, glimmerdust: 0 } },
  });

  const highWonderDuplicate: FishingClaim = {
    ...DUPLICATE_CLAIM,
    id: "claim_cap_partial",
    wonderAwarded: 2,
    metadata: { castId },
  };

  const result = await applyFishingClaimInTransaction(
    tx as unknown as FirebaseFirestore.Transaction,
    {
      uid: UID,
      userRef,
      data: tx.getUserData(),
      claim: highWonderDuplicate,
      rodUiId: "basic",
      castId,
    },
  );

  assert.equal(result.wonderAwarded, 1);
  assert.equal(tx.getUserData().fishingWonderToday, 10);
  assert.equal(tx.ledgerWrites()[0]!.data.deltaCurrentWonder, 1);
});
