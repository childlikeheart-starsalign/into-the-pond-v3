import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import { db } from "../../init";
import { commitEconomyAction } from "../economy/commitEconomyAction";
import {
  applyWonderSpendInMemory,
  buildAuditOnlyLedgerEntry,
  buildEconomyLedgerEntry,
  craftCollectKey,
  craftStartKey,
  EconomyError,
  rodEquipKey,
} from "../economy";
import { readIdempotencyInTransaction } from "../economy/resolveCallableIdempotency";
import { wonderAccountFromDoc } from "../wonderEconomy";
import { allLessonsComplete, isModuleClusterComplete } from "./partsAwards";
import { getCraftCost, getCraftDurationMs, isCraftTimerComplete } from "./craftCosts";
import { canCraftRodBySubscription } from "./subscriptionCraftGate";
import { isRodInHand } from "./craftStates";
import {
  EPIC_ELEMENT_ROD_IDS,
  moduleIdForRareRod,
  rareRodForEpic,
  WILDCARD_ROD_ID,
} from "./moduleRodMap";
import type { FishingRodId } from "./_sanctuaryTypes";
import {
  assertCraftableRod,
  buildUserProgressionContext,
  loadLessonProgress,
  loadPlayerRodRecords,
  playerRodDocToRecord,
  playerRodRecordToDoc,
  playerRodRef,
  playerRodsCollection,
  reconcilePlayerRodsForUser,
} from "./playerRodHelpers";
import { emitAnalytics } from "./emitAnalytics";
import { captureRodEquipped } from "../../analytics/posthogServer";
import {
  collectionTimingForRod,
  craftDurationHours,
  rodElementForAnalytics,
  rodTierForAnalytics,
} from "../../analytics/craftAnalyticsHelpers";

function assertStartCraftPrerequisites(
  rodId: FishingRodId,
  context: ReturnType<typeof buildUserProgressionContext>,
  lessonProgress: Awaited<ReturnType<typeof loadLessonProgress>>,
  playerRods: Awaited<ReturnType<typeof loadPlayerRodRecords>>,
): void {
  if (rodId === WILDCARD_ROD_ID) {
    throw new HttpsError("failed-precondition", "This gift cannot be started here");
  }

  if (!canCraftRodBySubscription(rodId, context.subscriptionTier)) {
    throw new HttpsError("permission-denied", "Your membership cannot craft this rod yet");
  }

  const isRare = moduleIdForRareRod(rodId) != null;
  const isEpic = (EPIC_ELEMENT_ROD_IDS as readonly string[]).includes(rodId);

  if (isRare) {
    const moduleId = moduleIdForRareRod(rodId);
    if (moduleId == null || !isModuleClusterComplete(lessonProgress, moduleId)) {
      throw new HttpsError("failed-precondition", "Finish this module's lessons first");
    }
  } else if (isEpic) {
    if (!allLessonsComplete(lessonProgress)) {
      throw new HttpsError("failed-precondition", "Complete the full curriculum first");
    }
    const rareId = rareRodForEpic(rodId);
    if (rareId == null || !isRodInHand(playerRods[rareId]?.state ?? "locked")) {
      throw new HttpsError("failed-precondition", "Craft the matching rare rod first");
    }
  }
}

export type StartCraftRequest = {
  rodId: FishingRodId;
};

export type StartCraftResponse = {
  success: true;
  rodId: FishingRodId;
  state: "crafting";
  craftStartedAt: number;
  craftCompletesAt: number;
  wonderInvested: number;
  partsSpent: number;
  partsRemaining: number;
  storedWonderRemaining: number;
};

type StartCraftEconomyResponse = {
  craftStartedAt: number;
  wonderInvested: number;
  partsSpent: number;
  partsRemaining: number;
  storedWonderRemaining: number;
};

