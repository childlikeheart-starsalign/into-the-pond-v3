"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nightlyAbandonedAuthCleanup =
  exports.sweepVerifyWallAbandoned =
  exports.trackNewUserBackend =
  exports.scheduledEconomyReconciliation =
  exports.scheduledEconomyLedgerCompaction =
  exports.adminCompactEconomyLedger =
  exports.adminReconcileUser =
  exports.compensateEconomyEntry =
  exports.checkSignInEmailRegistered =
  exports.purgeExpiredAccountDeletions =
  exports.requestAccountDeletionByEmail =
  exports.confirmAccountDeletionWeb =
  exports.getAccountDeletionStatus =
  exports.cancelAccountDeletion =
  exports.requestAccountDeletion =
  exports.claimCast =
  exports.createCast =
  exports.craftBait =
  exports.completePractice =
  exports.answerWellQuestion =
  exports.createWellQuestion =
  exports.getRodProgression =
  exports.completeLessonReflection =
  exports.equipRod =
  exports.collectCraft =
  exports.startCraft =
  exports.rerollWellQuestion =
  exports.submitWellReflection =
  exports.getOrAssignTodaysQuestion =
  exports.initializeSanctuary =
  exports.ensureWellState =
  exports.submitDiaryEntry =
  exports.syncSubscriptionStatusDaily =
  exports.syncSubscriptionStatus =
  exports.verifyPurchase =
    void 0;
