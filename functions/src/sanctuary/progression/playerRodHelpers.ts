import { Timestamp } from "firebase-admin/firestore";

import { db } from "../../init";
import type { SubscriptionStatus } from "../../types";
import { CRAFTABLE_ROD_IDS } from "./craftCosts";
import { emitAnalytics } from "./emitAnalytics";
import {
  evaluateCraftableStates,
  lessonProgressFromCompletedMap,
  mergeEvaluateResult,
} from "./evaluateCraftable";
import {
  EPIC_ELEMENT_ROD_IDS,
  moduleIdForRareRod,
  RARE_ELEMENT_ROD_IDS,
  WILDCARD_ROD_ID,
} from "./moduleRodMap";
import type { FishingRodId } from "./_sanctuaryTypes";
import type {
  PlayerRodRecord,
  PlayerRodState,
  SubscriptionCraftTier,
  LessonProgressRecord,
} from "./types";

export type PlayerRodFirestoreDoc = {
  state: PlayerRodState;
  craftStartedAt: Timestamp | null;
  craftCompletedAt: Timestamp | null;
  wonderInvested: number;
  partsSpentOnCraft: number;
  sourceModule: 1 | 2 | 3 | 4 | 5 | null;
  giftSource?: "journey_gift" | null;
};

export type UserProgressionContext = {
  parts: number;
  storedWonder: number;
  subscriptionTier: SubscriptionCraftTier;
  lessonProgress: Record<string, LessonProgressRecord | boolean>;
};

export function playerRodsCollection(uid: string) {
  return db.collection("users").doc(uid).collection("playerRods");
}

export function playerRodRef(uid: string, rodId: FishingRodId) {
  return playerRodsCollection(uid).doc(rodId);
}

export function subscriptionCraftTierFromUser(data: {
  subscription?: {
    subscriptionStatus?: SubscriptionStatus;
    isLifetime?: boolean;
  };
}): SubscriptionCraftTier {
  if (data.subscription?.isLifetime) return "lifetime";
  const status = data.subscription?.subscriptionStatus ?? "free";
  if (status === "free" || status === "wooden" || status === "fiberglass") {
    return status;
  }
  return "free";
}

export function lessonProgressFromUserDoc(data: {
  completedLessons?: Record<string, boolean>;
}): Record<string, LessonProgressRecord | boolean> {
  return lessonProgressFromCompletedMap(data.completedLessons ?? {});
}

export async function loadLessonProgress(
  uid: string,
  userData: { completedLessons?: Record<string, boolean> },
): Promise<Record<string, LessonProgressRecord | boolean>> {
  const snapshot = await db.collection("users").doc(uid).collection("lessonProgress").get();
  if (snapshot.empty) {
    return lessonProgressFromUserDoc(userData);
  }

  const progress: Record<string, LessonProgressRecord | boolean> = {};
  for (const doc of snapshot.docs) {
    const data = doc.data() as {
      completed?: boolean;
      completedAt?: Timestamp | null;
      lastOpenedAt?: Timestamp | null;
    };
    progress[doc.id] = {
      lessonId: doc.id,
      completed: data.completed === true,
      completedAt: data.completedAt?.toMillis() ?? null,
      lastOpenedAt: data.lastOpenedAt?.toMillis() ?? null,
    };
  }
  return progress;
}

function defaultPlayerRodRecord(rodId: FishingRodId): PlayerRodRecord {
  return {
    rodId,
    state: "locked",
    craftStartedAt: null,
    craftCompletedAt: null,
    wonderInvested: 0,
    partsSpentOnCraft: 0,
    sourceModule: moduleIdForRareRod(rodId) as PlayerRodRecord["sourceModule"],
    giftSource: null,
  };
}

export function playerRodDocToRecord(
  rodId: FishingRodId,
  doc: PlayerRodFirestoreDoc | undefined,
): PlayerRodRecord {
  if (!doc) return defaultPlayerRodRecord(rodId);
  return {
    rodId,
    state: doc.state,
    craftStartedAt: doc.craftStartedAt?.toMillis() ?? null,
    craftCompletedAt: doc.craftCompletedAt?.toMillis() ?? null,
    wonderInvested: doc.wonderInvested ?? 0,
    partsSpentOnCraft: doc.partsSpentOnCraft ?? 0,
    sourceModule:
      doc.sourceModule ?? (moduleIdForRareRod(rodId) as PlayerRodRecord["sourceModule"]),
    giftSource: doc.giftSource ?? null,
  };
}