export async function handleStartCraft(
  uid: string,
  payload: StartCraftRequest,
): Promise<StartCraftResponse> {
  const rodId = payload.rodId;
  if (!rodId) {
    throw new HttpsError("invalid-argument", "rodId is required");
  }

  try {
    assertCraftableRod(rodId);
  } catch {
    throw new HttpsError("invalid-argument", "Unknown rod");
  }

  await reconcilePlayerRodsForUser(uid);

  const cost = getCraftCost(rodId);
  const durationMs = getCraftDurationMs(rodId);
  if (durationMs <= 0) {
    throw new HttpsError("failed-precondition", "This rod cannot be crafted");
  }

  const userRef = db.collection("users").doc(uid);
  const rodRef = playerRodRef(uid, rodId);
  const userSnap = await userRef.get();
  const userData = (userSnap.data() ?? {}) as Record<string, unknown>;
  const lessonProgress = await loadLessonProgress(
    uid,
    userData as { completedLessons?: Record<string, boolean> },
  );
  const playerRods = await loadPlayerRodRecords(uid);
  const context = buildUserProgressionContext(userData, lessonProgress);

  assertStartCraftPrerequisites(rodId, context, lessonProgress, playerRods);

  const idempotencyKey = craftStartKey(rodId);
  const transactionId = `tx_rod_craft_${rodId}`;

  const { result, committed } = await db.runTransaction(async (tx) => {
    const idemRead = await readIdempotencyInTransaction<StartCraftEconomyResponse>(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return { result: idemRead.response, committed: false };
    }

    const freshUser = await tx.get(userRef);
    const rodSnap = await tx.get(rodRef);
    const freshData = (freshUser.data() ?? {}) as Record<string, unknown>;

    const current = playerRodDocToRecord(
      rodId,
      rodSnap.exists ? (rodSnap.data() as Parameters<typeof playerRodDocToRecord>[1]) : undefined,
    );

    if (current.state !== "craftable") {
      throw new HttpsError(
        "failed-precondition",
        current.state === "crafting"
          ? "This rod is already taking shape"
          : current.state === "ready" || current.state === "equipped"
            ? "This rod is already complete"
            : "This rod is not ready to begin yet",
      );
    }

    const inventory = (freshData.inventory as { parts?: number } | undefined) ?? {};
    const parts = inventory.parts ?? 0;

    if (parts < cost.parts) {
      throw new HttpsError("failed-precondition", "Not enough parts");
    }

    const account = wonderAccountFromDoc(uid, freshData);
    if (account.storedWonder < cost.storedWonder) {
      throw new HttpsError("failed-precondition", "Not enough stored Wonder");
    }

    const craftStartedAt = Date.now();

    const economyCommit = await commitEconomyAction<StartCraftEconomyResponse>({
      tx,
      userRef,
      uid,
      idempotencyKey,
      actionType: "craft_start",
      touchReflection: false,
      idempotencyMiss: { hit: false },
      build: ({ account: freshAccount, userData: economyUserData }) => {
        const economyInventory =
          (economyUserData.inventory as { parts?: number } | undefined) ?? {};
        const partsBefore = economyInventory.parts ?? 0;

        if (partsBefore < cost.parts) {
          throw new HttpsError("failed-precondition", "Not enough parts");
        }

        let transaction;
        try {
          const spendResult = applyWonderSpendInMemory(freshAccount, {
            source: "rod_craft_investment",
            amount: cost.storedWonder,
            transactionId,
            pool: "stored",
            metadata: { rodId },
          });
          transaction = spendResult.transaction;
        } catch (error) {
          if (error instanceof EconomyError && error.code === "INSUFFICIENT_WONDER") {
            throw new HttpsError("failed-precondition", "Not enough stored Wonder");
          }
          throw error;
        }

        const nextParts = partsBefore - cost.parts;
        const entry = buildEconomyLedgerEntry({
          uid,
          actionType: "craft_start",
          source: "rod_craft_investment",
          transaction,
          idempotencyKey,
          metadata: { rodId },
          deltaParts: -cost.parts,
        });

        return {
          entry,
          response: {
            craftStartedAt,
            wonderInvested: cost.storedWonder,
            partsSpent: cost.parts,
            partsRemaining: nextParts,
            storedWonderRemaining: freshAccount.storedWonder - cost.storedWonder,
          },
        };
      },
    });

    if (economyCommit.committed) {
      tx.set(
        rodRef,
        {
          state: "crafting",
          craftStartedAt: Timestamp.fromMillis(craftStartedAt),
          craftCompletedAt: null,
          wonderInvested: cost.storedWonder,
          partsSpentOnCraft: cost.parts,
          sourceModule: current.sourceModule,
          giftSource: FieldValue.delete(),
        },
        { merge: true },
      );
    }

    return { result: economyCommit.result, committed: economyCommit.committed };
  });

  if (committed) {
    const moduleId = moduleIdForRareRod(rodId);
    await emitAnalytics(uid, {
      type: "rod_craft_started",
      rodId,
      wonderInvested: result.wonderInvested,
      partsSpent: result.partsSpent,
      craftDurationHours: durationMs / (60 * 60 * 1000),
      moduleId,
      subscriptionTier: context.subscriptionTier,
      timestamp: Date.now(),
    });
  }

  return {
    success: true,
    rodId,
    state: "crafting",
    craftStartedAt: result.craftStartedAt,
    craftCompletesAt: result.craftStartedAt + durationMs,
    wonderInvested: result.wonderInvested,
    partsSpent: result.partsSpent,
    partsRemaining: result.partsRemaining,
    storedWonderRemaining: result.storedWonderRemaining,
  };
}

