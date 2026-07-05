"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compensationIdempotencyKey = compensationIdempotencyKey;
exports.buildCompensationLedgerEntry = buildCompensationLedgerEntry;
exports.assertCompensationAllowed = assertCompensationAllowed;
const idempotency_1 = require("./idempotency");
/** Stable idempotency key for a compensation against a specific ledger entry. */
function compensationIdempotencyKey(correctsEntryId, reason) {
  const reasonPart = (0, idempotency_1.idempotencyDocId)(reason.trim() || "unspecified");
  return `compensation:${correctsEntryId}:${reasonPart}`;
}
function buildCompensationLedgerEntry(input) {
  return {
    id: (0, idempotency_1.ledgerEntryIdForKey)(input.idempotencyKey),
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
function assertCompensationAllowed(originalEntry) {
  if (originalEntry.actionType === "compensation") {
    throw new Error("Cannot compensate a compensation entry directly; use a new reason key");
  }
}
