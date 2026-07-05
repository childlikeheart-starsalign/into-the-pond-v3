"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foldLedgerEntries = void 0;
exports.buildReconcileReport = buildReconcileReport;
exports.loadAllLedgerEntries = loadAllLedgerEntries;
exports.loadLedgerFoldState = loadLedgerFoldState;
exports.reconcileUser = reconcileUser;
const init_1 = require("../../init");
const foldLedger_1 = require("./foldLedger");
Object.defineProperty(exports, "foldLedgerEntries", {
  enumerable: true,
  get: function () {
    return foldLedger_1.foldLedgerEntries;
  },
});
const foldBaitInventory_1 = require("./foldBaitInventory");
const types_1 = require("./types");
function emptyBaitValues() {
  return {
    feather_bait: 0,
    scale_bait: 0,
    glimmerdust_bait: 0,
    random_bait: 0,
  };
}
function readUserBaitValues(inventory) {
  const baits = inventory?.baits ?? {};
  return {
    feather_bait: baits.feather_bait ?? 0,
    scale_bait: baits.scale_bait ?? 0,
    glimmerdust_bait: baits.glimmerdust_bait ?? 0,
    random_bait: baits.random_bait ?? 0,
  };
}
function baitDrift(userBaits, ledgerBaits) {
  const drift = emptyBaitValues();
  for (const key of foldBaitInventory_1.CONSUMABLE_BAIT_KEYS) {
    drift[key] = userBaits[key] - ledgerBaits[key];
  }
  return drift;
}
function buildReconcileReport(
  uid,
  ledgerSums,
  ledgerEntryCount,
  userDocValues,
  ledgerLifetimeWonderEarned,
  ledgerBaits,
  usedCheckpoint = false,
) {
  const userBaits = userDocValues.baits ?? emptyBaitValues();
  const ledgerBaitValues = ledgerBaits;
  const driftBaits = baitDrift(userBaits, ledgerBaitValues);
  const drift = {
    currentWonder: userDocValues.currentWonder - ledgerSums.currentWonder,
    storedWonder: userDocValues.storedWonder - ledgerSums.storedWonder,
    parts: userDocValues.parts - ledgerSums.parts,
    feather: userDocValues.feather - ledgerSums.feather,
    scale: userDocValues.scale - ledgerSums.scale,
    glimmerdust: userDocValues.glimmerdust - ledgerSums.glimmerdust,
    lifetimeWonderEarned: userDocValues.lifetimeWonderEarned - ledgerLifetimeWonderEarned,
    baits: driftBaits,
  };
  const hasAggregateDrift = [
    drift.currentWonder,
    drift.storedWonder,
    drift.parts,
    drift.feather,
    drift.scale,
    drift.glimmerdust,
    drift.lifetimeWonderEarned,
  ].some((value) => value !== 0);
  const hasBaitDrift = foldBaitInventory_1.CONSUMABLE_BAIT_KEYS.some(
    (key) => driftBaits[key] !== 0,
  );
  return {
    uid,
    ledgerEntryCount,
    ledgerSums: {
      ...ledgerSums,
      lifetimeWonderEarned: ledgerLifetimeWonderEarned,
      baits: ledgerBaitValues,
    },
    userDocValues: {
      ...userDocValues,
      baits: userBaits,
    },
    drift,
    hasDrift: hasAggregateDrift || hasBaitDrift,
    usedCheckpoint,
  };
}
async function loadAllLedgerEntries(uid) {
  const snap = await init_1.db.collection("users").doc(uid).collection("economyLedger").get();
  return snap.docs.map((doc) => doc.data());
}
async function loadLedgerFoldState(uid) {
  const userRef = init_1.db.collection("users").doc(uid);
  const checkpointSnap = await userRef
    .collection("economyLedgerCheckpoint")
    .doc(types_1.ECONOMY_LEDGER_CHECKPOINT_DOC_ID)
    .get();
  if (!checkpointSnap.exists) {
    const ledgerSnap = await userRef.collection("economyLedger").get();
    const entries = ledgerSnap.docs.map((doc) => doc.data());
    return {
      ledgerSums: (0, foldLedger_1.foldLedgerEntries)(entries),
      ledgerEntryCount: entries.length,
      usedCheckpoint: false,
    };
  }
  const checkpoint = checkpointSnap.data();
  const tailSnap = await userRef
    .collection("economyLedger")
    .where("timestamp", ">", checkpoint.foldedThroughTimestamp)
    .orderBy("timestamp", "asc")
    .get();
  const tail = tailSnap.docs.map((doc) => doc.data());
  return {
    ledgerSums: (0, foldLedger_1.mergeFoldSums)(
      checkpoint.foldSums,
      (0, foldLedger_1.foldLedgerEntries)(tail),
    ),
    ledgerEntryCount: checkpoint.foldedEntryCount + tail.length,
    usedCheckpoint: true,
  };
}
/** Admin-only: sum ledger deltas vs user doc aggregates. Does not auto-correct. */
async function reconcileUser(uid) {
  const [{ ledgerSums, ledgerEntryCount, usedCheckpoint }, allEntries] = await Promise.all([
    loadLedgerFoldState(uid),
    loadAllLedgerEntries(uid),
  ]);
  const ledgerLifetimeWonderEarned = (0, foldLedger_1.computeLifetimeWonderEarned)(allEntries);
  const ledgerBaits = (0, foldBaitInventory_1.foldBaitInventoryFromLedger)(allEntries);
  const userSnap = await init_1.db.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    throw new Error(`User ${uid} not found`);
  }
  const user = userSnap.data() ?? {};
  const inventory = user.inventory ?? {};
  const userDocValues = {
    currentWonder: user.currentWonder ?? 0,
    storedWonder: user.storedWonder ?? 0,
    parts: inventory.parts ?? 0,
    feather: inventory.baitMaterials?.feather ?? 0,
    scale: inventory.baitMaterials?.scale ?? 0,
    glimmerdust: inventory.baitMaterials?.glimmerdust ?? 0,
    lifetimeWonderEarned: user.lifetimeWonderEarned ?? 0,
    baits: readUserBaitValues(inventory),
  };
  return buildReconcileReport(
    uid,
    ledgerSums,
    ledgerEntryCount,
    userDocValues,
    ledgerLifetimeWonderEarned,
    ledgerBaits,
    usedCheckpoint,
  );
}
