"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStartCraft = handleStartCraft;
exports.handleCollectCraft = handleCollectCraft;
exports.handleEquipRod = handleEquipRod;
exports.handleGetRodProgression = handleGetRodProgression;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const init_1 = require("../../init");
const commitEconomyAction_1 = require("../economy/commitEconomyAction");
const economy_1 = require("../economy");
const resolveCallableIdempotency_1 = require("../economy/resolveCallableIdempotency");
const wonderEconomy_1 = require("../wonderEconomy");
const partsAwards_1 = require("./partsAwards");
const craftCosts_1 = require("./craftCosts");
const subscriptionCraftGate_1 = require("./subscriptionCraftGate");
const craftStates_1 = require("./craftStates");
const moduleRodMap_1 = require("./moduleRodMap");
const playerRodHelpers_1 = require("./playerRodHelpers");
const emitAnalytics_1 = require("./emitAnalytics");
const posthogServer_1 = require("../../analytics/posthogServer");
const craftAnalyticsHelpers_1 = require("../../analytics/craftAnalyticsHelpers");
function assertStartCraftPrerequisites(rodId, context, lessonProgress, playerRods) {
  if (rodId === moduleRodMap_1.WILDCARD_ROD_ID) {
    throw new https_1.HttpsError("failed-precondition", "This gift cannot be started here");
  }
  if (!(0, subscriptionCraftGate_1.canCraftRodBySubscription)(rodId, context.subscriptionTier)) {
    throw new https_1.HttpsError("permission-denied", "Your membership cannot craft this rod yet");
  }
  const isRare = (0, moduleRodMap_1.moduleIdForRareRod)(rodId) != null;
  const isEpic = moduleRodMap_1.EPIC_ELEMENT_ROD_IDS.includes(rodId);
  if (isRare) {
    const moduleId = (0, moduleRodMap_1.moduleIdForRareRod)(rodId);
    if (moduleId == null || !(0, partsAwards_1.isModuleClusterComplete)(lessonProgress, moduleId)) {
      throw new https_1.HttpsError("failed-precondition", "Finish this module's lessons first");
    }
  } else if (isEpic) {
    if (!(0, partsAwards_1.allLessonsComplete)(lessonProgress)) {
      throw new https_1.HttpsError("failed-precondition", "Complete the full curriculum first");
    }
    const rareId = (0, moduleRodMap_1.rareRodForEpic)(rodId);
    if (rareId == null || !(0, craftStates_1.isRodInHand)(playerRods[rareId]?.state ?? "locked")) {
      throw new https_1.HttpsError("failed-precondition", "Craft the matching rare rod first");
    }
  }
}
async function handleStartCraft(uid, payload) {
  const rodId = payload.rodId;
  if (!rodId) {
    throw new https_1.HttpsError("invalid-argument", "rodId is required");
  }
  try {
    (0, playerRodHelpers_1.assertCraftableRod)(rodId);
  } catch {
    throw new https_1.HttpsError("invalid-argument", "Unknown rod");
  }
  await (0, playerRodHelpers_1.reconcilePlayerRodsForUser)(uid);
  const cost = (0, craftCosts_1.getCraftCost)(rodId);
  const durationMs = (0, craftCosts_1.getCraftDurationMs)(rodId);
  if (durationMs <= 0) {
    throw new https_1.HttpsError("failed-precondition", "This rod cannot be crafted");
  }
  const userRef = init_1.db.collection("users").doc(uid);
  const rodRef = (0, playerRodHelpers_1.playerRodRef)(uid, rodId);
  const userSnap = await userRef.get();
  const userData = userSnap.data() ?? {};
  const lessonProgress = await (0, playerRodHelpers_1.loadLessonProgress)(uid, userData);
  const playerRods = await (0, playerRodHelpers_1.loadPlayerRodRecords)(uid);
  const context = (0, playerRodHelpers_1.buildUserProgressionContext)(userData, lessonProgress);
  assertStartCraftPrerequisites(rodId, context, lessonProgress, playerRods);
  const idempotencyKey = (0, economy_1.craftStartKey)(rodId);
  const transactionId = `tx_rod_craft_${rodId}`;
  const { result, committed } = await init_1.db.runTransaction(async (tx) => {
    const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return { result: idemRead.response, committed: false };
    }
    const freshUser = await tx.get(userRef);
    const rodSnap = await tx.get(rodRef);
    const freshData = freshUser.data() ?? {};
    const current = (0, playerRodHelpers_1.playerRodDocToRecord)(
      rodId,
      rodSnap.exists ? rodSnap.data() : undefined,
    );
    if (current.state !== "craftable") {
      throw new https_1.HttpsError(
        "failed-precondition",
        current.state === "crafting"
          ? "This rod is already taking shape"
          : current.state === "ready" || current.state === "equipped"
            ? "This rod is already complete"
            : "This rod is not ready to begin yet",
      );
    }
    const inventory = freshData.inventory ?? {};
    const parts = inventory.parts ?? 0;
    if (parts < cost.parts) {
      throw new https_1.HttpsError("failed-precondition", "Not enough parts");
    }
    const account = (0, wonderEconomy_1.wonderAccountFromDoc)(uid, freshData);
    if (account.storedWonder < cost.storedWonder) {
      throw new https_1.HttpsError("failed-precondition", "Not enough stored Wonder");
    }
    const craftStartedAt = Date.now();
    const economyCommit = await (0, commitEconomyAction_1.commitEconomyAction)({
      tx,
      userRef,
      uid,
      idempotencyKey,
      actionType: "craft_start",
      touchReflection: false,
      idempotencyMiss: { hit: false },
      build: ({ account: freshAccount, userData: economyUserData }) => {
        const economyInventory = economyUserData.inventory ?? {};
        const partsBefore = economyInventory.parts ?? 0;
        if (partsBefore < cost.parts) {
          throw new https_1.HttpsError("failed-precondition", "Not enough parts");
        }
        let transaction;
        try {
          const spendResult = (0, economy_1.applyWonderSpendInMemory)(freshAccount, {
            source: "rod_craft_investment",
            amount: cost.storedWonder,
            transactionId,
            pool: "stored",
            metadata: { rodId },
          });
          transaction = spendResult.transaction;
        } catch (error) {
          if (error instanceof economy_1.EconomyError && error.code === "INSUFFICIENT_WONDER") {
            throw new https_1.HttpsError("failed-precondition", "Not enough stored Wonder");
          }
          throw error;
        }
        const nextParts = partsBefore - cost.parts;
        const entry = (0, economy_1.buildEconomyLedgerEntry)({
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
          craftStartedAt: firestore_1.Timestamp.fromMillis(craftStartedAt),
          craftCompletedAt: null,
          wonderInvested: cost.storedWonder,
          partsSpentOnCraft: cost.parts,
          sourceModule: current.sourceModule,
          giftSource: firestore_1.FieldValue.delete(),
        },
        { merge: true },
      );
    }
    return { result: economyCommit.result, committed: economyCommit.committed };
  });
  if (committed) {
    const moduleId = (0, moduleRodMap_1.moduleIdForRareRod)(rodId);
    await (0, emitAnalytics_1.emitAnalytics)(uid, {
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
async function handleCollectCraft(uid, payload) {
  const rodId = payload.rodId;
  if (!rodId) {
    throw new https_1.HttpsError("invalid-argument", "rodId is required");
  }
  try {
    (0, playerRodHelpers_1.assertCraftableRod)(rodId);
  } catch {
    throw new https_1.HttpsError("invalid-argument", "Unknown rod");
  }
  await (0, playerRodHelpers_1.reconcilePlayerRodsForUser)(uid);
  const rodRef = (0, playerRodHelpers_1.playerRodRef)(uid, rodId);
  const userRef = init_1.db.collection("users").doc(uid);
  const idempotencyKey = (0, economy_1.craftCollectKey)(rodId);
  const now = Date.now();
  const { response, committed } = await init_1.db.runTransaction(async (tx) => {
    const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return { response: idemRead.response, committed: false };
    }
    const rodSnap = await tx.get(rodRef);
    if (!rodSnap.exists) {
      throw new https_1.HttpsError("not-found", "Rod not found");
    }
    const current = (0, playerRodHelpers_1.playerRodDocToRecord)(rodId, rodSnap.data());
    if (current.state === "ready" || current.state === "equipped") {
      const cached = { success: true, rodId, state: "ready" };
      await (0, commitEconomyAction_1.commitEconomyAction)({
        tx,
        userRef,
        uid,
        idempotencyKey,
        actionType: "craft_collect",
        idempotencyMiss: { hit: false },
        build: () => ({
          entry: (0, economy_1.buildAuditOnlyLedgerEntry)({
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
      throw new https_1.HttpsError("failed-precondition", "This rod is not ready to collect");
    }
    if (!(0, craftCosts_1.isCraftTimerComplete)(rodId, current.craftStartedAt, now)) {
      throw new https_1.HttpsError(
        "failed-precondition",
        "Still taking shape — give it a little more time",
      );
    }
    const hoursToCollect = (now - (current.craftStartedAt ?? now)) / (60 * 60 * 1000);
    const response = { success: true, rodId, state: "ready" };
    const economyCommit = await (0, commitEconomyAction_1.commitEconomyAction)({
      tx,
      userRef,
      uid,
      idempotencyKey,
      actionType: "craft_collect",
      idempotencyMiss: { hit: false },
      build: () => ({
        entry: (0, economy_1.buildAuditOnlyLedgerEntry)({
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
          craftCompletedAt: firestore_1.Timestamp.fromMillis(now),
        },
        { merge: true },
      );
    }
    return { response, committed: economyCommit.committed };
  });
  if (committed) {
    await (0, emitAnalytics_1.emitAnalytics)(uid, {
      type: "rod_crafted",
      rodId,
      timestamp: now,
    });
  }
  return response;
}
async function handleEquipRod(uid, payload) {
  const rodId = payload.rodId;
  if (!rodId) {
    throw new https_1.HttpsError("invalid-argument", "rodId is required");
  }
  const userRef = init_1.db.collection("users").doc(uid);
  const rodRef = (0, playerRodHelpers_1.playerRodRef)(uid, rodId);
  const idempotencyKey = (0, economy_1.rodEquipKey)(rodId);
  const now = Date.now();
  const rodSnap = await rodRef.get();
  if (!rodSnap.exists) {
    throw new https_1.HttpsError("not-found", "Rod not found");
  }
  const current = (0, playerRodHelpers_1.playerRodDocToRecord)(rodId, rodSnap.data());
  if (current.state === "equipped") {
    const userSnap = await userRef.get();
    const equippedRodId = userSnap.data()?.equippedRodId ?? rodId;
    return { success: true, rodId, state: "equipped", equippedRodId };
  }
  if (current.state !== "ready") {
    throw new https_1.HttpsError("failed-precondition", "This rod is not ready to equip");
  }
  const craftStartedAt = current.craftStartedAt ?? now;
  const hoursToCollect = (now - craftStartedAt) / (60 * 60 * 1000);
  const allRodsSnap = await (0, playerRodHelpers_1.playerRodsCollection)(uid).get();
  const previouslyEquipped = allRodsSnap.docs
    .map((doc) => ({ id: doc.id, data: doc.data() }))
    .filter((entry) => entry.data.state === "equipped" && entry.id !== rodId);
  const { outcome, committed, cachedResponse } = await init_1.db.runTransaction(async (tx) => {
    const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return { outcome: "already_equipped", committed: false, cachedResponse: idemRead.response };
    }
    const freshRod = await tx.get(rodRef);
    const record = (0, playerRodHelpers_1.playerRodDocToRecord)(rodId, freshRod.data());
    if (record.state === "equipped") {
      const userSnap = await tx.get(userRef);
      const equippedRodId = userSnap.data()?.equippedRodId ?? rodId;
      const response = {
        success: true,
        rodId,
        state: "equipped",
        equippedRodId,
        hoursToCollect,
      };
      await (0, commitEconomyAction_1.commitEconomyAction)({
        tx,
        userRef,
        uid,
        idempotencyKey,
        actionType: "rod_equip",
        idempotencyMiss: { hit: false },
        build: () => ({
          entry: (0, economy_1.buildAuditOnlyLedgerEntry)({
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
      return { outcome: "already_equipped", committed: true, cachedResponse: response };
    }
    if (record.state !== "ready") {
      throw new https_1.HttpsError("failed-precondition", "Rod is no longer ready to equip");
    }
    const response = {
      success: true,
      rodId,
      state: "equipped",
      equippedRodId: rodId,
      hoursToCollect,
    };
    const economyCommit = await (0, commitEconomyAction_1.commitEconomyAction)({
      tx,
      userRef,
      uid,
      idempotencyKey,
      actionType: "rod_equip",
      idempotencyMiss: { hit: false },
      build: () => ({
        entry: (0, economy_1.buildAuditOnlyLedgerEntry)({
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
        const prevRecord = (0, playerRodHelpers_1.playerRodDocToRecord)(prev.id, prev.data);
        tx.set(
          (0, playerRodHelpers_1.playerRodRef)(uid, prev.id),
          (0, playerRodHelpers_1.playerRodRecordToDoc)({ ...prevRecord, state: "ready" }),
          { merge: true },
        );
      }
      tx.set(
        rodRef,
        (0, playerRodHelpers_1.playerRodRecordToDoc)({ ...record, state: "equipped" }),
        { merge: true },
      );
      tx.set(userRef, { equippedRodId: rodId }, { merge: true });
    }
    return { outcome: "equipped", committed: economyCommit.committed, cachedResponse: response };
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
    await (0, emitAnalytics_1.emitAnalytics)(uid, {
      type: "rod_equipped",
      rodId,
      hoursToCollect,
      timestamp: now,
    });
    await (0, emitAnalytics_1.emitAnalytics)(uid, {
      type: "rod_collected",
      rodId,
      hoursToCollect,
      timestamp: now,
    });
    await (0, posthogServer_1.captureRodEquipped)({
      uid,
      rodId,
      rodTier: (0, craftAnalyticsHelpers_1.rodTierForAnalytics)(rodId),
      rodElement: (0, craftAnalyticsHelpers_1.rodElementForAnalytics)(rodId),
      hoursToCollect,
      craftDurationHours: (0, craftAnalyticsHelpers_1.craftDurationHours)(rodId),
      collectionTiming: (0, craftAnalyticsHelpers_1.collectionTimingForRod)(
        rodId,
        current.craftStartedAt,
        now,
      ),
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
async function handleGetRodProgression(uid) {
  const { playerRods } = await (0, playerRodHelpers_1.reconcilePlayerRodsForUser)(uid);
  const userSnap = await init_1.db.collection("users").doc(uid).get();
  const userData = userSnap.data() ?? {};
  const inventory = userData.inventory ?? {};
  const serialized = {};
  for (const [id, record] of Object.entries(playerRods)) {
    if (record) serialized[id] = record;
  }
  return {
    success: true,
    playerRods: serialized,
    parts: inventory.parts ?? 0,
    storedWonder: userData.storedWonder ?? userData.totalWonder ?? 0,
  };
}