const node_crypto_1 = require("node:crypto");
const firebase_functions_1 = require("firebase-functions");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
const firestore_1 = require("firebase-admin/firestore");
const init_1 = require("./init");
const guards_1 = require("./guards");
const entitlements_1 = require("./entitlements");
const revenuecat_1 = require("./revenuecat");
const claimEncounter_1 = require("./sanctuary/claimEncounter");
const createCastTransaction_1 = require("./sanctuary/createCastTransaction");
const ensureWellState_1 = require("./sanctuary/well/ensureWellState");
const initializeSanctuary_1 = require("./auth/initializeSanctuary");
const getOrAssignTodaysQuestion_1 = require("./sanctuary/well/getOrAssignTodaysQuestion");
const rerollWellQuestion_1 = require("./sanctuary/well/rerollWellQuestion");
const submitWellReflection_1 = require("./sanctuary/well/submitWellReflection");
const craftCallables_1 = require("./sanctuary/progression/craftCallables");
const completeLessonReflection_1 = require("./sanctuary/progression/completeLessonReflection");
const wonderRules_1 = require("./sanctuary/wonderRules");
const commitEconomyAction_1 = require("./sanctuary/economy/commitEconomyAction");
const resolveCallableIdempotency_1 = require("./sanctuary/economy/resolveCallableIdempotency");
const economy_1 = require("./sanctuary/economy");
const wellHelpers_1 = require("./sanctuary/well/wellHelpers");
const baitCatalog_1 = require("./sanctuary/baitCatalog");
/** Must match app `cloudFunctionsRegion` (default asia-east2). */
(0, v2_1.setGlobalOptions)({ region: "asia-east2" });
async function syncUserSubscriptionStatus(uid, appUserId) {
  const effectiveAppUserId = appUserId ?? uid;
  const subscriber = await (0, revenuecat_1.getRevenueCatSubscriber)(effectiveAppUserId);
  const subscription = (0, entitlements_1.deriveSubscriptionState)(subscriber);
  const activeRod =
    subscription.subscriptionStatus === "fiberglass"
      ? "fiberglass"
      : subscription.subscriptionStatus === "wooden"
        ? "wooden"
        : "basic";
  await init_1.db.collection("users").doc(uid).set({ subscription, activeRod }, { merge: true });
  return { subscription, activeRod, appUserId: effectiveAppUserId, subscriber };
}
exports.verifyPurchase = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new https_1.HttpsError("unauthenticated", "Authentication required");
  }
  await (0, guards_1.assertAccountActive)(uid);
  const appUserId = request.data.customerInfo?.originalAppUserId ?? uid;
  const syncResult = await syncUserSubscriptionStatus(uid, appUserId);
  const records = (0, entitlements_1.extractPurchaseAuditRecords)(syncResult.subscriber);
  const userRef = init_1.db.collection("users").doc(uid);
  const auditCollection = userRef.collection("purchases");
  for (const record of records) {
    const idempotencyKey = (0, economy_1.purchaseVerifyKey)(record.transactionId);
    const purchaseRef = auditCollection.doc(record.transactionId);
    await init_1.db.runTransaction(async (tx) => {
      const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
        tx,
        userRef,
        idempotencyKey,
      );
      if (idemRead.hit) {
        return;
      }
      const existing = await tx.get(purchaseRef);
      if (!existing.exists) {
        tx.set(purchaseRef, {
          productId: record.productId,
          platform: request.data.platform,
          transactionId: record.transactionId,
          purchasedAt: record.purchasedAt ?? firestore_1.Timestamp.now(),
          expiresAt: record.expiresAt ?? null,
          isRenewal: record.isRenewal,
          rawProviderRef: record.rawProviderRef,
          createdAt: firestore_1.Timestamp.now(),
        });
      }
      (0, resolveCallableIdempotency_1.writeIdempotencyInTransaction)(
        tx,
        userRef,
        idempotencyKey,
        "purchase_verify",
        {
          success: true,
        },
      );
    });
    firebase_functions_1.logger.info("Purchase audit entry created", {
      uid,
      productId: record.productId,
      transactionId: record.transactionId,
      isRenewal: record.isRenewal,
    });
  }
  firebase_functions_1.logger.info("Subscription state updated", {
    uid,
    appUserId: syncResult.appUserId,
    productId: request.data.productId,
    activeRod: syncResult.activeRod,
    subscriptionStatus: syncResult.subscription.subscriptionStatus,
    isLifetime: syncResult.subscription.isLifetime,
    expiryDate: syncResult.subscription.expiryDate?.toDate().toISOString() ?? null,
  });
  return { success: true };
});
exports.syncSubscriptionStatus = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  const currentUser = (await init_1.db.collection("users").doc(uid).get()).data();
  const mismatch = (() => {
    const status = currentUser?.subscription?.subscriptionStatus ?? "free";
    const expected = status === "free" ? "basic" : status;
    return (currentUser?.activeRod ?? "basic") !== expected;
  })();
  const syncResult = await syncUserSubscriptionStatus(uid);
  return {
    success: true,
    mismatchDetected: mismatch,
    activeRod: syncResult.activeRod,
    subscriptionStatus: syncResult.subscription.subscriptionStatus,
  };
});
exports.syncSubscriptionStatusDaily = (0, scheduler_1.onSchedule)("every 24 hours", async () => {
  const usersSnapshot = await init_1.db.collection("users").get();
  for (const doc of usersSnapshot.docs) {
    const uid = doc.id;
    try {
      const syncResult = await syncUserSubscriptionStatus(uid);
      firebase_functions_1.logger.info("Subscription sync refreshed", {
        uid,
        activeRod: syncResult.activeRod,
        subscriptionStatus: syncResult.subscription.subscriptionStatus,
        isLifetime: syncResult.subscription.isLifetime,
        expiryDate: syncResult.subscription.expiryDate?.toDate().toISOString() ?? null,
      });
    } catch (error) {
      firebase_functions_1.logger.error("Failed syncSubscriptionStatus for user", { uid, error });
    }
  }
});
/** Stable fallback when client omits requestId (djb2 via idempotencyDocId). */
function diaryContentIdempotencySeed(uid, source, depth, answers, lessonId) {
  return (0, economy_1.idempotencyDocId)(
    `${uid}:${source}:${depth}:${answers.join("|")}:${lessonId ?? ""}`,
  );
}
exports.submitDiaryEntry = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  const payload = request.data ?? {};
  const source = payload.source ?? "lesson";
  if (source === "lesson" && payload.lessonId) {
    const reflection = await (0, completeLessonReflection_1.handleCompleteLessonReflection)(uid, {
      lessonId: payload.lessonId,
      answers: payload.answers ?? [],
      prompts: payload.prompts,
      source,
      depth: payload.depth,
    });
    return {
      success: true,
      wonderAwarded: reflection.wonderAwarded,
      depth: reflection.depth,
      currentWonder: reflection.currentWonder,
      partsAwarded: reflection.partsAwarded,
      migrated: true,
    };
  }
  const answers = payload.answers ?? [];
  const depth = payload.depth ?? (0, wonderRules_1.inferDiaryDepth)(answers, source);
  const rule = wonderRules_1.DIARY_WONDER_BY_DEPTH[depth];
  const wonderAwarded = (0, wonderRules_1.wonderAmountForRule)(
    rule,
    `${uid}:${answers.join("|")}:${depth}`,
  );
  const rawRequestId = payload.requestId;
  const requestId =
    typeof rawRequestId === "string" && rawRequestId.trim() !== "" ? rawRequestId.trim() : null;
  const contentSeed = diaryContentIdempotencySeed(uid, source, depth, answers, payload.lessonId);
  const idempotencyKey = (0, economy_1.diaryKey)(requestId ?? contentSeed);
  const entryDocId = (0, economy_1.idempotencyDocId)(idempotencyKey);
  const transactionId = `tx_diary_${entryDocId}`;
  const userRef = init_1.db.collection("users").doc(uid);
  return await init_1.db.runTransaction(async (tx) => {
    const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return idemRead.response;
    }
    const economyCommit = await (0, commitEconomyAction_1.commitEconomyAction)({
      tx,
      userRef,
      uid,
      idempotencyKey,
      actionType: "diary_reflection",
      touchReflection: true,
      idempotencyMiss: { hit: false },
      build: ({ account }) => {
        const { transaction } = (0, economy_1.applyWonderEarnInMemory)(account, {
          source: rule.source,
          amount: wonderAwarded,
          transactionId,
          metadata: {
            depth,
            lessonId: payload.lessonId ?? null,
            entryId: entryDocId,
          },
        });
        const entry = (0, economy_1.buildEconomyLedgerEntry)({
          uid,
          actionType: "diary_reflection",
          source: rule.source,
          transaction,
          idempotencyKey,
          metadata: {
            depth,
            lessonId: payload.lessonId ?? null,
            entryId: entryDocId,
          },
        });
        return {
          entry,
          response: {
            success: true,
            wonderAwarded,
            depth,
            currentWonder: account.currentWonder + wonderAwarded,
          },
        };
      },
    });
    if (economyCommit.committed) {
      const entryRef = userRef.collection("diaryEntries").doc(entryDocId);
      tx.set(entryRef, {
        entryId: entryDocId,
        userId: uid,
        lessonId: payload.lessonId ?? null,
        source,
        depth,
        prompts: payload.prompts ?? [],
        answers,
        status: "completed",
        wonderAwarded,
        plantStage: 1,
        createdAt: firestore_1.Timestamp.now(),
        updatedAt: firestore_1.Timestamp.now(),
      });
      const analyticsRef = userRef.collection("sanctuaryAnalytics").doc();
      tx.set(analyticsRef, {
        type: "reflection_session",
        userId: uid,
        channel: source === "reignite" ? "reignite" : "diary",
        timestamp: Date.now(),
      });
    }
    return economyCommit.result;
  });
});
const LEGACY_WELL_MESSAGE =
  "This version of the app is out of date. Please update to continue using the Well.";
