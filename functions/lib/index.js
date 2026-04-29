"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDailyCountersHourly = exports.claimCast = exports.createCast = exports.createWellQuestion = exports.submitDiaryEntry = exports.castClaim = exports.syncSubscriptionStatusDaily = exports.syncSubscriptionStatus = exports.verifyPurchase = void 0;
const firebase_functions_1 = require("firebase-functions");
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const init_1 = require("./init");
const guards_1 = require("./guards");
const entitlements_1 = require("./entitlements");
const revenuecat_1 = require("./revenuecat");
function getUtcMidnightMs(now = new Date()) {
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}
function shouldResetDailyCounter(lastReset, now = new Date()) {
    if (!lastReset)
        return true;
    return lastReset.toMillis() < getUtcMidnightMs(now);
}
function buildDailyResetPatch(data, fieldName, dateFieldName) {
    const lastReset = data[dateFieldName] ?? null;
    if (!shouldResetDailyCounter(lastReset)) {
        return null;
    }
    return {
        [fieldName]: 0,
        [dateFieldName]: firestore_1.Timestamp.now(),
    };
}
async function syncUserSubscriptionStatus(uid, appUserId) {
    const effectiveAppUserId = appUserId ?? uid;
    const subscriber = await (0, revenuecat_1.getRevenueCatSubscriber)(effectiveAppUserId);
    const subscription = (0, entitlements_1.deriveSubscriptionState)(subscriber);
    const activeRod = subscription.subscriptionStatus === "fiberglass"
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
    const appUserId = request.data.customerInfo?.originalAppUserId ?? uid;
    const syncResult = await syncUserSubscriptionStatus(uid, appUserId);
    const records = (0, entitlements_1.extractPurchaseAuditRecords)(syncResult.subscriber);
    const userRef = init_1.db.collection("users").doc(uid);
    const auditCollection = userRef.collection("purchases");
    for (const record of records) {
        const purchaseRef = auditCollection.doc(record.transactionId);
        const existing = await purchaseRef.get();
        if (existing.exists)
            continue;
        await purchaseRef.set({
            productId: record.productId,
            platform: request.data.platform,
            transactionId: record.transactionId,
            purchasedAt: record.purchasedAt ?? firestore_1.Timestamp.now(),
            expiresAt: record.expiresAt ?? null,
            isRenewal: record.isRenewal,
            rawProviderRef: record.rawProviderRef,
            createdAt: firestore_1.Timestamp.now(),
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
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required");
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
        }
        catch (error) {
            firebase_functions_1.logger.error("Failed syncSubscriptionStatus for user", { uid, error });
        }
    }
});
/**
 * Example protected endpoint for server-authoritative gating.
 */
