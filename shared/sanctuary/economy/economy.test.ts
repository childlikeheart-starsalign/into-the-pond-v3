import assert from "node:assert/strict";
import test from "node:test";

import {
  applyWonderEarnInMemory,
  applyWonderSpendInMemory,
  assertNonNegativeAccount,
  buildAuditOnlyLedgerEntry,
  buildEconomyLedgerEntry,
} from "./applyLedgerEntry";
import { createEmptyWonderAccount } from "../wonder/ledger";
import { EconomyError } from "./types";
import { fishingClaimKey } from "./callableIdempotencyKeys";
import { idempotencyDocId, ledgerEntryIdForKey } from "./idempotency";
import { projectEconomyCommit } from "./projectEconomyCommit";

const UID = "test_user_economy";

test("applyWonderSpendInMemory throws INSUFFICIENT_WONDER when balance < cost", () => {
  const account = createEmptyWonderAccount(UID);
  account.currentWonder = 2;

  assert.throws(
    () =>
      applyWonderSpendInMemory(account, {
        source: "bait_craft",
        amount: 3,
        transactionId: "tx_spend_fail",
        pool: "current",
      }),
    (error: unknown) => {
      assert.ok(error instanceof EconomyError);
      assert.equal(error.code, "INSUFFICIENT_WONDER");
      return true;
    },
  );
});

test("applyWonderSpendInMemory rejects zero or negative amounts", () => {
  const account = createEmptyWonderAccount(UID);
  account.currentWonder = 10;

  assert.throws(
    () =>
      applyWonderSpendInMemory(account, {
        source: "bait_craft",
        amount: 0,
        transactionId: "tx_zero",
        pool: "current",
      }),
    (error: unknown) => {
      assert.ok(error instanceof EconomyError);
      assert.equal(error.code, "INVALID_AMOUNT");
      return true;
    },
  );
});

test("random earn/spend sequences never produce negative balances", () => {
  let account = createEmptyWonderAccount(UID);
  let txCounter = 0;

  for (let step = 0; step < 200; step += 1) {
    const roll = (step * 17 + 3) % 10;
    if (roll < 6) {
      const amount = (roll % 3) + 1;
      const result = applyWonderEarnInMemory(account, {
        source: "practice_completion",
        amount,
        transactionId: `tx_earn_${txCounter++}`,
      });
      account = result.account;
    } else {
      const pool = roll % 2 === 0 ? "current" : "stored";
      const balance = pool === "current" ? account.currentWonder : account.storedWonder;
      if (balance <= 0) continue;
      const amount = Math.min(balance, (roll % 2) + 1);
      const result = applyWonderSpendInMemory(account, {
        source: "bait_craft",
        amount,
        transactionId: `tx_spend_${txCounter++}`,
        pool,
      });
      account = result.account;
    }

    assertNonNegativeAccount(account);
  }
});

test("buildEconomyLedgerEntry uses deterministic id from idempotency key", () => {
  const account = createEmptyWonderAccount(UID);
  account.currentWonder = 5;
  account.storedWonder = 5;

  const { account: next, transaction } = applyWonderEarnInMemory(account, {
    source: "well_question_answered",
    amount: 12,
    transactionId: "tx_well",
  });

  const key = "well_answer:2026-06-22";
  const entry = buildEconomyLedgerEntry({
    uid: UID,
    actionType: "well_reflection",
    source: "well_question_answered",
    transaction,
    idempotencyKey: key,
  });

  assert.equal(entry.id, ledgerEntryIdForKey(key));
  assert.equal(entry.deltaCurrentWonder, 12);
  assert.equal(entry.deltaStoredWonder, 12);
  assert.equal(entry.schemaVersion, 1);

  const projected = projectEconomyCommit({ nextAccount: next, entry });
  assert.equal(projected.nextAccount.currentWonder, 17);
  assert.equal(projected.userPatch.currentWonder, 17);
});

test("idempotencyDocId sanitizes unsafe characters", () => {
  const id = idempotencyDocId("fishing_claim:cast/123?x=1");
  assert.ok(!id.includes("/"));
  assert.ok(!id.includes("?"));
});

test("callable idempotency key builders are stable", async () => {
  const { castCreateKey, craftCollectKey, wellRerollKey, purchaseVerifyKey } =
    await import("./callableIdempotencyKeys");

  assert.equal(castCreateKey("req-1"), "cast_create:req-1");
  assert.equal(craftCollectKey("rare_fire"), "craft_collect:rare_fire");
  assert.equal(wellRerollKey("2026-06-22", "abc"), "well_reroll:2026-06-22:abc");
  assert.equal(purchaseVerifyKey("tx_99"), "purchase_verify:tx_99");
});

