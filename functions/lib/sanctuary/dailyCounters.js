"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUtcMidnightMs = getUtcMidnightMs;
exports.shouldResetDailyCounter = shouldResetDailyCounter;
exports.buildDailyResetPatch = buildDailyResetPatch;
exports.applyOperationalCounterResetsInTransaction = applyOperationalCounterResetsInTransaction;
exports.utcDateKey = utcDateKey;
const firestore_1 = require("firebase-admin/firestore");
function getUtcMidnightMs(now = new Date()) {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}
function shouldResetDailyCounter(lastReset, now = new Date()) {
  if (!lastReset) return true;
  return lastReset.toMillis() < getUtcMidnightMs(now);
}
function buildDailyResetPatch(data, fieldName, dateFieldName, now = new Date()) {
  const lastReset = data[dateFieldName] ?? null;
  if (!shouldResetDailyCounter(lastReset, now)) {
    return null;
  }
  return {
    [fieldName]: 0,
    [dateFieldName]: firestore_1.Timestamp.fromDate(now),
  };
}
/** Lazy UTC daily counter reset — Invariant 4 exempt; no ledger row. */
function applyOperationalCounterResetsInTransaction(tx, userRef, data, now = new Date()) {
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
  if (Object.keys(patch).length === 0) return;
  tx.set(userRef, patch, { merge: true });
  Object.assign(data, patch);
}
function utcDateKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}