exports.ensureWellState = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  return (0, ensureWellState_1.ensureWellStateCallable)(uid);
});
exports.initializeSanctuary = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  const rawRequestId = request.data?.requestId;
  if (typeof rawRequestId !== "string" || rawRequestId.trim() === "") {
    throw new https_1.HttpsError("invalid-argument", "requestId is required");
  }
  if (uid) {
    await (0, guards_1.assertAccountActive)(uid);
  }
  return (0, initializeSanctuary_1.initializeSanctuaryCallable)(
    uid,
    rawRequestId.trim(),
    request.auth?.token?.email ?? null,
  );
});
exports.getOrAssignTodaysQuestion = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  return (0, getOrAssignTodaysQuestion_1.getOrAssignTodaysQuestionCallable)(
    uid,
    request.data ?? {},
  );
});
exports.submitWellReflection = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  return (0, submitWellReflection_1.submitWellReflectionCallable)(uid, request.data ?? {});
});
exports.rerollWellQuestion = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  const requestId = request.data?.requestId;
  if (typeof requestId !== "string" || requestId.trim() === "") {
    throw new https_1.HttpsError("invalid-argument", "requestId is required for reroll retries");
  }
  return (0, rerollWellQuestion_1.rerollWellQuestionCallable)(uid, request.data ?? {});
});
exports.startCraft = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  const payload = request.data ?? {};
  return (0, craftCallables_1.handleStartCraft)(uid, {
    rodId: payload.rodId,
  });
});
exports.collectCraft = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  const payload = request.data ?? {};
  return (0, craftCallables_1.handleCollectCraft)(uid, {
    rodId: payload.rodId,
  });
});
exports.equipRod = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  const payload = request.data ?? {};
  return (0, craftCallables_1.handleEquipRod)(uid, {
    rodId: payload.rodId,
    collectedThisBenchSession: payload.collectedThisBenchSession,
  });
});
exports.completeLessonReflection = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  const payload = request.data ?? {};
  if (!payload.lessonId) {
    throw new https_1.HttpsError("invalid-argument", "lessonId is required");
  }
  return (0, completeLessonReflection_1.handleCompleteLessonReflection)(uid, {
    lessonId: payload.lessonId,
    answers: payload.answers ?? [],
    prompts: payload.prompts,
    source: payload.source,
    depth: payload.depth,
    ritualId: payload.ritualId,
  });
});
exports.getRodProgression = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  return (0, craftCallables_1.handleGetRodProgression)(uid);
});
/** @deprecated Legacy free-text Well flow — stubbed for old app versions */
exports.createWellQuestion = (0, https_1.onCall)(async (request) => {
  if (!request.auth?.uid)
    throw new https_1.HttpsError("unauthenticated", "Authentication required");
  throw new https_1.HttpsError("failed-precondition", LEGACY_WELL_MESSAGE);
});
/** @deprecated Legacy free-text Well flow — stubbed for old app versions */
exports.answerWellQuestion = (0, https_1.onCall)(async (request) => {
  if (!request.auth?.uid)
    throw new https_1.HttpsError("unauthenticated", "Authentication required");
  throw new https_1.HttpsError("failed-precondition", LEGACY_WELL_MESSAGE);
});
exports.completePractice = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  const kind = String(request.data?.kind ?? "");
  const note = typeof request.data?.note === "string" ? request.data.note.trim() : undefined;
  const validKinds = [
    "tried_validation",
    "stayed_calm_during_conflict",
    "used_co_regulation",
    "followed_child_lead",
    "practiced_curiosity",
  ];
  if (!validKinds.includes(kind)) {
    throw new https_1.HttpsError("invalid-argument", "Invalid practice kind");
  }
  const localDate =
    (0, wellHelpers_1.parseLocalDate)(request.data?.localDate) ??
    new Date().toISOString().slice(0, 10);
  const rule = wonderRules_1.PRACTICE_WONDER_BY_KIND[kind];
  const wonderAwarded = (0, wonderRules_1.wonderAmountForRule)(rule, `${uid}:${kind}:${localDate}`);
  const idempotencyKey = (0, economy_1.practiceKey)(localDate, kind);
  const transactionId = `tx_practice_${localDate}_${kind}`;
  const completionDocId = (0, economy_1.idempotencyDocId)(idempotencyKey);
  const userRef = init_1.db.collection("users").doc(uid);
  return await init_1.db.runTransaction(async (tx) => {
    const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return idemRead.response;
    }
    const economyCommit = await (0, commitEconomyAction_1.commitEconomyAction)({
      tx,
      userRef,
      uid,
      idempotencyKey,
      actionType: "practice_complete",
      touchReflection: true,
      idempotencyMiss: { hit: false },
      build: ({ account }) => {
        const { transaction } = (0, economy_1.applyWonderEarnInMemory)(account, {
          source: rule.source,
          amount: wonderAwarded,
          transactionId,
          metadata: { kind, note: note ?? null, localDate },
        });
        const entry = (0, economy_1.buildEconomyLedgerEntry)({
          uid,
          actionType: "practice_complete",
          source: rule.source,
          transaction,
          idempotencyKey,
          metadata: { kind, note: note ?? null, localDate },
        });
        return {
          entry,
          response: {
            success: true,
            wonderAwarded,
            completionId: completionDocId,
          },
        };
      },
    });
    if (economyCommit.committed) {
      const completionRef = userRef.collection("practiceCompletions").doc(completionDocId);
      tx.set(completionRef, {
        id: completionDocId,
        userId: uid,
        kind,
        note: note ?? null,
        wonderAwarded,
        localDate,
        completedAt: firestore_1.Timestamp.now(),
      });
      const practiceAnalyticsRef = userRef.collection("sanctuaryAnalytics").doc();
      tx.set(practiceAnalyticsRef, {
        type: "practice_completed",
        userId: uid,
        kind,
        wonderAwarded,
        timestamp: Date.now(),
      });
      const reflectionAnalyticsRef = userRef.collection("sanctuaryAnalytics").doc();
      tx.set(reflectionAnalyticsRef, {
        type: "reflection_session",
        userId: uid,
        channel: "practice",
        timestamp: Date.now(),
      });
    }
    return economyCommit.result;
  });
});
exports.craftBait = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  const tier = String(request.data?.tier ?? "basic");
  if (!(tier in baitCatalog_1.BAIT_CRAFT_COSTS)) {
    throw new https_1.HttpsError("invalid-argument", "Invalid bait tier");
  }
  const cost = baitCatalog_1.BAIT_CRAFT_COSTS[tier];
  const rawRequestId = request.data?.requestId;
  const requestId =
    typeof rawRequestId === "string" && rawRequestId.trim() !== ""
      ? rawRequestId.trim()
      : `bait_${(0, node_crypto_1.randomUUID)()}`;
  if (!rawRequestId || (typeof rawRequestId === "string" && rawRequestId.trim() === "")) {
    firebase_functions_1.logger.warn(
      "craftBait missing client requestId — server generated id; retries will not dedupe",
      { uid },
    );
  }
  const idempotencyKey = (0, economy_1.baitCraftKey)(requestId);
  const transactionId = `tx_bait_craft_${requestId}`;
  const baitKey =
    tier === "basic" ? "feather_bait" : tier === "rare" ? "scale_bait" : "glimmerdust_bait";
  const materialsSpent = {};
  for (const [material, needed] of Object.entries(cost.materials)) {
    const amount = needed ?? 0;
    if (amount > 0) {
      materialsSpent[material] = amount;
    }
  }
  const userRef = init_1.db.collection("users").doc(uid);
  return await init_1.db.runTransaction(async (tx) => {
    const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return idemRead.response;
    }
    const economyCommit = await (0, commitEconomyAction_1.commitEconomyAction)({
      tx,
      userRef,
      uid,
      idempotencyKey,
      actionType: "bait_craft",
      touchReflection: false,
      idempotencyMiss: { hit: false },
      build: ({ account, userData }) => {
        if (account.currentWonder < cost.currentWonder) {
          throw new https_1.HttpsError("failed-precondition", "Insufficient current Wonder");
        }
        const inventory = userData.inventory ?? {};
        const baitMaterials = {
          feather: 0,
          scale: 0,
          glimmerdust: 0,
          ...inventory.baitMaterials,
        };
        for (const [material, needed] of Object.entries(cost.materials)) {
          const amount = needed ?? 0;
          if ((baitMaterials[material] ?? 0) < amount) {
            throw new https_1.HttpsError("failed-precondition", `Insufficient ${material}`);
          }
        }
        const baits = {
          feather_bait: 0,
          scale_bait: 0,
          glimmerdust_bait: 0,
          random_bait: 0,
          ...inventory.baits,
        };
        const nextBaits = {
          ...baits,
          [baitKey]: (baits[baitKey] ?? 0) + 1,
        };
        const deltaMaterials = {};
        for (const [material, needed] of Object.entries(cost.materials)) {
          deltaMaterials[material] = -(needed ?? 0);
        }
        let transaction;
        try {
          const spendResult = (0, economy_1.applyWonderSpendInMemory)(account, {
            source: "bait_craft",
            amount: cost.currentWonder,
            transactionId,
            pool: "current",
            metadata: { tier },
          });
          transaction = spendResult.transaction;
        } catch (error) {
          if (error instanceof economy_1.EconomyError && error.code === "INSUFFICIENT_WONDER") {
            throw new https_1.HttpsError("failed-precondition", "Insufficient current Wonder");
          }
          throw error;
        }
        const entry = (0, economy_1.buildEconomyLedgerEntry)({
          uid,
          actionType: "bait_craft",
          source: "bait_craft",
          transaction,
          idempotencyKey,
          metadata: { tier, baitKey },
          deltaMaterials,
        });
        return {
          entry,
          additionalUserPatch: {
            inventory: {
              baits: nextBaits,
            },
          },
          response: {
            success: true,
            tier,
            baitKey,
            wonderSpent: cost.currentWonder,
            materialsSpent,
          },
        };
      },
    });
    return economyCommit.result;
  });
});
exports.createCast = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  await (0, guards_1.assertActiveRodOrThrow)(uid, { minRod: "basic" });
  const payload = request.data ?? {};
  const rawRequestId = payload.requestId;
  const requestId =
    typeof rawRequestId === "string" && rawRequestId.trim() !== ""
      ? rawRequestId.trim()
      : `cast_req_${(0, node_crypto_1.randomUUID)()}`;
  if (!rawRequestId || (typeof rawRequestId === "string" && rawRequestId.trim() === "")) {
    firebase_functions_1.logger.warn(
      "createCast missing client requestId — server generated id; retries will not dedupe",
      { uid },
    );
  }
  const userRef = init_1.db.collection("users").doc(uid);
  return await init_1.db.runTransaction((tx) =>
    (0, createCastTransaction_1.runCreateCastInTransaction)({
      tx,
      userRef,
      uid,
      requestId,
      rodType: payload.rodType ?? "basic",
      baitUsed: payload.baitUsed ?? "random_bait",
    }),
  );
});
exports.claimCast = (0, https_1.onCall)(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  await (0, guards_1.assertAccountActive)(uid);
  await (0, guards_1.assertActiveRodOrThrow)(uid, { minRod: "basic" });
  // Invariant 8: castId is server-authoritative — ignore any client-supplied castId.
  const userRef = init_1.db.collection("users").doc(uid);
  try {
    const { claimSummary } = await (0, claimEncounter_1.executeClaimCast)(uid, userRef);
    return { success: true, claim: claimSummary };
  } catch (error) {
    if (error instanceof https_1.HttpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new https_1.HttpsError("internal", message);
  }
});
var accountDeletionExports_1 = require("./auth/accountDeletionExports");
Object.defineProperty(exports, "requestAccountDeletion", {
  enumerable: true,
  get: function () {
    return accountDeletionExports_1.requestAccountDeletion;
  },
});
Object.defineProperty(exports, "cancelAccountDeletion", {
  enumerable: true,
  get: function () {
    return accountDeletionExports_1.cancelAccountDeletion;
  },
});
Object.defineProperty(exports, "getAccountDeletionStatus", {
  enumerable: true,
  get: function () {
    return accountDeletionExports_1.getAccountDeletionStatus;
  },
});
Object.defineProperty(exports, "confirmAccountDeletionWeb", {
  enumerable: true,
  get: function () {
    return accountDeletionExports_1.confirmAccountDeletionWeb;
  },
});
Object.defineProperty(exports, "requestAccountDeletionByEmail", {
  enumerable: true,
  get: function () {
    return accountDeletionExports_1.requestAccountDeletionByEmail;
  },
});
Object.defineProperty(exports, "purgeExpiredAccountDeletions", {
  enumerable: true,
  get: function () {
    return accountDeletionExports_1.purgeExpiredAccountDeletions;
  },
});
var checkSignInEmailRegistered_1 = require("./auth/checkSignInEmailRegistered");
Object.defineProperty(exports, "checkSignInEmailRegistered", {
  enumerable: true,
  get: function () {
    return checkSignInEmailRegistered_1.checkSignInEmailRegisteredCallable;
  },
});
var compensateEconomyEntry_1 = require("./sanctuary/economy/compensateEconomyEntry");
Object.defineProperty(exports, "compensateEconomyEntry", {
  enumerable: true,
  get: function () {
    return compensateEconomyEntry_1.compensateEconomyEntryCallable;
  },
});
var adminReconcileUser_1 = require("./sanctuary/economy/adminReconcileUser");
Object.defineProperty(exports, "adminReconcileUser", {
  enumerable: true,
  get: function () {
    return adminReconcileUser_1.adminReconcileUserCallable;
  },
});
var compactEconomyLedger_1 = require("./sanctuary/economy/compactEconomyLedger");
Object.defineProperty(exports, "adminCompactEconomyLedger", {
  enumerable: true,
  get: function () {
    return compactEconomyLedger_1.adminCompactEconomyLedgerCallable;
  },
});
Object.defineProperty(exports, "scheduledEconomyLedgerCompaction", {
  enumerable: true,
  get: function () {
    return compactEconomyLedger_1.scheduledEconomyLedgerCompaction;
  },
});
var scheduledReconciliation_1 = require("./sanctuary/economy/scheduledReconciliation");
Object.defineProperty(exports, "scheduledEconomyReconciliation", {
  enumerable: true,
  get: function () {
    return scheduledReconciliation_1.scheduledEconomyReconciliation;
  },
});
var authFunnelTriggers_1 = require("./analytics/authFunnelTriggers");
Object.defineProperty(exports, "trackNewUserBackend", {
  enumerable: true,
  get: function () {
    return authFunnelTriggers_1.trackNewUserBackend;
  },
});
Object.defineProperty(exports, "sweepVerifyWallAbandoned", {
  enumerable: true,
  get: function () {
    return authFunnelTriggers_1.sweepVerifyWallAbandoned;
  },
});
Object.defineProperty(exports, "nightlyAbandonedAuthCleanup", {
  enumerable: true,
  get: function () {
    return authFunnelTriggers_1.nightlyAbandonedAuthCleanup;
  },
});
