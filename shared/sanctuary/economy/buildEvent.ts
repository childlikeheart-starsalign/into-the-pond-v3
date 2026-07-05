import type { BuildEconomyEventInput, EconomyLedgerEvent } from "./types";
import { ECONOMY_LEDGER_SCHEMA_VERSION } from "./types";

export function buildEconomyLedgerEvent(input: BuildEconomyEventInput): EconomyLedgerEvent {
  const now = input.now ?? Date.now();
  const eventId = input.eventId ?? `evt_${input.uid}_${input.sequence}_${now}`;

  return {
    id: eventId,
    uid: input.uid,
    sequence: input.sequence,
    timestamp: now,
    schemaVersion: ECONOMY_LEDGER_SCHEMA_VERSION,
    eventType: input.eventType,
    idempotencyKey: input.idempotencyKey,
    correlationId: input.correlationId,
    source: input.source,
    deltas: input.deltas,
    metadata: input.metadata ?? {},
  };
}

export function sanitizeIdempotencyDocId(key: string): string {
  const sanitized = key.replace(/[/\\]/g, "__").trim();
  if (!sanitized) return "empty_key";
  return sanitized.length > 1200 ? sanitized.slice(0, 1200) : sanitized;
}