test("idempotencyDocId avoids collisions for long keys", () => {
  const a = idempotencyDocId(`cast_create:${"x".repeat(500)}`);
  const b = idempotencyDocId(`cast_create:${"y".repeat(500)}`);
  assert.notEqual(a, b);
  assert.ok(a.length <= 200 || a.includes("_"));
});

test("assertLedgerMatchesAccount rejects mismatched wonder deltas", async () => {
  const { assertLedgerMatchesAccount } = await import("./applyLedgerEntry");
  const account = createEmptyWonderAccount(UID);
  account.currentWonder = 10;
  account.storedWonder = 10;
  const next = { ...account, currentWonder: 15, storedWonder: 15, updatedAt: Date.now() };
  const entry = {
    id: "ledger_test",
    uid: UID,
    timestamp: Date.now(),
    actionType: "practice_complete" as const,
    source: "practice_completion" as const,
    deltaCurrentWonder: 3,
    deltaStoredWonder: 3,
    deltaParts: 0,
    deltaMaterials: {},
    idempotencyKey: "k",
    metadata: {},
    schemaVersion: 1 as const,
  };

  assert.throws(
    () => assertLedgerMatchesAccount(account, next, entry),
    (error: unknown) => {
      assert.ok(error instanceof EconomyError);
      return true;
    },
  );
});

test("ledger fold sequence matches iterative earn/spend", () => {
  let account = createEmptyWonderAccount(UID);
  const entries = [];

  const earn = applyWonderEarnInMemory(account, {
    source: "practice_completion",
    amount: 5,
    transactionId: "tx1",
  });
  account = earn.account;
  entries.push(
    buildEconomyLedgerEntry({
      uid: UID,
      actionType: "practice_complete",
      source: "practice_completion",
      transaction: earn.transaction,
      idempotencyKey: "practice:day:kind1",
    }),
  );

  const spend = applyWonderSpendInMemory(account, {
    source: "bait_craft",
    amount: 2,
    transactionId: "tx2",
    pool: "current",
  });
  account = spend.account;
  entries.push(
    buildEconomyLedgerEntry({
      uid: UID,
      actionType: "bait_craft",
      source: "bait_craft",
      transaction: spend.transaction,
      idempotencyKey: "bait_craft:req1",
    }),
  );

  let folded = createEmptyWonderAccount(UID);
  for (const entry of entries) {
    folded = {
      ...folded,
      currentWonder: folded.currentWonder + entry.deltaCurrentWonder,
      storedWonder: folded.storedWonder + entry.deltaStoredWonder,
      lifetimeWonderEarned: folded.lifetimeWonderEarned + Math.max(0, entry.deltaStoredWonder),
      updatedAt: Date.now(),
    };
  }

  assert.equal(folded.currentWonder, account.currentWonder);
  assert.equal(folded.storedWonder, account.storedWonder);
});

test("duplicate fishing ledger entry folds wonder and materials from single row", () => {
  const account = createEmptyWonderAccount(UID);
  account.currentWonder = 500;
  account.storedWonder = 500;
  account.lifetimeWonderEarned = 500;

  const castId = "cast_dup_fold";
  const claimId = "claim_dup_fold";
  const transactionId = `tx_${claimId}`;
  const metadata = {
    claimId,
    outcome: "duplicate" as const,
    creatureTypeId: "puddle-dart",
    duplicate: true,
  };

  const { account: nextAccount, transaction } = applyWonderEarnInMemory(account, {
    source: "fishing_duplicate_consolation",
    amount: 1,
    transactionId,
    metadata,
  });

  const entry = buildEconomyLedgerEntry({
    uid: UID,
    actionType: "fishing_claim",
    source: "fishing_duplicate_consolation",
    transaction,
    idempotencyKey: fishingClaimKey(castId),
    metadata,
    deltaMaterials: { feather: 1 },
  });

  assert.equal(entry.deltaCurrentWonder, 1);
  assert.equal(entry.deltaStoredWonder, 1);
  assert.equal(entry.deltaMaterials.feather, 1);
  assert.equal(entry.metadata.outcome, "duplicate");
  assert.equal(entry.metadata.creatureTypeId, "puddle-dart");
  assert.equal(entry.metadata.duplicate, true);
  assert.equal(entry.source, "fishing_duplicate_consolation");

  // Inv 10d: one ledger row folds both wonder and materials — no second entry required.
  const folded = {
    ...account,
    currentWonder: account.currentWonder + entry.deltaCurrentWonder,
    storedWonder: account.storedWonder + entry.deltaStoredWonder,
    lifetimeWonderEarned: account.lifetimeWonderEarned + Math.max(0, entry.deltaStoredWonder),
    updatedAt: Date.now(),
  };

  assert.equal(folded.currentWonder, 501);
  assert.equal(folded.storedWonder, 501);
  assert.equal(folded.lifetimeWonderEarned, 501);
  assert.equal(nextAccount.currentWonder, folded.currentWonder);
  assert.equal(nextAccount.storedWonder, folded.storedWonder);

  const projected = projectEconomyCommit({
    nextAccount,
    entry,
    additionalUserPatch: {
      inventory: { parts: 0, baitMaterials: { feather: 1, scale: 0, glimmerdust: 0 } },
    },
  });

  assert.equal(projected.nextAccount.currentWonder, 501);
  assert.equal(projected.userPatch.currentWonder, 501);
  assert.deepEqual(
    (projected.userPatch.inventory as { baitMaterials: { feather: number } }).baitMaterials,
    { feather: 1, scale: 0, glimmerdust: 0 },
  );
});