export function playerRodRecordToDoc(record: PlayerRodRecord): PlayerRodFirestoreDoc {
  return {
    state: record.state,
    craftStartedAt:
      record.craftStartedAt != null ? Timestamp.fromMillis(record.craftStartedAt) : null,
    craftCompletedAt:
      record.craftCompletedAt != null ? Timestamp.fromMillis(record.craftCompletedAt) : null,
    wonderInvested: record.wonderInvested,
    partsSpentOnCraft: record.partsSpentOnCraft,
    sourceModule: record.sourceModule,
    giftSource: record.giftSource ?? null,
  };
}

export async function loadPlayerRodRecords(
  uid: string,
): Promise<Partial<Record<FishingRodId, PlayerRodRecord>>> {
  const snapshot = await playerRodsCollection(uid).get();
  const records: Partial<Record<FishingRodId, PlayerRodRecord>> = {};
  for (const doc of snapshot.docs) {
    const rodId = doc.id as FishingRodId;
    records[rodId] = playerRodDocToRecord(rodId, doc.data() as PlayerRodFirestoreDoc);
  }
  return records;
}

export async function ensureProgressionPlayerRodDocs(uid: string): Promise<void> {
  const allRodIds: FishingRodId[] = [
    ...RARE_ELEMENT_ROD_IDS,
    WILDCARD_ROD_ID,
    ...EPIC_ELEMENT_ROD_IDS,
  ];
  const batch = db.batch();
  let writes = 0;
  for (const rodId of allRodIds) {
    const ref = playerRodRef(uid, rodId);
    const snap = await ref.get();
    if (snap.exists) continue;
    batch.set(ref, playerRodRecordToDoc(defaultPlayerRodRecord(rodId)));
    writes += 1;
  }
  if (writes > 0) {
    await batch.commit();
  }
}

/** @deprecated Use ensureProgressionPlayerRodDocs */
export async function ensurePhase1PlayerRodDocs(uid: string): Promise<void> {
  await ensureProgressionPlayerRodDocs(uid);
}

export function buildUserProgressionContext(
  userData: Record<string, unknown>,
  lessonProgress: Record<string, LessonProgressRecord | boolean>,
): UserProgressionContext {
  const inventory = (userData.inventory as { parts?: number } | undefined) ?? {};
  return {
    parts: inventory.parts ?? 0,
    storedWonder:
      (userData.storedWonder as number | undefined) ??
      (userData.totalWonder as number | undefined) ??
      0,
    subscriptionTier: subscriptionCraftTierFromUser(
      userData as {
        subscription?: { subscriptionStatus?: SubscriptionStatus; isLifetime?: boolean };
      },
    ),
    lessonProgress,
  };
}

export async function reconcilePlayerRodsForUser(
  uid: string,
  options?: { persist?: boolean },
): Promise<{
  playerRods: Partial<Record<FishingRodId, PlayerRodRecord>>;
  evaluateResult: ReturnType<typeof evaluateCraftableStates>;
}> {
  const persist = options?.persist !== false;
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const userData = (userSnap.data() ?? {}) as Record<string, unknown>;

  await ensureProgressionPlayerRodDocs(uid);

  const lessonProgress = await loadLessonProgress(
    uid,
    userData as { completedLessons?: Record<string, boolean> },
  );
  const playerRods = await loadPlayerRodRecords(uid);
  const context = buildUserProgressionContext(userData, lessonProgress);

  const evaluateResult = evaluateCraftableStates({
    lessonProgress,
    playerRods,
    subscriptionTier: context.subscriptionTier,
    inventory: {
      parts: context.parts,
      storedWonder: context.storedWonder,
    },
  });

  const merged = mergeEvaluateResult(playerRods, evaluateResult);

  if (persist && evaluateResult.transitions.length > 0) {
    const batch = db.batch();
    for (const transition of evaluateResult.transitions) {
      const record = merged[transition.rodId];
      if (!record) continue;
      batch.set(playerRodRef(uid, transition.rodId), playerRodRecordToDoc(record), { merge: true });
    }
    await batch.commit();
  }

  return { playerRods: merged, evaluateResult };
}

export function assertCraftableRod(rodId: FishingRodId): void {
  if (rodId === WILDCARD_ROD_ID || rodId === "basic") {
    throw new Error(`Rod ${rodId} cannot be crafted via startCraft`);
  }
  if (!(CRAFTABLE_ROD_IDS as readonly string[]).includes(rodId)) {
    throw new Error(`Rod ${rodId} is not craftable`);
  }
}

/** @deprecated Use assertCraftableRod */
export function assertPhase1CraftableRod(rodId: FishingRodId): void {
  assertCraftableRod(rodId);
}

export async function recordRodAnalytics(
  uid: string,
  event: Record<string, unknown>,
): Promise<void> {
  await emitAnalytics(uid, event);
}
