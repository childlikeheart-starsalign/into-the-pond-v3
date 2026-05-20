import { logger } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { db } from "./init";
import { assertActiveRodOrThrow } from "./guards";
import { deriveSubscriptionState, extractPurchaseAuditRecords } from "./entitlements";
import { getRevenueCatSubscriber } from "./revenuecat";
import { ActiveRod } from "./types";

type VerifyPurchasePayload = {
  productId: string;
  platform: "ios" | "android";
  customerInfo?: {
    originalAppUserId?: string;
  };
};

type DailyCounterField = "dailyQuestionCount" | "fishingWonderToday";
type DailyCounterDateField = "lastQuestionResetDate" | "lastFishingResetDate";

function getUtcMidnightMs(now: Date = new Date()) {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function shouldResetDailyCounter(lastReset: Timestamp | null | undefined, now: Date = new Date()) {
  if (!lastReset) return true;
  return lastReset.toMillis() < getUtcMidnightMs(now);
}

function buildDailyResetPatch(
  data: Record<string, unknown>,
  fieldName: DailyCounterField,
  dateFieldName: DailyCounterDateField,
) {
  const lastReset = (data[dateFieldName] as Timestamp | null | undefined) ?? null;
  if (!shouldResetDailyCounter(lastReset)) {
    return null;
  }
  return {
    [fieldName]: 0,
    [dateFieldName]: Timestamp.now(),
  };
}

async function syncUserSubscriptionStatus(uid: string, appUserId?: string) {
  const effectiveAppUserId = appUserId ?? uid;
  const subscriber = await getRevenueCatSubscriber(effectiveAppUserId);
  const subscription = deriveSubscriptionState(subscriber);
  const activeRod: ActiveRod =
    subscription.subscriptionStatus === "fiberglass"
      ? "fiberglass"
      : subscription.subscriptionStatus === "wooden"
        ? "wooden"
        : "basic";

  await db.collection("users").doc(uid).set({ subscription, activeRod }, { merge: true });
  return { subscription, activeRod, appUserId: effectiveAppUserId, subscriber };
}

export const verifyPurchase = onCall<VerifyPurchasePayload>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const appUserId = request.data.customerInfo?.originalAppUserId ?? uid;
  const syncResult = await syncUserSubscriptionStatus(uid, appUserId);
  const records = extractPurchaseAuditRecords(syncResult.subscriber);
  const userRef = db.collection("users").doc(uid);

  const auditCollection = userRef.collection("purchases");
  for (const record of records) {
    const purchaseRef = auditCollection.doc(record.transactionId);
    const existing = await purchaseRef.get();
    if (existing.exists) continue;
    await purchaseRef.set({
      productId: record.productId,
      platform: request.data.platform,
      transactionId: record.transactionId,
      purchasedAt: record.purchasedAt ?? Timestamp.now(),
      expiresAt: record.expiresAt ?? null,
      isRenewal: record.isRenewal,
      rawProviderRef: record.rawProviderRef,
      createdAt: Timestamp.now(),
    });
    logger.info("Purchase audit entry created", {
      uid,
      productId: record.productId,
      transactionId: record.transactionId,
      isRenewal: record.isRenewal,
    });
  }

  logger.info("Subscription state updated", {
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

export const syncSubscriptionStatus = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  const currentUser = (await db.collection("users").doc(uid).get()).data() as
    | {
        subscription?: { subscriptionStatus?: "free" | "wooden" | "fiberglass" };
        activeRod?: ActiveRod;
      }
    | undefined;
  const mismatch = (() => {
    const status = currentUser?.subscription?.subscriptionStatus ?? "free";
    const expected: ActiveRod = status === "free" ? "basic" : status;
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

export const syncSubscriptionStatusDaily = onSchedule("every 24 hours", async () => {
  const usersSnapshot = await db.collection("users").get();
  for (const doc of usersSnapshot.docs) {
    const uid = doc.id;
    try {
      const syncResult = await syncUserSubscriptionStatus(uid);
      logger.info("Subscription sync refreshed", {
        uid,
        activeRod: syncResult.activeRod,
        subscriptionStatus: syncResult.subscription.subscriptionStatus,
        isLifetime: syncResult.subscription.isLifetime,
        expiryDate: syncResult.subscription.expiryDate?.toDate().toISOString() ?? null,
      });
    } catch (error) {
      logger.error("Failed syncSubscriptionStatus for user", { uid, error });
    }
  }
});

/**
 * Example protected endpoint for server-authoritative gating.
 */
export const castClaim = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  await assertActiveRodOrThrow(uid, { minRod: "wooden" });
  return { success: true, message: "Cast claim accepted." };
});

export const submitDiaryEntry = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");

  const payload = (request.data ?? {}) as {
    lessonId?: string;
    prompts?: string[];
    answers?: string[];
    source?: "lesson" | "reignite";
  };
  const source = payload.source ?? "lesson";
  const wonderAwarded = source === "lesson" ? 5 : 2;

  const entryRef = db.collection("users").doc(uid).collection("diaryEntries").doc();
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
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        totalWonder: FieldValue.increment(wonderAwarded),
        completedLessons: payload.lessonId ? { [payload.lessonId]: true } : {},
      },
      { merge: true },
    );

  return { success: true, wonderAwarded };
});