test("zero-wonder fishing ledger entry has materials delta only", () => {
  const entry = {
    id: ledgerEntryIdForKey("fishing_claim:cast_1"),
    uid: UID,
    timestamp: Date.now(),
    actionType: "fishing_claim" as const,
    source: "fishing_miss_consolation" as const,
    deltaCurrentWonder: 0,
    deltaStoredWonder: 0,
    deltaParts: 0,
    deltaMaterials: { feather: 2 },
    idempotencyKey: "fishing_claim:cast_1",
    metadata: { claimId: "claim_1" },
    schemaVersion: 1 as const,
  };

  const account = createEmptyWonderAccount(UID);
  const projected = projectEconomyCommit({
    nextAccount: account,
    entry,
    additionalUserPatch: {
      inventory: { parts: 0, baitMaterials: { feather: 2, scale: 0, glimmerdust: 0 } },
    },
  });

  assert.equal(projected.userPatch.currentWonder, 0);
  assert.deepEqual(
    (projected.userPatch.inventory as { baitMaterials: { feather: number } }).baitMaterials,
    {
      feather: 2,
      scale: 0,
      glimmerdust: 0,
    },
  );
});

test("compensationIdempotencyKey is stable for same inputs", async () => {
  const { compensationIdempotencyKey, buildCompensationLedgerEntry, assertCompensationAllowed } =
    await import("./compensation");

  const correctsId = ledgerEntryIdForKey("well_answer:2026-06-01");
  const key = compensationIdempotencyKey(correctsId, "ops_fix");
  assert.equal(key, compensationIdempotencyKey(correctsId, "ops_fix"));

  const entry = buildCompensationLedgerEntry({
    uid: UID,
    correctsEntryId: correctsId,
    idempotencyKey: key,
    deltaCurrentWonder: -2,
    deltaStoredWonder: 0,
    compensationReason: "ops_fix",
  });

  assert.equal(entry.id, ledgerEntryIdForKey(key));
  assert.equal(entry.actionType, "compensation");
  assert.equal(entry.metadata.correctsEntryId, correctsId);
  assert.throws(() => assertCompensationAllowed(entry));
});

test("compensation ledger deltas fold into account", async () => {
  const { compensationIdempotencyKey, buildCompensationLedgerEntry } =
    await import("./compensation");

  const account = createEmptyWonderAccount(UID);
  account.currentWonder = 10;
  account.storedWonder = 10;

  const correctsId = ledgerEntryIdForKey("fishing_claim:cast_1");
  const key = compensationIdempotencyKey(correctsId, "refund");
  const entry = buildCompensationLedgerEntry({
    uid: UID,
    correctsEntryId: correctsId,
    idempotencyKey: key,
    deltaCurrentWonder: 5,
    deltaStoredWonder: 5,
    compensationReason: "refund",
  });

  const next = {
    ...account,
    currentWonder: account.currentWonder + entry.deltaCurrentWonder,
    storedWonder: account.storedWonder + entry.deltaStoredWonder,
    lifetimeWonderEarned: account.lifetimeWonderEarned + Math.max(0, entry.deltaStoredWonder),
    updatedAt: Date.now(),
  };

  assert.equal(next.currentWonder, 15);
  assert.equal(next.storedWonder, 15);
});

test("buildAuditOnlyLedgerEntry produces zero wonder and material deltas", () => {
  const entry = buildAuditOnlyLedgerEntry({
    uid: UID,
    actionType: "cast_create",
    idempotencyKey: "cast_create:req_1",
    source: "fishing_catch",
    correlationId: "cast_abc",
    metadata: { castId: "cast_abc", baitDeducted: false },
  });

  assert.equal(entry.deltaCurrentWonder, 0);
  assert.equal(entry.deltaStoredWonder, 0);
  assert.equal(entry.deltaParts, 0);
  assert.deepEqual(entry.deltaMaterials, {});
  assert.equal(entry.actionType, "cast_create");
});

