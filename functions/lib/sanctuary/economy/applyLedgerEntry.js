"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNonNegativeAccount = assertNonNegativeAccount;
exports.assertLedgerMatchesAccount = assertLedgerMatchesAccount;
exports.applyWonderEarnInMemory = applyWonderEarnInMemory;
exports.applyWonderSpendInMemory = applyWonderSpendInMemory;
exports.wonderFieldsPatchFromAccount = wonderFieldsPatchFromAccount;
exports.wonderDeltasFromTransaction = wonderDeltasFromTransaction;
exports.buildEconomyLedgerEntry = buildEconomyLedgerEntry;
exports.legacyWonderTransactionAmount = legacyWonderTransactionAmount;
exports.buildAuditOnlyLedgerEntry = buildAuditOnlyLedgerEntry;
const wonderLedger_1 = require("../wonderLedger");
const types_1 = require("./types");
const idempotency_1 = require("./idempotency");
function assertNonNegativeAccount(account) {
  if (account.currentWonder < 0 || account.storedWonder < 0) {
    throw new types_1.EconomyError("NEGATIVE_BALANCE_GUARD", "Wonder balance cannot be negative", {
      currentWonder: account.currentWonder,
      storedWonder: account.storedWonder,
    });
  }
}
/** Invariant 4: ledger deltas must match account transition from prior to next snapshot. */
function assertLedgerMatchesAccount(priorAccount, nextAccount, entry) {
  const deltaCurrent = nextAccount.currentWonder - priorAccount.currentWonder;
  const deltaStored = nextAccount.storedWonder - priorAccount.storedWonder;
  if (deltaCurrent !== entry.deltaCurrentWonder || deltaStored !== entry.deltaStoredWonder) {
    throw new types_1.EconomyError(
      "NEGATIVE_BALANCE_GUARD",
      "Ledger entry wonder deltas do not match account transition",
      {
        deltaCurrent,
        deltaStored,
        entryDeltaCurrent: entry.deltaCurrentWonder,
        entryDeltaStored: entry.deltaStoredWonder,
        entryId: entry.id,
      },
    );
  }
}
function wrapLedgerError(error, pool, balance, amount) {
  if (error instanceof Error && error.message.includes("Insufficient")) {
    throw new types_1.EconomyError("INSUFFICIENT_WONDER", error.message, { pool, balance, amount });
  }
  if (error instanceof types_1.EconomyError) throw error;
  throw error;
}
/** Earn wonder in memory — delegates to shared wonder ledger. */
function applyWonderEarnInMemory(account, input) {
  if (input.amount <= 0) {
    throw new types_1.EconomyError("INVALID_AMOUNT", "Earn amount must be positive", {
      amount: input.amount,
    });
  }
  try {
    return (0, wonderLedger_1.applyWonderEarn)({
      account,
      source: input.source,
      amount: input.amount,
      transactionId: input.transactionId,
      metadata: input.metadata,
      pool: input.pool,
    });
  } catch (error) {
    if (error instanceof types_1.EconomyError) throw error;
    throw error;
  }
}
/** Spend wonder in memory — validates balance >= cost before applying. */
function applyWonderSpendInMemory(account, input) {
  if (input.amount <= 0) {
    throw new types_1.EconomyError("INVALID_AMOUNT", "Spend amount must be positive", {
      amount: input.amount,
    });
  }
  const balance = input.pool === "current" ? account.currentWonder : account.storedWonder;
  if (balance < input.amount) {
    throw new types_1.EconomyError("INSUFFICIENT_WONDER", `Insufficient ${input.pool} Wonder`, {
      pool: input.pool,
      balance,
      amount: input.amount,
    });
  }
  try {
    return (0, wonderLedger_1.applyWonderSpend)({
      account,
      source: input.source,
      amount: input.amount,
      transactionId: input.transactionId,
      metadata: input.metadata,
      pool: input.pool,
    });
  } catch (error) {
    wrapLedgerError(error, input.pool, balance, input.amount);
  }
}
function wonderFieldsPatchFromAccount(account) {
  return {
    currentWonder: account.currentWonder,
    storedWonder: account.storedWonder,
    lifetimeWonderEarned: account.lifetimeWonderEarned,
    totalWonder: account.currentWonder,
  };
}
function wonderDeltasFromTransaction(transaction) {
  const pool = transaction.metadata.pool;
  if (transaction.amount >= 0) {
    return {
      deltaCurrentWonder: transaction.amount,
      deltaStoredWonder: transaction.amount,
    };
  }
  if (pool === "stored") {
    return { deltaCurrentWonder: 0, deltaStoredWonder: transaction.amount };
  }
  return { deltaCurrentWonder: transaction.amount, deltaStoredWonder: 0 };
}
function buildEconomyLedgerEntry(input) {
  const { deltaCurrentWonder, deltaStoredWonder } = wonderDeltasFromTransaction(input.transaction);
  const entryId = (0, idempotency_1.ledgerEntryIdForKey)(input.idempotencyKey);
  return {
    id: entryId,
    uid: input.uid,
    timestamp: input.transaction.timestamp,
    actionType: input.actionType,
    source: input.source,
    deltaCurrentWonder,
    deltaStoredWonder,
    deltaParts: input.deltaParts ?? 0,
    deltaMaterials: input.deltaMaterials ?? {},
    idempotencyKey: input.idempotencyKey,
    correlationId: input.correlationId,
    metadata: {
      ...input.transaction.metadata,
      ...(input.metadata ?? {}),
      wonderTransactionId: input.transaction.id,
    },
    schemaVersion: 1,
  };
}
/** Legacy single-field amount for wonderTransactions dual-write during migration. */
function legacyWonderTransactionAmount(entry) {
  if (entry.deltaCurrentWonder !== 0) return entry.deltaCurrentWonder;
  return entry.deltaStoredWonder;
}
/** Zero-delta audit ledger row (craft collect, rod equip, cast create). */
function buildAuditOnlyLedgerEntry(input) {
  const transactionId = `tx_audit_${(0, idempotency_1.ledgerEntryIdForKey)(input.idempotencyKey)}`;
  return buildEconomyLedgerEntry({
    uid: input.uid,
    actionType: input.actionType,
    source: input.source,
    transaction: {
      id: transactionId,
      userId: input.uid,
      timestamp: Date.now(),
      source: input.source,
      amount: 0,
      metadata: input.metadata ?? {},
    },
    idempotencyKey: input.idempotencyKey,
    correlationId: input.correlationId,
    metadata: input.metadata,
  });
}