exports.castClaim = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required");
    }
    await (0, guards_1.assertActiveRodOrThrow)(uid, { minRod: "wooden" });
    return { success: true, message: "Cast claim accepted." };
});
exports.submitDiaryEntry = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required");
    const payload = (request.data ?? {});
    const source = payload.source ?? "lesson";
    const wonderAwarded = source === "lesson" ? 5 : 2;
    const entryRef = init_1.db.collection("users").doc(uid).collection("diaryEntries").doc();
    await entryRef.set({
        entryId: entryRef.id,
        userId: uid,
        lessonId: payload.lessonId ?? null,
        source,
        prompts: payload.prompts ?? [],
        answers: payload.answers ?? [],
        status: "completed",
        wonderAwarded,
        plantStage: 1,
        createdAt: firestore_1.Timestamp.now(),
        updatedAt: firestore_1.Timestamp.now(),
    });
    await init_1.db
        .collection("users")
        .doc(uid)
        .set({
        totalWonder: firestore_1.FieldValue.increment(wonderAwarded),
        completedLessons: payload.lessonId ? { [payload.lessonId]: true } : {},
    }, { merge: true });
    return { success: true, wonderAwarded };
});
exports.createWellQuestion = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required");
    const questionText = String(request.data?.questionText ?? "").trim();
    if (!questionText)
        throw new https_1.HttpsError("invalid-argument", "questionText is required");
    const userRef = init_1.db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const rawData = (userSnap.data() ?? {});
    const resetPatch = buildDailyResetPatch(rawData, "dailyQuestionCount", "lastQuestionResetDate");
    if (resetPatch) {
        await userRef.set(resetPatch, { merge: true });
        rawData.dailyQuestionCount = 0;
        firebase_functions_1.logger.info("UTC dailyQuestionCount reset applied", {
            event: "counter_reset",
            counter: "dailyQuestionCount",
            source: "inline_request",
            uid,
        });
    }
    const current = rawData.dailyQuestionCount ?? 0;
    if (current >= 3) {
        throw new https_1.HttpsError("failed-precondition", "Daily question limit reached");
    }
    const duplicate = await userRef
        .collection("wellQuestions")
        .where("questionText", "==", questionText)
        .limit(1)
        .get();
    if (!duplicate.empty) {
        throw new https_1.HttpsError("already-exists", "Duplicate question");
    }
    const questionRef = userRef.collection("wellQuestions").doc();
    await questionRef.set({
        questionText,
        answerText: null,
        createdAt: firestore_1.Timestamp.now(),
        answeredAt: null,
    });
    await userRef.set({
        dailyQuestionCount: firestore_1.FieldValue.increment(1),
        ...(resetPatch ? {} : { lastQuestionResetDate: firestore_1.Timestamp.now() }),
    }, { merge: true });
    return { success: true, questionId: questionRef.id };
});
exports.createCast = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required");
    await (0, guards_1.assertActiveRodOrThrow)(uid, { minRod: "basic" });
    const payload = (request.data ?? {});
    const castId = `cast_${Date.now()}`;
    await init_1.db
        .collection("users")
        .doc(uid)
        .set({
        activeCast: {
            castId,
            readyTimestamp: firestore_1.Timestamp.fromMillis(Date.now() + 2 * 60 * 1000),
            rodType: payload.rodType ?? "basic",
            baitUsed: payload.baitUsed ?? "random_bait",
            expectedRarity: payload.expectedRarity ?? "basic",
        },
    }, { merge: true });
    return { success: true, castId };
});
exports.claimCast = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Authentication required");
    await (0, guards_1.assertActiveRodOrThrow)(uid, { minRod: "basic" });
    const userRef = init_1.db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const data = (userSnap.data() ?? {});
    const fishingResetPatch = buildDailyResetPatch(data, "fishingWonderToday", "lastFishingResetDate");
    if (fishingResetPatch) {
        await userRef.set(fishingResetPatch, { merge: true });
        data.fishingWonderToday = 0;
        firebase_functions_1.logger.info("UTC fishingWonderToday reset applied", {
            event: "counter_reset",
            counter: "fishingWonderToday",
            source: "inline_request",
            uid,
        });
    }
    const cast = data.activeCast;
    if (!cast?.readyTimestamp || cast.readyTimestamp.toMillis() > Date.now()) {
        throw new https_1.HttpsError("failed-precondition", "Cast is not ready yet");
    }
    const currentFishingWonder = data.fishingWonderToday ?? 0;
    const rewardWonder = currentFishingWonder >= 20 ? 0 : Math.min(3, 20 - currentFishingWonder);
    await userRef.set({
        activeCast: null,
        fishingWonderToday: firestore_1.FieldValue.increment(rewardWonder),
        totalWonder: firestore_1.FieldValue.increment(rewardWonder),
        inventory: {
            ...(data.inventory ?? {}),
            parts: (data.inventory?.parts ?? 0) + 1,
        },
        ...(fishingResetPatch ? {} : { lastFishingResetDate: firestore_1.Timestamp.now() }),
    }, { merge: true });
    return { success: true, rewardWonder };
});
exports.resetDailyCountersHourly = (0, scheduler_1.onSchedule)("every 1 hours", async () => {
    const usersSnapshot = await init_1.db.collection("users").get();
    for (const userDoc of usersSnapshot.docs) {
        const data = (userDoc.data() ?? {});
        const questionReset = buildDailyResetPatch(data, "dailyQuestionCount", "lastQuestionResetDate");
        const fishingReset = buildDailyResetPatch(data, "fishingWonderToday", "lastFishingResetDate");
        const patch = {
            ...(questionReset ?? {}),
            ...(fishingReset ?? {}),
        };
        if (Object.keys(patch).length === 0)
            continue;
        await userDoc.ref.set(patch, { merge: true });
        firebase_functions_1.logger.info("Hourly UTC counter reset applied", {
            event: "counter_reset",
            source: "hourly_scheduler",
            uid: userDoc.id,
            questionReset: !!questionReset,
            fishingReset: !!fishingReset,
        });
    }
});