function syntheticLedgerEntry(index: number): import("./types").EconomyLedgerEntry {
  const earn = index % 3 !== 0;
  const delta = earn ? 1 : -1;
  return {
    id: `ledger_${String(index).padStart(4, "0")}`,
    uid: UID,
    timestamp: 1_700_000_000_000 + index,
    actionType: "practice_complete",
    source: "practice_completion",
    deltaCurrentWonder: delta,
    deltaStoredWonder: earn ? delta : 0,
    deltaParts: index % 5 === 0 ? 1 : 0,
    deltaMaterials: index % 7 === 0 ? { feather: 1 } : {},
    idempotencyKey: `practice:sim:${index}`,
    metadata: {},
    schemaVersion: 1,
  };
}

test("checkpoint + tail projection equals full ledger fold", async () => {
  const {
    buildCheckpointFromSortedEntries,
    projectionFromCheckpointAndEntries,
    projectionFromLedgerEntries,
    sortLedgerEntriesByTimestamp,
  } = await import("./foldLedger");
  const { COMPACT_KEEP_TAIL_ENTRIES } = await import("./compactionConstants");

  const entries = Array.from({ length: 500 }, (_, i) => syntheticLedgerEntry(i + 1));
  const sorted = sortLedgerEntriesByTimestamp(entries);
  const checkpoint = buildCheckpointFromSortedEntries(sorted, COMPACT_KEEP_TAIL_ENTRIES, "admin");
  assert.ok(checkpoint);

  const tail = sorted.slice(checkpoint.foldedEntryCount);
  const fromCheckpoint = projectionFromCheckpointAndEntries(checkpoint, tail);
  const fromFull = projectionFromLedgerEntries(sorted);

  assert.equal(fromCheckpoint.currentWonder, fromFull.currentWonder);
  assert.equal(fromCheckpoint.storedWonder, fromFull.storedWonder);
  assert.equal(fromCheckpoint.lifetimeWonderEarned, fromFull.lifetimeWonderEarned);
  assert.equal(fromCheckpoint.parts, fromFull.parts);
  assert.deepEqual(fromCheckpoint.baitMaterials, fromFull.baitMaterials);
});

test("lifetimeWonderEarned preserved across checkpoint boundary", async () => {
  const {
    buildCheckpointFromSortedEntries,
    projectionFromCheckpointAndEntries,
    computeLifetimeWonderEarned,
    sortLedgerEntriesByTimestamp,
  } = await import("./foldLedger");

  const entries = [
    syntheticLedgerEntry(1),
    { ...syntheticLedgerEntry(2), deltaCurrentWonder: 5, deltaStoredWonder: 5 },
    syntheticLedgerEntry(3),
  ];
  const sorted = sortLedgerEntriesByTimestamp(entries);
  const checkpoint = buildCheckpointFromSortedEntries(sorted, 1, "admin");
  assert.ok(checkpoint);
  assert.equal(checkpoint.lifetimeWonderEarned, computeLifetimeWonderEarned(sorted.slice(0, 2)));

  const tail = sorted.slice(checkpoint.foldedEntryCount);
  const projection = projectionFromCheckpointAndEntries(checkpoint, tail);
  assert.equal(projection.lifetimeWonderEarned, computeLifetimeWonderEarned(sorted));
});

test("computeProjectionFromLedgerState matches full fold with pending entry", async () => {
  const {
    buildCheckpointFromSortedEntries,
    projectionFromLedgerEntries,
    sortLedgerEntriesByTimestamp,
  } = await import("./foldLedger");
  const { computeProjectionFromLedgerState } = await import("./computeEconomyProjection");
  const { COMPACT_KEEP_TAIL_ENTRIES } = await import("./compactionConstants");

  const committed = Array.from({ length: 120 }, (_, i) => syntheticLedgerEntry(i + 1));
  const sorted = sortLedgerEntriesByTimestamp(committed);
  const checkpoint = buildCheckpointFromSortedEntries(
    sorted,
    COMPACT_KEEP_TAIL_ENTRIES,
    "scheduled",
  );
  assert.ok(checkpoint);
  const tail = sorted.slice(checkpoint.foldedEntryCount);
  const pending = syntheticLedgerEntry(999);

  const { projection } = computeProjectionFromLedgerState({
    checkpoint,
    tailEntries: tail,
    pendingEntry: pending,
  });
  const full = projectionFromLedgerEntries([...sorted, pending]);
  assert.equal(projection.currentWonder, full.currentWonder);
  assert.equal(projection.lifetimeWonderEarned, full.lifetimeWonderEarned);
});
