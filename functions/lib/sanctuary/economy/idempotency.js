"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyDocId = idempotencyDocId;
exports.buildIdempotencyRecord = buildIdempotencyRecord;
exports.ledgerEntryIdForKey = ledgerEntryIdForKey;
/** Stable Firestore document id for an idempotency key (max 1500 bytes). */
function idempotencyDocId(key) {
  const trimmed = key.trim();
  if (!trimmed) return "idem_empty";
  const sanitized = trimmed.replace(/[^a-zA-Z0-9._:-]/g, "_");
  if (sanitized.length <= 200) return sanitized;
  let hash = 5381;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash * 33) ^ trimmed.charCodeAt(i);
  }
  const hashSuffix = (hash >>> 0).toString(36);
  return `${sanitized.slice(0, 160)}_${hashSuffix}`;
}
function buildIdempotencyRecord(idempotencyKey, ledgerEntryId, response, committedAt = Date.now()) {
  return {
    idempotencyKey,
    ledgerEntryId,
    committedAt,
    response,
  };
}
function ledgerEntryIdForKey(idempotencyKey) {
  return `ledger_${idempotencyDocId(idempotencyKey)}`;
}
