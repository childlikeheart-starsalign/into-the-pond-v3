import { FieldValue, Timestamp } from "firebase-admin/firestore";

import type { WonderAccount, WonderSource, WonderTransaction } from "./types";
import { migrateFromLegacyTotalWonder } from "./wonderLedger";

const LEGACY_ECONOMY_MUTATION_ERROR =
  "Direct wonder balance writes are disabled. Use commitEconomyAction (sanctuary/economy/commitEconomyAction.ts).";

export type UserEconomyFields = {
  totalWonder?: number;
  currentWonder?: number;
  storedWonder?: number;
  lifetimeWonderEarned?: number;
  lastReflectionAt?: Timestamp | null;
};

export function wonderAccountFromDoc(uid: string, data: UserEconomyFields): WonderAccount {
  if (data.currentWonder != null && data.storedWonder != null) {
    return {
      userId: uid,
      currentWonder: data.currentWonder,
      storedWonder: data.storedWonder,
      lifetimeWonderEarned: data.lifetimeWonderEarned ?? data.storedWonder,
      updatedAt: Date.now(),
    };
  }
  return migrateFromLegacyTotalWonder(uid, data.totalWonder ?? 0);
}

/** @deprecated Use wonderFieldsPatchFromAccount from economy/applyLedgerEntry. */
export function wonderFieldsPatch(account: WonderAccount): Record<string, unknown> {
  return {
    currentWonder: account.currentWonder,
    storedWonder: account.storedWonder,
    lifetimeWonderEarned: account.lifetimeWonderEarned,
    totalWonder: account.currentWonder,
  };
}

/** @deprecated Use commitEconomyAction — wonderTransactions are written inside the economy commit tx. */
export async function persistWonderTransaction(
  _userRef: FirebaseFirestore.DocumentReference,
  _transaction: WonderTransaction,
): Promise<void> {
  throw new Error(LEGACY_ECONOMY_MUTATION_ERROR);
}

/** @deprecated Use commitEconomyAction with applyWonderEarnInMemory. */
export async function earnWonder(
  _userRef: FirebaseFirestore.DocumentReference,
  _uid: string,
  _data: UserEconomyFields,
  _source: WonderSource,
  _amount: number,
  _metadata: Record<string, unknown>,
  _options?: { touchReflection?: boolean; transactionId?: string },
): Promise<{ account: WonderAccount; transaction: WonderTransaction }> {
  throw new Error(LEGACY_ECONOMY_MUTATION_ERROR);
}

/** @deprecated Use commitEconomyAction with applyWonderSpendInMemory. */
export async function spendCurrentWonder(
  _userRef: FirebaseFirestore.DocumentReference,
  _uid: string,
  _data: UserEconomyFields,
  _source: WonderSource,
  _amount: number,
  _metadata: Record<string, unknown>,
): Promise<{ account: WonderAccount; transaction: WonderTransaction }> {
  throw new Error(LEGACY_ECONOMY_MUTATION_ERROR);
}

export async function recordAnalyticsEvent(
  userRef: FirebaseFirestore.DocumentReference,
  event: Record<string, unknown>,
): Promise<void> {
  await userRef.collection("sanctuaryAnalytics").add({
    ...event,
    recordedAt: FieldValue.serverTimestamp(),
  });
}