export const createWellQuestion = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  const questionText = String(request.data?.questionText ?? "").trim();
  if (!questionText) throw new HttpsError("invalid-argument", "questionText is required");

  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const rawData = (userSnap.data() ?? {}) as Record<string, unknown>;
  const resetPatch = buildDailyResetPatch(rawData, "dailyQuestionCount", "lastQuestionResetDate");
  if (resetPatch) {
    await userRef.set(resetPatch, { merge: true });
    rawData.dailyQuestionCount = 0;
    logger.info("UTC dailyQuestionCount reset applied", {
      event: "counter_reset",
      counter: "dailyQuestionCount",
      source: "inline_request",
      uid,
    });
  }
  const current = (rawData.dailyQuestionCount as number | undefined) ?? 0;
  if (current >= 3) {
    throw new HttpsError("failed-precondition", "Daily question limit reached");
  }
  const duplicate = await userRef
    .collection("wellQuestions")
    .where("questionText", "==", questionText)
    .limit(1)
    .get();
  if (!duplicate.empty) {
    throw new HttpsError("already-exists", "Duplicate question");
  }

  const questionRef = userRef.collection("wellQuestions").doc();
  await questionRef.set({
    questionText,
    answerText: null,
    createdAt: Timestamp.now(),
    answeredAt: null,
  });
  await userRef.set(
    {
      dailyQuestionCount: FieldValue.increment(1),
      ...(resetPatch ? {} : { lastQuestionResetDate: Timestamp.now() }),
    },
    { merge: true },
  );

  return { success: true, questionId: questionRef.id };
});

export const createCast = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  await assertActiveRodOrThrow(uid, { minRod: "basic" });

  const payload = (request.data ?? {}) as {
    rodType?: string;
    baitUsed?: string;
    expectedRarity?: string;
  };
  const castId = `cast_${Date.now()}`;
  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        activeCast: {
          castId,
          readyTimestamp: Timestamp.fromMillis(Date.now() + 2 * 60 * 1000),
          rodType: payload.rodType ?? "basic",
          baitUsed: payload.baitUsed ?? "random_bait",
          expectedRarity: payload.expectedRarity ?? "basic",
        },
      },
      { merge: true },
    );
  return { success: true, castId };
});

export const claimCast = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  await assertActiveRodOrThrow(uid, { minRod: "basic" });

  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const data = (userSnap.data() ?? {}) as {
    activeCast?: { castId?: string; readyTimestamp?: Timestamp };
    fishingWonderToday?: number;
    inventory?: { parts?: number };
    lastFishingResetDate?: Timestamp | null;
  };
  const fishingResetPatch = buildDailyResetPatch(
    data as Record<string, unknown>,
    "fishingWonderToday",
    "lastFishingResetDate",
  );
  if (fishingResetPatch) {
    await userRef.set(fishingResetPatch, { merge: true });
    data.fishingWonderToday = 0;
    logger.info("UTC fishingWonderToday reset applied", {
      event: "counter_reset",
      counter: "fishingWonderToday",
      source: "inline_request",
      uid,
    });
  }
  const cast = data.activeCast;
  if (!cast?.readyTimestamp || cast.readyTimestamp.toMillis() > Date.now()) {
    throw new HttpsError("failed-precondition", "Cast is not ready yet");
  }
  const currentFishingWonder = data.fishingWonderToday ?? 0;
  const rewardWonder = currentFishingWonder >= 20 ? 0 : Math.min(3, 20 - currentFishingWonder);

  await userRef.set(
    {
      activeCast: null,
      fishingWonderToday: FieldValue.increment(rewardWonder),
      totalWonder: FieldValue.increment(rewardWonder),
      inventory: {
        ...(data.inventory ?? {}),
        parts: (data.inventory?.parts ?? 0) + 1,
      },
      ...(fishingResetPatch ? {} : { lastFishingResetDate: Timestamp.now() }),
    },
    { merge: true },
  );
  return { success: true, rewardWonder };
});

export const resetDailyCountersHourly = onSchedule("every 1 hours", async () => {
  const usersSnapshot = await db.collection("users").get();
  for (const userDoc of usersSnapshot.docs) {
    const data = (userDoc.data() ?? {}) as Record<string, unknown>;
    const questionReset = buildDailyResetPatch(data, "dailyQuestionCount", "lastQuestionResetDate");
    const fishingReset = buildDailyResetPatch(data, "fishingWonderToday", "lastFishingResetDate");
    const patch = {
      ...(questionReset ?? {}),
      ...(fishingReset ?? {}),
    };
    if (Object.keys(patch).length === 0) continue;
    await userDoc.ref.set(patch, { merge: true });
    logger.info("Hourly UTC counter reset applied", {
      event: "counter_reset",
      source: "hourly_scheduler",
      uid: userDoc.id,
      questionReset: !!questionReset,
      fishingReset: !!fishingReset,
    });
  }
});