export type CollectCraftRequest = {
  rodId: FishingRodId;
};

export type CollectCraftResponse = {
  success: true;
  rodId: FishingRodId;
  state: "ready";
};

export async function handleCollectCraft(
  uid: string,
  payload: CollectCraftRequest,
): Promise<CollectCraftResponse> {
  const rodId = payload.rodId;
  if (!rodId) {
    throw new HttpsError("invalid-argument", "rodId is required");
  }

  try {
    assertCraftableRod(rodId);
  } catch {
    throw new HttpsError("invalid-argument", "Unknown rod");
  }

  await reconcilePlayerRodsForUser(uid);

  const rodRef = playerRodRef(uid, rodId);
  const userRef = db.collection("users").doc(uid);
  const idempotencyKey = craftCollectKey(rodId);
  const now = Date.now();

  const { response, committed } = await db.runTransaction(async (tx) => {
    const idemRead = await readIdempotencyInTransaction<CollectCraftResponse>(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return { response: idemRead.response, committed: false };
    }

    const rodSnap = await tx.get(rodRef);
    if (!rodSnap.exists) {
      throw new HttpsError("not-found", "Rod not found");
    }

    const current = playerRodDocToRecord(
      rodId,
      rodSnap.data() as Parameters<typeof playerRodDocToRecord>[1],
    );

    if (current.state === "ready" || current.state === "equipped") {
      const cached: CollectCraftResponse = { success: true, rodId, state: "ready" };
      await commitEconomyAction({
        tx,
        userRef,
        uid,
        idempotencyKey,
        actionType: "craft_collect",
        idempotencyMiss: { hit: false },
        build: () => ({
          entry: buildAuditOnlyLedgerEntry({
            uid,
            actionType: "craft_collect",
            idempotencyKey,
            source: "rod_craft_investment",
            correlationId: rodId,
            metadata: {
              rodId,
              fromState: current.state,
              toState: "ready",
              alreadyReady: true,
            },
          }),
          response: cached,
        }),
      });
      return { response: cached, committed: true };
    }

    if (current.state !== "crafting") {
      throw new HttpsError("failed-precondition", "This rod is not ready to collect");
    }

    if (!isCraftTimerComplete(rodId, current.craftStartedAt, now)) {
      throw new HttpsError(
        "failed-precondition",
        "Still taking shape — give it a little more time",
      );
    }

    const hoursToCollect = (now - (current.craftStartedAt ?? now)) / (60 * 60 * 1000);
    const response: CollectCraftResponse = { success: true, rodId, state: "ready" };

    const economyCommit = await commitEconomyAction({
      tx,
      userRef,
      uid,
      idempotencyKey,
      actionType: "craft_collect",
      idempotencyMiss: { hit: false },
      build: () => ({
        entry: buildAuditOnlyLedgerEntry({
          uid,
          actionType: "craft_collect",
          idempotencyKey,
          source: "rod_craft_investment",
          correlationId: rodId,
          metadata: {
            rodId,
            fromState: "crafting",
            toState: "ready",
            hoursToCollect,
          },
        }),
        response,
      }),
    });

    if (economyCommit.committed) {
      tx.set(
        rodRef,
        {
          state: "ready",
          craftCompletedAt: Timestamp.fromMillis(now),
        },
        { merge: true },
      );
    }

    return { response, committed: economyCommit.committed };
  });

  if (committed) {
    await emitAnalytics(uid, {
      type: "rod_crafted",
      rodId,
      timestamp: now,
    });
  }

  return response;
}

