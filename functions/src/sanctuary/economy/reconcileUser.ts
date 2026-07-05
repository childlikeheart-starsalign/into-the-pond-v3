import { db } from "../../init";
import {
  computeLifetimeWonderEarned,
  foldLedgerEntries,
  mergeFoldSums,
  type LedgerFoldSums,
} from "./foldLedger";
import {
  CONSUMABLE_BAIT_KEYS,
  foldBaitInventoryFromLedger,
  type ConsumableBaitKey,
} from "./foldBaitInventory";
import {
  ECONOMY_LEDGER_CHECKPOINT_DOC_ID,
  type EconomyLedgerCheckpoint,
  type EconomyLedgerEntry,
} from "./types";

export type ReconcileBaitValues = Record<ConsumableBaitKey, number>;

export type ReconcileUserReport = {
  uid: string;
  ledgerEntryCount: number;
  ledgerSums: LedgerFoldSums & {
    lifetimeWonderEarned: number;
    baits: ReconcileBaitValues;
  };
  userDocValues: {
    currentWonder: number;
    storedWonder: number;
    parts: number;
    feather: number;
    scale: number;
    glimmerdust: number;
    lifetimeWonderEarned: number;
    baits: ReconcileBaitValues;
  };
  drift: {
    currentWonder: number;
    storedWonder: number;
    parts: number;
    feather: number;
    scale: number;
    glimmerdust: number;
    lifetimeWonderEarned: number;
    baits: ReconcileBaitValues;
  };
  hasDrift: boolean;
  usedCheckpoint: boolean;
};

export { foldLedgerEntries };

function emptyBaitValues(): ReconcileBaitValues {
  return {
    feather_bait: 0,
    scale_bait: 0,
    glimmerdust_bait: 0,
    random_bait: 0,
  };
}

function readUserBaitValues(
  inventory: { baits?: Record<string, number> } | undefined,
): ReconcileBaitValues {
  const baits = inventory?.baits ?? {};
  return {
    feather_bait: baits.feather_bait ?? 0,
    scale_bait: baits.scale_bait ?? 0,
    glimmerdust_bait: baits.glimmerdust_bait ?? 0,
    random_bait: baits.random_bait ?? 0,
  };
}

function baitDrift(
  userBaits: ReconcileBaitValues,
  ledgerBaits: ReconcileBaitValues,
): ReconcileBaitValues {
  const drift = emptyBaitValues();
  for (const key of CONSUMABLE_BAIT_KEYS) {
    drift[key] = userBaits[key] - ledgerBaits[key];
  }
  return drift;
}

export function buildReconcileReport(
  uid: string,
  ledgerSums: LedgerFoldSums,
  ledgerEntryCount: number,
  userDocValues: Omit<ReconcileUserReport["userDocValues"], "baits"> & {
    baits?: ReconcileBaitValues;
  },
  ledgerLifetimeWonderEarned: number,
  ledgerBaits: ReconcileBaitValues,
  usedCheckpoint = false,
): ReconcileUserReport {
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
  const hasBaitDrift = CONSUMABLE_BAIT_KEYS.some((key) => driftBaits[key] !== 0);

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

export async function loadAllLedgerEntries(uid: string): Promise<EconomyLedgerEntry[]> {
  const snap = await db.collection("users").doc(uid).collection("economyLedger").get();
  return snap.docs.map((doc) => doc.data() as EconomyLedgerEntry);
}

export async function loadLedgerFoldState(uid: string): Promise<{
  ledgerSums: LedgerFoldSums;
  ledgerEntryCount: number;
  usedCheckpoint: boolean;
}> {
  const userRef = db.collection("users").doc(uid);
  const checkpointSnap = await userRef
    .collection("economyLedgerCheckpoint")
    .doc(ECONOMY_LEDGER_CHECKPOINT_DOC_ID)
    .get();

  if (!checkpointSnap.exists) {
    const ledgerSnap = await userRef.collection("economyLedger").get();
    const entries = ledgerSnap.docs.map((doc) => doc.data() as EconomyLedgerEntry);
    return {
      ledgerSums: foldLedgerEntries(entries),
      ledgerEntryCount: entries.length,
      usedCheckpoint: false,
    };
  }

  const checkpoint = checkpointSnap.data() as EconomyLedgerCheckpoint;
  const tailSnap = await userRef
    .collection("economyLedger")
    .where("timestamp", ">", checkpoint.foldedThroughTimestamp)
    .orderBy("timestamp", "asc")
    .get();
  const tail = tailSnap.docs.map((doc) => doc.data() as EconomyLedgerEntry);

  return {
    ledgerSums: mergeFoldSums(checkpoint.foldSums, foldLedgerEntries(tail)),
    ledgerEntryCount: checkpoint.foldedEntryCount + tail.length,
    usedCheckpoint: true,
  };
}

/** Admin-only: sum ledger deltas vs user doc aggregates. Does not auto-correct. */
export async function reconcileUser(uid: string): Promise<ReconcileUserReport> {
  const [{ ledgerSums, ledgerEntryCount, usedCheckpoint }, allEntries] = await Promise.all([
    loadLedgerFoldState(uid),
    loadAllLedgerEntries(uid),
  ]);

  const ledgerLifetimeWonderEarned = computeLifetimeWonderEarned(allEntries);
  const ledgerBaits = foldBaitInventoryFromLedger(allEntries);

  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    throw new Error(`User ${uid} not found`);
  }

  const user = userSnap.data() ?? {};
  const inventory =
    (user.inventory as
      | {
          parts?: number;
          baits?: Record<string, number>;
          baitMaterials?: { feather?: number; scale?: number; glimmerdust?: number };
        }
      | undefined) ?? {};

  const userDocValues = {
    currentWonder: (user.currentWonder as number | undefined) ?? 0,
    storedWonder: (user.storedWonder as number | undefined) ?? 0,
    parts: inventory.parts ?? 0,
    feather: inventory.baitMaterials?.feather ?? 0,
    scale: inventory.baitMaterials?.scale ?? 0,
    glimmerdust: inventory.baitMaterials?.glimmerdust ?? 0,
    lifetimeWonderEarned: (user.lifetimeWonderEarned as number | undefined) ?? 0,
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
