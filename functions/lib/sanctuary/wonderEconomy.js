"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wonderAccountFromDoc = wonderAccountFromDoc;
exports.wonderFieldsPatch = wonderFieldsPatch;
exports.persistWonderTransaction = persistWonderTransaction;
exports.earnWonder = earnWonder;
exports.spendCurrentWonder = spendCurrentWonder;
exports.recordAnalyticsEvent = recordAnalyticsEvent;
const firestore_1 = require("firebase-admin/firestore");
const wonderLedger_1 = require("./wonderLedger");
const LEGACY_ECONOMY_MUTATION_ERROR =
  "Direct wonder balance writes are disabled. Use commitEconomyAction (sanctuary/economy/commitEconomyAction.ts).";
function wonderAccountFromDoc(uid, data) {
  if (data.currentWonder != null && data.storedWonder != null) {
    return {
      userId: uid,
      currentWonder: data.currentWonder,
      storedWonder: data.storedWonder,
      lifetimeWonderEarned: data.lifetimeWonderEarned ?? data.storedWonder,
      updatedAt: Date.now(),
    };
  }
  return (0, wonderLedger_1.migrateFromLegacyTotalWonder)(uid, data.totalWonder ?? 0);
}
/** @deprecated Use wonderFieldsPatchFromAccount from economy/applyLedgerEntry. */
function wonderFieldsPatch(account) {
  return {
    currentWonder: account.currentWonder,
    storedWonder: account.storedWonder,
    lifetimeWonderEarned: account.lifetimeWonderEarned,
    totalWonder: account.currentWonder,
  };
}
/** @deprecated Use commitEconomyAction — wonderTransactions are written inside the economy commit tx. */
async function persistWonderTransaction(_userRef, _transaction) {
  throw new Error(LEGACY_ECONOMY_MUTATION_ERROR);
}
/** @deprecated Use commitEconomyAction with applyWonderEarnInMemory. */
async function earnWonder(_userRef, _uid, _data, _source, _amount, _metadata, _options) {
  throw new Error(LEGACY_ECONOMY_MUTATION_ERROR);
}
/** @deprecated Use commitEconomyAction with applyWonderSpendInMemory. */
async function spendCurrentWonder(_userRef, _uid, _data, _source, _amount, _metadata) {
  throw new Error(LEGACY_ECONOMY_MUTATION_ERROR);
}
async function recordAnalyticsEvent(userRef, event) {
  await userRef.collection("sanctuaryAnalytics").add({
    ...event,
    recordedAt: firestore_1.FieldValue.serverTimestamp(),
  });
}
