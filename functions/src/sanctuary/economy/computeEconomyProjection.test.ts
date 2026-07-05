import assert from "node:assert/strict";
import test from "node:test";

import {
  COMPACT_TAIL_HARD_LIMIT,
  computeEconomyProjectionInTransaction,
  MAX_LEDGER_READS_PER_TX,
} from "./computeEconomyProjection";
import { buildCheckpointFromSortedEntries, sortLedgerEntriesByTimestamp } from "./foldLedger";
import { COMPACT_KEEP_TAIL_ENTRIES } from "./compactionConstants";
import { EconomyError, ECONOMY_LEDGER_CHECKPOINT_DOC_ID, type EconomyLedgerEntry } from "./types";

const UID = "ledger_cap_uid";

type MockDocRef = {
  path: string;
  collection: (name: string) => MockDocRef;
  doc: (id: string) => MockDocRef;
};

type MockLedgerTailQuery = {
  _isLedgerTailQuery: true;
  ledgerPath: string;
  minTimestampExclusive: number;
};

function mockRef(path: string): MockDocRef {
  return {
    path,
    collection: (name: string) => {
      const collectionPath = `${path}/${name}`;
      if (name === "economyLedger") {
        return mockLedgerCollection(collectionPath);
      }
      return mockRef(collectionPath);
    },
    doc: (id: string) => mockRef(`${path}/${id}`),
  };
}

function mockLedgerCollection(path: string): MockDocRef {
  const ref = mockRef(path);
  return Object.assign(ref, {
    where: (_field: string, _op: string, value: number) => ({
      orderBy: (_field: string, _dir: string) =>
        ({
          _isLedgerTailQuery: true,
          ledgerPath: path,
          minTimestampExclusive: value,
        }) satisfies MockLedgerTailQuery,
    }),
  });
}

function ledgerEntry(index: number): EconomyLedgerEntry {
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
  readonly ledger = new Map<string, EconomyLedgerEntry>();
  checkpoint: import("./types").EconomyLedgerCheckpoint | null = null;

  seedEntries(count: number) {
    for (let i = 1; i <= count; i += 1) {
      const entry = ledgerEntry(i);
      this.ledger.set(entry.id, entry);
    }
  }

  async get(ref: MockDocRef | MockLedgerTailQuery) {
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

    if (ref.path === `users/${UID}/economyLedgerCheckpoint/${ECONOMY_LEDGER_CHECKPOINT_DOC_ID}`) {
      return {
        exists: this.checkpoint !== null,
        data: () => this.checkpoint ?? undefined,
      };
    }

    return { exists: false, data: () => undefined };
  }
}

test("computeEconomyProjectionInTransaction throws LEDGER_READ_LIMIT without checkpoint at 450+ entries", async () => {
  const tx = new LedgerCapTransaction();
  tx.seedEntries(MAX_LEDGER_READS_PER_TX);
  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const pending = ledgerEntry(9999);

  await assert.rejects(
    () =>
      computeEconomyProjectionInTransaction(
        tx as unknown as FirebaseFirestore.Transaction,
        userRef,
        pending,
      ),
    (error: unknown) => {
      assert.ok(error instanceof EconomyError);
      assert.equal(error.code, "LEDGER_READ_LIMIT");
      return true;
    },
  );
});

test("computeEconomyProjectionInTransaction succeeds with checkpoint + tail for 500 entries", async () => {
  const tx = new LedgerCapTransaction();
  tx.seedEntries(500);
  const sorted = sortLedgerEntriesByTimestamp([...tx.ledger.values()]);
  tx.checkpoint = buildCheckpointFromSortedEntries(sorted, COMPACT_KEEP_TAIL_ENTRIES, "admin");
  assert.ok(tx.checkpoint);

  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const pending = ledgerEntry(9999);

  const { projection, meta } = await computeEconomyProjectionInTransaction(
    tx as unknown as FirebaseFirestore.Transaction,
    userRef,
    pending,
  );

  assert.equal(meta.usedCheckpoint, true);
  assert.equal(meta.tailEntryCount, COMPACT_KEEP_TAIL_ENTRIES);
  assert.ok(projection.currentWonder > 0);
});

test("computeEconomyProjectionInTransaction throws when tail exceeds COMPACT_TAIL_HARD_LIMIT", async () => {
  const tx = new LedgerCapTransaction();
  tx.seedEntries(COMPACT_TAIL_HARD_LIMIT);
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

  const userRef = mockRef(`users/${UID}`) as unknown as FirebaseFirestore.DocumentReference;
  const pending = ledgerEntry(9999);

  await assert.rejects(
    () =>
      computeEconomyProjectionInTransaction(
        tx as unknown as FirebaseFirestore.Transaction,
        userRef,
        pending,
      ),
    (error: unknown) => {
      assert.ok(error instanceof EconomyError);
      assert.equal(error.code, "LEDGER_READ_LIMIT");
      return true;
    },
  );
});
