import { Timestamp } from "firebase-admin/firestore";

type DailyCounterField = "dailyQuestionCount" | "fishingWonderToday";
type DailyCounterDateField = "lastQuestionResetDate" | "lastFishingResetDate";

export function getUtcMidnightMs(now: Date = new Date()) {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function shouldResetDailyCounter(
  lastReset: Timestamp | null | undefined,
  now: Date = new Date(),
) {
  if (!lastReset) return true;
  return lastReset.toMillis() < getUtcMidnightMs(now);
}

export function buildDailyResetPatch(
  data: Record<string, unknown>,
  fieldName: DailyCounterField,
  dateFieldName: DailyCounterDateField,
  now: Date = new Date(),
) {
  const lastReset = (data[dateFieldName] as Timestamp | null | undefined) ?? null;
  if (!shouldResetDailyCounter(lastReset, now)) {
    return null;
  }
  return {
    [fieldName]: 0,
    [dateFieldName]: Timestamp.fromDate(now),
  };
}

/** Compute lazy UTC daily counter reset patch and mirror into `data` (no tx write). */
export function buildOperationalCounterResetPatch(
  data: Record<string, unknown>,
  now: Date = new Date(),
): Record<string, unknown> {
  const questionReset = buildDailyResetPatch(
    data,
    "dailyQuestionCount",
    "lastQuestionResetDate",
    now,
  );
  const fishingReset = buildDailyResetPatch(
    data,
    "fishingWonderToday",
    "lastFishingResetDate",
    now,
  );
  const patch = {
    ...(questionReset ?? {}),
    ...(fishingReset ?? {}),
  };
  if (Object.keys(patch).length === 0) return {};
  Object.assign(data, patch);
  return patch;
}

/**
 * Lazy UTC daily counter reset — Invariant 4 exempt; no ledger row.
 * Prefer merging `buildOperationalCounterResetPatch` into a later user write when the
 * same transaction still needs more reads (Firestore forbids read-after-write).
 */
export function applyOperationalCounterResetsInTransaction(
  tx: FirebaseFirestore.Transaction,
  userRef: FirebaseFirestore.DocumentReference,
  data: Record<string, unknown>,
  now: Date = new Date(),
) {
  const patch = buildOperationalCounterResetPatch(data, now);
  if (Object.keys(patch).length === 0) return;
  tx.set(userRef, patch, { merge: true });
}

export function utcDateKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