export type EquipRodRequest = {
  rodId: FishingRodId;
  collectedThisBenchSession?: boolean;
};

export type EquipRodResponse = {
  success: true;
  rodId: FishingRodId;
  state: "equipped";
  equippedRodId: FishingRodId;
  hoursToCollect?: number;
};

type EquipRodCachedResponse = {
  success: true;
  rodId: FishingRodId;
  state: "equipped";
  equippedRodId: FishingRodId;
  hoursToCollect?: number;
};

export async function handleEquipRod(
  uid: string,
  payload: EquipRodRequest,
): Promise<EquipRodResponse> {
  const rodId = payload.rodId;
  if (!rodId) {
    throw new HttpsError("invalid-argument", "rodId is required");
  }

  const userRef = db.collection("users").doc(uid);
  const rodRef = playerRodRef(uid, rodId);
  const idempotencyKey = rodEquipKey(rodId);
  const now = Date.now();

  const rodSnap = await rodRef.get();
  if (!rodSnap.exists) {
    throw new HttpsError("not-found", "Rod not found");
  }

  const current = playerRodDocToRecord(
    rodId,
    rodSnap.data() as Parameters<typeof playerRodDocToRecord>[1],
  );

  if (current.state === "equipped") {
    const userSnap = await userRef.get();
    const equippedRodId = (userSnap.data()?.equippedRodId as FishingRodId | undefined) ?? rodId;
    return { success: true, rodId, state: "equipped", equippedRodId };
  }

  if (current.state !== "ready") {
    throw new HttpsError("failed-precondition", "This rod is not ready to equip");
  }

  const craftStartedAt = current.craftStartedAt ?? now;
  const hoursToCollect = (now - craftStartedAt) / (60 * 60 * 1000);

  const allRodsSnap = await playerRodsCollection(uid).get();
  const previouslyEquipped = allRodsSnap.docs
    .map((doc) => ({ id: doc.id as FishingRodId, data: doc.data() }))
    .filter((entry) => entry.data.state === "equipped" && entry.id !== rodId);

  const { outcome, committed, cachedResponse } = await db.runTransaction(async (tx) => {
    const idemRead = await readIdempotencyInTransaction<EquipRodCachedResponse>(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return {
        outcome: "already_equipped" as const,
        committed: false,
        cachedResponse: idemRead.response,
      };
    }

    const freshRod = await tx.get(rodRef);
    const record = playerRodDocToRecord(
      rodId,
      freshRod.data() as Parameters<typeof playerRodDocToRecord>[1],
    );
    if (record.state === "equipped") {
      const userSnap = await tx.get(userRef);
      const equippedRodId = (userSnap.data()?.equippedRodId as FishingRodId | undefined) ?? rodId;
      const response: EquipRodCachedResponse = {
        success: true,
        rodId,
        state: "equipped",
        equippedRodId,
        hoursToCollect,
      };
      await commitEconomyAction({
        tx,
        userRef,
        uid,
        idempotencyKey,
        actionType: "rod_equip",
        idempotencyMiss: { hit: false },
        build: () => ({
          entry: buildAuditOnlyLedgerEntry({
            uid,
            actionType: "rod_equip",
            idempotencyKey,
            source: "rod_craft_investment",
            correlationId: rodId,
            metadata: {
              rodId,
              fromState: "equipped",
              toState: "equipped",
              hoursToCollect,
              alreadyEquipped: true,
            },
          }),
          response,
        }),
      });
      return { outcome: "already_equipped" as const, committed: true, cachedResponse: response };
    }
    if (record.state !== "ready") {
      throw new HttpsError("failed-precondition", "Rod is no longer ready to equip");
    }

    const response: EquipRodCachedResponse = {
      success: true,
      rodId,
      state: "equipped",
      equippedRodId: rodId,
      hoursToCollect,
    };

    const economyCommit = await commitEconomyAction({
      tx,
      userRef,
      uid,
      idempotencyKey,
      actionType: "rod_equip",
      idempotencyMiss: { hit: false },
      build: () => ({
        entry: buildAuditOnlyLedgerEntry({
          uid,
          actionType: "rod_equip",
          idempotencyKey,
          source: "rod_craft_investment",
          correlationId: rodId,
          metadata: {
            rodId,
            fromState: "ready",
            toState: "equipped",
            hoursToCollect,
            equippedSameSession: payload.collectedThisBenchSession ?? false,
          },
        }),
        response,
      }),
    });

    if (economyCommit.committed) {
      for (const prev of previouslyEquipped) {
        const prevRecord = playerRodDocToRecord(
          prev.id,
          prev.data as Parameters<typeof playerRodDocToRecord>[1],
        );
        tx.set(
          playerRodRef(uid, prev.id),
          playerRodRecordToDoc({ ...prevRecord, state: "ready" }),
          { merge: true },
        );
      }

      tx.set(rodRef, playerRodRecordToDoc({ ...record, state: "equipped" }), { merge: true });
      tx.set(userRef, { equippedRodId: rodId }, { merge: true });
    }

    return {
      outcome: "equipped" as const,
      committed: economyCommit.committed,
      cachedResponse: response,
    };
  });

  if (outcome === "already_equipped") {
    return (
      cachedResponse ?? {
        success: true,
        rodId,
        state: "equipped",
        equippedRodId: rodId,
        hoursToCollect,
      }
    );
  }

  if (committed) {
    await emitAnalytics(uid, {
      type: "rod_equipped",
      rodId,
      hoursToCollect,
      timestamp: now,
    });

    await emitAnalytics(uid, {
      type: "rod_collected",
      rodId,
      hoursToCollect,
      timestamp: now,
    });

    await captureRodEquipped({
      uid,
      rodId,
      rodTier: rodTierForAnalytics(rodId),
      rodElement: rodElementForAnalytics(rodId),
      hoursToCollect,
      craftDurationHours: craftDurationHours(rodId),
      collectionTiming: collectionTimingForRod(rodId, current.craftStartedAt, now),
      equippedSameSession: payload.collectedThisBenchSession ?? null,
      timestamp: now,
    });
  }

  return (
    cachedResponse ?? {
      success: true,
      rodId,
      state: "equipped",
      equippedRodId: rodId,
      hoursToCollect,
    }
  );
}

export type GetRodProgressionResponse = {
  success: true;
  playerRods: Record<string, ReturnType<typeof playerRodDocToRecord>>;
  parts: number;
  storedWonder: number;
};

export async function handleGetRodProgression(uid: string): Promise<GetRodProgressionResponse> {
  const { playerRods } = await reconcilePlayerRodsForUser(uid);
  const userSnap = await db.collection("users").doc(uid).get();
  const userData = (userSnap.data() ?? {}) as Record<string, unknown>;
  const inventory = (userData.inventory as { parts?: number } | undefined) ?? {};

  const serialized: GetRodProgressionResponse["playerRods"] = {};
  for (const [id, record] of Object.entries(playerRods)) {
    if (record) serialized[id] = record;
  }

  return {
    success: true,
    playerRods: serialized,
    parts: inventory.parts ?? 0,
    storedWonder:
      (userData.storedWonder as number | undefined) ??
      (userData.totalWonder as number | undefined) ??
      0,
  };
}
