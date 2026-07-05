import type { EconomyLedgerEntry } from "./types";
import { idempotencyDocId, ledgerEntryIdForKey } from "./idempotency";

/** Stable idempotency key for a compensation against a specific ledger entry. */
export function compensationIdempotencyKey(correctsEntryId: string, reason: string): string {
  const reasonPart = idempotencyDocId(reason.trim() || "unspecified");
  return `compensation:${correctsEntryId}:${reasonPart}`;
}

export function buildCompensationLedgerEntry(input: {
  uid: string;
  correctsEntryId: string;
  idempotencyKey: string;
  deltaCurrentWonder: number;
  deltaStoredWonder: number;
  compensationReason: string;
  correlationId?: string;
  deltaParts?: number;
  deltaMaterials?: EconomyLedgerEntry["deltaMaterials"];
}): EconomyLedgerEntry {
  return {
    id: ledgerEntryIdForKey(input.idempotencyKey),
    uid: input.uid,
    timestamp: Date.now(),
    actionType: "compensation",
    source: "economy_compensation",
    deltaCurrentWonder: input.deltaCurrentWonder,
    deltaStoredWonder: input.deltaStoredWonder,
    deltaParts: input.deltaParts ?? 0,
    deltaMaterials: input.deltaMaterials ?? {},
    idempotencyKey: input.idempotencyKey,
    correlationId: input.correlationId,
    metadata: {
      correctsEntryId: input.correctsEntryId,
      compensationReason: input.compensationReason,
    },
    schemaVersion: 1,
  };
}

export function assertCompensationAllowed(originalEntry: EconomyLedgerEntry): void {
  if (originalEntry.actionType === "compensation") {
    throw new Error("Cannot compensate a compensation entry directly; use a new reason key");
  }
}
