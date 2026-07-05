import type { EconomyIdempotencyRecord } from "./types";

/** Stable Firestore document id for an idempotency key (max 1500 bytes). */
export function idempotencyDocId(key: string): string {
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

export function buildIdempotencyRecord<T>(
  idempotencyKey: string,
  ledgerEntryId: string,
  response: T,
  committedAt = Date.now(),
): EconomyIdempotencyRecord<T> {
  return {
    idempotencyKey,
    ledgerEntryId,
    committedAt,
    response,
  };
}

export function ledgerEntryIdForKey(idempotencyKey: string): string {
  return `ledger_${idempotencyDocId(idempotencyKey)}`;
}
