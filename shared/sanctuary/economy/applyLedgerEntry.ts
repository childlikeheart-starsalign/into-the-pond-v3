import type { WonderAccount, WonderSource, WonderTransaction } from "../types";
import {
  applyWonderEarn,
  applyWonderSpend,
  type ApplyWonderEarnInput,
  type ApplyWonderSpendInput,
  type WonderPool,
} from "../wonder/ledger";

import type { EconomyActionType, EconomyLedgerEntry } from "./types";
import { EconomyError } from "./types";
import { ledgerEntryIdForKey } from "./idempotency";

export type WonderEarnInMemoryInput = {
  source: WonderSource;
  amount: number;
  transactionId: string;
  metadata?: Record<string, unknown>;
  pool?: WonderPool;
};

export type WonderSpendInMemoryInput = {
  source: WonderSource;
  amount: number;
  transactionId: string;
  metadata?: Record<string, unknown>;
  pool: "current" | "stored";
};

export function assertNonNegativeAccount(account: WonderAccount): void {
  if (account.currentWonder < 0 || account.storedWonder < 0) {
    throw new EconomyError("NEGATIVE_BALANCE_GUARD", "Wonder balance cannot be negative", {
      currentWonder: account.currentWonder,
      storedWonder: account.storedWonder,
    });
  }
}

/** Invariant 4: ledger deltas must match account transition from prior to next snapshot. */
export function assertLedgerMatchesAccount(
  priorAccount: WonderAccount,
  nextAccount: WonderAccount,
  entry: EconomyLedgerEntry,
): void {
  const deltaCurrent = nextAccount.currentWonder - priorAccount.currentWonder;
  const deltaStored = nextAccount.storedWonder - priorAccount.storedWonder;

  if (deltaCurrent !== entry.deltaCurrentWonder || deltaStored !== entry.deltaStoredWonder) {
    throw new EconomyError(
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

function wrapLedgerError(
  error: unknown,
  pool: "current" | "stored",
  balance: number,
  amount: number,
): never {
  if (error instanceof Error && error.message.includes("Insufficient")) {
    throw new EconomyError("INSUFFICIENT_WONDER", error.message, { pool, balance, amount });
  }
  if (error instanceof EconomyError) throw error;
  throw error;
}

/** Earn wonder in memory — delegates to shared wonder ledger. */
export function applyWonderEarnInMemory(
  account: WonderAccount,
  input: WonderEarnInMemoryInput,
): { account: WonderAccount; transaction: WonderTransaction } {
  if (input.amount <= 0) {
    throw new EconomyError("INVALID_AMOUNT", "Earn amount must be positive", {
      amount: input.amount,
    });
  }

  try {
    return applyWonderEarn({
      account,
      source: input.source,
      amount: input.amount,
      transactionId: input.transactionId,
      metadata: input.metadata,
      pool: input.pool,
    } satisfies ApplyWonderEarnInput);
  } catch (error) {
    if (error instanceof EconomyError) throw error;
    throw error;
  }
}

/** Spend wonder in memory — validates balance >= cost before applying. */
export function applyWonderSpendInMemory(
  account: WonderAccount,
  input: WonderSpendInMemoryInput,
): { account: WonderAccount; transaction: WonderTransaction } {
  if (input.amount <= 0) {
    throw new EconomyError("INVALID_AMOUNT", "Spend amount must be positive", {
      amount: input.amount,
    });
  }

  const balance = input.pool === "current" ? account.currentWonder : account.storedWonder;
  if (balance < input.amount) {
    throw new EconomyError("INSUFFICIENT_WONDER", `Insufficient ${input.pool} Wonder`, {
      pool: input.pool,
      balance,
      amount: input.amount,
    });
  }

  try {
    return applyWonderSpend({
      account,
      source: input.source,
      amount: input.amount,
      transactionId: input.transactionId,
      metadata: input.metadata,
      pool: input.pool,
    } satisfies ApplyWonderSpendInput);
  } catch (error) {
    wrapLedgerError(error, input.pool, balance, input.amount);
  }
}

export function wonderFieldsPatchFromAccount(account: WonderAccount): Record<string, unknown> {
  return {
    currentWonder: account.currentWonder,
    storedWonder: account.storedWonder,
    lifetimeWonderEarned: account.lifetimeWonderEarned,
    totalWonder: account.currentWonder,
  };
}

export function wonderDeltasFromTransaction(transaction: WonderTransaction): {
  deltaCurrentWonder: number;
  deltaStoredWonder: number;
} {
  const pool = transaction.metadata.pool as "current" | "stored" | undefined;
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

export function buildEconomyLedgerEntry(input: {
  uid: string;
  actionType: EconomyActionType;
  source: WonderSource;
  transaction: WonderTransaction;
  idempotencyKey: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  deltaParts?: number;
  deltaMaterials?: EconomyLedgerEntry["deltaMaterials"];
}): EconomyLedgerEntry {
  const { deltaCurrentWonder, deltaStoredWonder } = wonderDeltasFromTransaction(input.transaction);
  const entryId = ledgerEntryIdForKey(input.idempotencyKey);

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
export function legacyWonderTransactionAmount(entry: EconomyLedgerEntry): number {
  if (entry.deltaCurrentWonder !== 0) return entry.deltaCurrentWonder;
  return entry.deltaStoredWonder;
}

/** Zero-delta audit ledger row (craft collect, rod equip, cast create). */
export function buildAuditOnlyLedgerEntry(input: {
  uid: string;
  actionType: EconomyActionType;
  idempotencyKey: string;
  source: WonderSource;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}): EconomyLedgerEntry {
  const transactionId = `tx_audit_${ledgerEntryIdForKey(input.idempotencyKey)}`;
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
