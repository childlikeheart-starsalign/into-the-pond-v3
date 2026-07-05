const assert = require("node:assert/strict");
const test = require("node:test");

const {
  fishingClaimKey,
  ledgerEntryIdForKey,
  shouldSkipWonderTransactionForBackfill,
  synthesizeFishingClaimEntry,
  synthesizeWonderTransactionEntry,
} = require("./backfill-economy-ledger-from-wonder-tx.js");

test("shouldSkipWonderTransactionForBackfill skips fishing sources", () => {
  const existingLedgerIds = new Set();
  const fishingCastIds = new Set();

  assert.equal(
    shouldSkipWonderTransactionForBackfill(
      { source: "fishing_catch", metadata: { castId: "cast_1" } },
      existingLedgerIds,
      fishingCastIds,
    ),
    true,
  );
});

test("shouldSkipWonderTransactionForBackfill skips wonderTx when fishingClaim castId exists", () => {
  const castId = "cast_dup";
  const existingLedgerIds = new Set();
  const fishingCastIds = new Set([castId]);

  assert.equal(
    shouldSkipWonderTransactionForBackfill(
      {
        source: "practice_completion",
        actionType: "practice_complete",
        metadata: { castId },
      },
      existingLedgerIds,
      fishingCastIds,
    ),
    true,
  );
});

test("shouldSkipWonderTransactionForBackfill skips when fishing_claim ledger id exists", () => {
  const castId = "cast_live";
  const existingLedgerIds = new Set([ledgerEntryIdForKey(fishingClaimKey(castId))]);
  const fishingCastIds = new Set();

  assert.equal(
    shouldSkipWonderTransactionForBackfill(
      { source: "practice_completion", metadata: { castId } },
      existingLedgerIds,
      fishingCastIds,
    ),
    true,
  );
});

test("shouldSkipWonderTransactionForBackfill keeps non-fishing wonderTx", () => {
  assert.equal(
    shouldSkipWonderTransactionForBackfill(
      { source: "practice_completion", actionType: "practice_complete", metadata: {} },
      new Set(),
      new Set(),
    ),
    false,
  );
});

test("wonderTx + fishingClaim same cast synthesize only fishing_claim ledger id", () => {
  const castId = "cast_fixture";
  const uid = "user_fixture";

  const claimEntry = synthesizeFishingClaimEntry(uid, {
    id: "claim_1",
    data: {
      castId,
      wonderAwarded: 3,
      materialsAwarded: 1,
      outcome: "duplicate",
    },
  });
  const wonderEntry = synthesizeWonderTransactionEntry(uid, {
    id: "tx_1",
    source: "fishing_duplicate_consolation",
    amount: 3,
    metadata: { castId },
  });

  assert.notEqual(claimEntry.id, wonderEntry.id);
  assert.equal(
    shouldSkipWonderTransactionForBackfill(
      {
        id: "tx_1",
        source: "fishing_duplicate_consolation",
        metadata: { castId },
      },
      new Set([claimEntry.id]),
      new Set([castId]),
    ),
    true,
  );
});
