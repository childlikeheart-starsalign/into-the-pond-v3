import { randomUUID } from "node:crypto";

import { logger } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreatedWithAuthContext } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { db } from "./init";
import { assertActiveRodOrThrow, assertAccountActive } from "./guards";
import { deriveSubscriptionState, extractPurchaseAuditRecords } from "./entitlements";
import { getRevenueCatSubscriber } from "./revenuecat";
import { executeClaimCast } from "./sanctuary/claimEncounter";
import { runCreateCastInTransaction } from "./sanctuary/createCastTransaction";
import type { DiaryReflectionDepth } from "./sanctuary/types";
import { ensureWellStateCallable } from "./sanctuary/well/ensureWellState";
import { initializeSanctuaryCallable } from "./auth/initializeSanctuary";
import { createChildProfileCallable } from "./auth/createChildProfile";
import { getOrAssignTodaysQuestionCallable } from "./sanctuary/well/getOrAssignTodaysQuestion";
import { rerollWellQuestionCallable } from "./sanctuary/well/rerollWellQuestion";
import { submitWellReflectionCallable } from "./sanctuary/well/submitWellReflection";
import {
  handleCollectCraft,
  handleEquipRod,
  handleGetRodProgression,
  handleStartCraft,
} from "./sanctuary/progression/craftCallables";
import { handleCompleteLessonReflection } from "./sanctuary/progression/completeLessonReflection";
import type { PracticeKind } from "./sanctuary/types";
import {
  DIARY_WONDER_BY_DEPTH,
  inferDiaryDepth,
  PRACTICE_WONDER_BY_KIND,
  WELL_QUESTION_ANSWERED,
  wonderAmountForRule,
} from "./sanctuary/wonderRules";
import { commitEconomyAction } from "./sanctuary/economy/commitEconomyAction";
import {
  readIdempotencyInTransaction,
  writeIdempotencyInTransaction,
} from "./sanctuary/economy/resolveCallableIdempotency";
import {
  applyWonderEarnInMemory,
  applyWonderSpendInMemory,
  baitCraftKey,
  buildEconomyLedgerEntry,
  diaryKey,
  EconomyError,
  idempotencyDocId,
  practiceKey,
  purchaseVerifyKey,
} from "./sanctuary/economy";
import { parseLocalDate } from "./sanctuary/well/wellHelpers";
import { BAIT_CRAFT_COSTS } from "./sanctuary/baitCatalog";
import type { CraftBaitResponse } from "./sanctuary/economy/callableResponses";
import { ActiveRod } from "./types";

/** Must match app `cloudFunctionsRegion` (default asia-east2). */
setGlobalOptions({ region: "asia-east2" });

type VerifyPurchasePayload = {
  productId: string;
  platform: "ios" | "android";
  customerInfo?: {
    originalAppUserId?: string;
  };
};

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
  await assertAccountActive(uid);

  const appUserId = request.data.customerInfo?.originalAppUserId ?? uid;
  const syncResult = await syncUserSubscriptionStatus(uid, appUserId);
  const records = extractPurchaseAuditRecords(syncResult.subscriber);
  const userRef = db.collection("users").doc(uid);
  const auditCollection = userRef.collection("purchases");

  for (const record of records) {
    const idempotencyKey = purchaseVerifyKey(record.transactionId);
    const purchaseRef = auditCollection.doc(record.transactionId);

    await db.runTransaction(async (tx) => {
      const idemRead = await readIdempotencyInTransaction<{ success: true }>(
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
          purchasedAt: record.purchasedAt ?? Timestamp.now(),
          expiresAt: record.expiresAt ?? null,
          isRenewal: record.isRenewal,
          rawProviderRef: record.rawProviderRef,
          createdAt: Timestamp.now(),
        });
      }

      writeIdempotencyInTransaction(tx, userRef, idempotencyKey, "purchase_verify", {
        success: true,
      });
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
  await assertAccountActive(uid);
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

type SubmitDiaryResponse = {
  success: true;
  wonderAwarded: number;
  depth: DiaryReflectionDepth;
  currentWonder: number;
};

/** Stable fallback when client omits requestId (djb2 via idempotencyDocId). */
function diaryContentIdempotencySeed(
  uid: string,
  source: string,
  depth: string,
  answers: string[],
  lessonId?: string,
): string {
  return idempotencyDocId(`${uid}:${source}:${depth}:${answers.join("|")}:${lessonId ?? ""}`);
}

export const submitDiaryEntry = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  await assertAccountActive(uid);

  const payload = (request.data ?? {}) as {
    lessonId?: string;
    prompts?: string[];
    answers?: string[];
    source?: "lesson" | "reignite" | "free";
    depth?: DiaryReflectionDepth;
    requestId?: string;
  };
  const source = payload.source ?? "lesson";

  if (source === "lesson" && payload.lessonId) {
    const reflection = await handleCompleteLessonReflection(uid, {
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
  const depth = payload.depth ?? inferDiaryDepth(answers, source);
  const rule = DIARY_WONDER_BY_DEPTH[depth];
  const wonderAwarded = wonderAmountForRule(rule, `${uid}:${answers.join("|")}:${depth}`);

  const rawRequestId = payload.requestId;
  const requestId =
    typeof rawRequestId === "string" && rawRequestId.trim() !== "" ? rawRequestId.trim() : null;
  const contentSeed = diaryContentIdempotencySeed(uid, source, depth, answers, payload.lessonId);
  const idempotencyKey = diaryKey(requestId ?? contentSeed);
  const entryDocId = idempotencyDocId(idempotencyKey);
  const transactionId = `tx_diary_${entryDocId}`;

  const userRef = db.collection("users").doc(uid);

  return await db.runTransaction(async (tx) => {
    const idemRead = await readIdempotencyInTransaction<SubmitDiaryResponse>(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return idemRead.response;
    }

    const economyCommit = await commitEconomyAction<SubmitDiaryResponse>({
      tx,
      userRef,
      uid,
      idempotencyKey,
      actionType: "diary_reflection",
      touchReflection: true,
      idempotencyMiss: { hit: false },
      build: ({ account }) => {
        const { transaction } = applyWonderEarnInMemory(account, {
          source: rule.source,
          amount: wonderAwarded,
          transactionId,
          metadata: {
            depth,
            lessonId: payload.lessonId ?? null,
            entryId: entryDocId,
          },
        });

        const entry = buildEconomyLedgerEntry({
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
            success: true as const,
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
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
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

export const ensureWellState = onCall(
  {
    // Match createCast / createChildProfile — under-provisioned cold starts fail healthchecks.
    memory: "256MiB",
    timeoutSeconds: 60,
    invoker: "public",
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
    await assertAccountActive(uid);
    return ensureWellStateCallable(uid, (request.data ?? {}) as { childId?: unknown });
  },
);

export const initializeSanctuary = onCall(async (request) => {
  const uid = request.auth?.uid;
  const rawRequestId = request.data?.requestId;
  if (typeof rawRequestId !== "string" || rawRequestId.trim() === "") {
    throw new HttpsError("invalid-argument", "requestId is required");
  }
  if (uid) {
    await assertAccountActive(uid);
  }
  return initializeSanctuaryCallable(uid, rawRequestId.trim(), request.auth?.token?.email ?? null);
});

/** Sealed multi-child profile create/append — does not touch economy paths. */
export const createChildProfile = onCall(
  {
    // Match createCast / initializeSanctuary — this project has seen Cloud Run
    // healthcheck failures on under-provisioned callable cold starts.
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
    await assertAccountActive(uid);
    return createChildProfileCallable(
      uid,
      (request.data ?? {}) as {
        draftId?: string;
        name?: string;
        dob?: string;
        companionId?: string;
        interests?: unknown;
      },
    );
  },
);

export const getOrAssignTodaysQuestion = onCall(
  {
    // Match createCast / createChildProfile — under-provisioned cold starts fail healthchecks.
    memory: "256MiB",
    timeoutSeconds: 60,
    invoker: "public",
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
    await assertAccountActive(uid);
    return getOrAssignTodaysQuestionCallable(uid, request.data ?? {});
  },
);

export const submitWellReflection = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  await assertAccountActive(uid);
  return submitWellReflectionCallable(uid, request.data ?? {});
});

export const rerollWellQuestion = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  await assertAccountActive(uid);
  const requestId = request.data?.requestId;
  if (typeof requestId !== "string" || requestId.trim() === "") {
    throw new HttpsError("invalid-argument", "requestId is required for reroll retries");
  }
  return rerollWellQuestionCallable(uid, request.data ?? {});
});

export const startCraft = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  await assertAccountActive(uid);
  const payload = (request.data ?? {}) as { rodId?: string };
  return handleStartCraft(uid, {
    rodId: payload.rodId as Parameters<typeof handleStartCraft>[1]["rodId"],
  });
});

export const collectCraft = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  await assertAccountActive(uid);
  const payload = (request.data ?? {}) as { rodId?: string };
  return handleCollectCraft(uid, {
    rodId: payload.rodId as Parameters<typeof handleCollectCraft>[1]["rodId"],
  });
});

export const equipRod = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  await assertAccountActive(uid);
  const payload = (request.data ?? {}) as { rodId?: string; collectedThisBenchSession?: boolean };
  return handleEquipRod(uid, {
    rodId: payload.rodId as Parameters<typeof handleEquipRod>[1]["rodId"],
    collectedThisBenchSession: payload.collectedThisBenchSession,
  });
});

export const completeLessonReflection = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  await assertAccountActive(uid);
  const payload = (request.data ?? {}) as {
    lessonId?: string;
    prompts?: string[];
    answers?: string[];
    source?: "lesson" | "reignite" | "free";
    depth?: "short" | "deep" | "full_deep";
    ritualId?: string | null;
  };
  if (!payload.lessonId) {
    throw new HttpsError("invalid-argument", "lessonId is required");
  }
  return handleCompleteLessonReflection(uid, {
    lessonId: payload.lessonId,
    answers: payload.answers ?? [],
    prompts: payload.prompts,
    source: payload.source,
    depth: payload.depth,
    ritualId: payload.ritualId,
  });
});

export const getRodProgression = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  await assertAccountActive(uid);
  return handleGetRodProgression(uid);
});

/** @deprecated Legacy free-text Well flow — stubbed for old app versions */
export const createWellQuestion = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required");
  throw new HttpsError("failed-precondition", LEGACY_WELL_MESSAGE);
});

/** @deprecated Legacy free-text Well flow — stubbed for old app versions */
export const answerWellQuestion = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required");
  throw new HttpsError("failed-precondition", LEGACY_WELL_MESSAGE);
});

type CompletePracticeResponse = {
  success: true;
  wonderAwarded: number;
  completionId: string;
};

export const completePractice = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  await assertAccountActive(uid);

  const kind = String(request.data?.kind ?? "") as PracticeKind;
  const note = typeof request.data?.note === "string" ? request.data.note.trim() : undefined;
  const validKinds: PracticeKind[] = [
    "tried_validation",
    "stayed_calm_during_conflict",
    "used_co_regulation",
    "followed_child_lead",
    "practiced_curiosity",
  ];
  if (!validKinds.includes(kind)) {
    throw new HttpsError("invalid-argument", "Invalid practice kind");
  }

  const localDate =
    parseLocalDate(request.data?.localDate) ?? new Date().toISOString().slice(0, 10);
  const rule = PRACTICE_WONDER_BY_KIND[kind];
  const wonderAwarded = wonderAmountForRule(rule, `${uid}:${kind}:${localDate}`);
  const idempotencyKey = practiceKey(localDate, kind);
  const transactionId = `tx_practice_${localDate}_${kind}`;
  const completionDocId = idempotencyDocId(idempotencyKey);

  const userRef = db.collection("users").doc(uid);

  return await db.runTransaction(async (tx) => {
    const idemRead = await readIdempotencyInTransaction<CompletePracticeResponse>(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return idemRead.response;
    }

    const economyCommit = await commitEconomyAction<CompletePracticeResponse>({
      tx,
      userRef,
      uid,
      idempotencyKey,
      actionType: "practice_complete",
      touchReflection: true,
      idempotencyMiss: { hit: false },
      build: ({ account }) => {
        const { transaction } = applyWonderEarnInMemory(account, {
          source: rule.source,
          amount: wonderAwarded,
          transactionId,
          metadata: { kind, note: note ?? null, localDate },
        });

        const entry = buildEconomyLedgerEntry({
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
            success: true as const,
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
        completedAt: Timestamp.now(),
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

export const craftBait = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  await assertAccountActive(uid);

  const tier = String(request.data?.tier ?? "basic") as keyof typeof BAIT_CRAFT_COSTS;
  if (!(tier in BAIT_CRAFT_COSTS)) {
    throw new HttpsError("invalid-argument", "Invalid bait tier");
  }
  const cost = BAIT_CRAFT_COSTS[tier];

  const rawRequestId = request.data?.requestId;
  const requestId =
    typeof rawRequestId === "string" && rawRequestId.trim() !== ""
      ? rawRequestId.trim()
      : `bait_${randomUUID()}`;
  if (!rawRequestId || (typeof rawRequestId === "string" && rawRequestId.trim() === "")) {
    logger.warn(
      "craftBait missing client requestId — server generated id; retries will not dedupe",
      { uid },
    );
  }

  const idempotencyKey = baitCraftKey(requestId);
  const transactionId = `tx_bait_craft_${requestId}`;
  const baitKey =
    tier === "basic" ? "feather_bait" : tier === "rare" ? "scale_bait" : "glimmerdust_bait";

  const materialsSpent: CraftBaitResponse["materialsSpent"] = {};
  for (const [material, needed] of Object.entries(cost.materials)) {
    const amount = needed ?? 0;
    if (amount > 0) {
      materialsSpent[material as keyof CraftBaitResponse["materialsSpent"]] = amount;
    }
  }

  const userRef = db.collection("users").doc(uid);

  return await db.runTransaction(async (tx) => {
    const idemRead = await readIdempotencyInTransaction<CraftBaitResponse>(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return idemRead.response;
    }

    const economyCommit = await commitEconomyAction<CraftBaitResponse>({
      tx,
      userRef,
      uid,
      idempotencyKey,
      actionType: "bait_craft",
      touchReflection: false,
      idempotencyMiss: { hit: false },
      build: ({ account, userData }) => {
        if (account.currentWonder < cost.currentWonder) {
          throw new HttpsError("failed-precondition", "Insufficient current Wonder");
        }

        const inventory = (userData.inventory as Record<string, unknown> | undefined) ?? {};
        const baitMaterials: Record<string, number> = {
          feather: 0,
          scale: 0,
          glimmerdust: 0,
          ...(inventory.baitMaterials as Record<string, number> | undefined),
        };
        for (const [material, needed] of Object.entries(cost.materials)) {
          const amount = needed ?? 0;
          if ((baitMaterials[material] ?? 0) < amount) {
            throw new HttpsError("failed-precondition", `Insufficient ${material}`);
          }
        }

        const baits = {
          feather_bait: 0,
          scale_bait: 0,
          glimmerdust_bait: 0,
          random_bait: 0,
          ...(inventory.baits as Record<string, number> | undefined),
        };
        const nextBaits = {
          ...baits,
          [baitKey]: (baits[baitKey] ?? 0) + 1,
        };

        const deltaMaterials: Partial<Record<"feather" | "scale" | "glimmerdust", number>> = {};
        for (const [material, needed] of Object.entries(cost.materials)) {
          deltaMaterials[material as "feather" | "scale" | "glimmerdust"] = -(needed ?? 0);
        }

        let transaction;
        try {
          const spendResult = applyWonderSpendInMemory(account, {
            source: "bait_craft",
            amount: cost.currentWonder,
            transactionId,
            pool: "current",
            metadata: { tier },
          });
          transaction = spendResult.transaction;
        } catch (error) {
          if (error instanceof EconomyError && error.code === "INSUFFICIENT_WONDER") {
            throw new HttpsError("failed-precondition", "Insufficient current Wonder");
          }
          throw error;
        }

        const entry = buildEconomyLedgerEntry({
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
            success: true as const,
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

export const createCast = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  await assertAccountActive(uid);
  await assertActiveRodOrThrow(uid, { minRod: "basic" });

  const payload = (request.data ?? {}) as {
    rodType?: string;
    baitUsed?: string;
    requestId?: string;
  };

  const rawRequestId = payload.requestId;
  const requestId =
    typeof rawRequestId === "string" && rawRequestId.trim() !== ""
      ? rawRequestId.trim()
      : `cast_req_${randomUUID()}`;
  if (!rawRequestId || (typeof rawRequestId === "string" && rawRequestId.trim() === "")) {
    logger.warn(
      "createCast missing client requestId — server generated id; retries will not dedupe",
      { uid },
    );
  }

  const userRef = db.collection("users").doc(uid);

  return await db.runTransaction((tx) =>
    runCreateCastInTransaction({
      tx,
      userRef,
      uid,
      requestId,
      rodType: payload.rodType ?? "basic",
      baitUsed: payload.baitUsed ?? "random_bait",
    }),
  );
});

export const processCastCreateRequest = onDocumentCreatedWithAuthContext(
  "users/{uid}/castCreateRequests/{requestId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const { uid, requestId } = event.params;
    const requestRef = snap.ref;
    const payload = snap.data() as {
      status?: string;
      rodType?: string;
      baitUsed?: string;
      requestId?: string;
    };

    if (event.authId && event.authId !== uid) {
      await requestRef.set(
        {
          status: "failed",
          errorCode: "permission-denied",
          errorMessage: "Cast request user mismatch",
          processedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      return;
    }

    try {
      await assertAccountActive(uid);
      await assertActiveRodOrThrow(uid, { minRod: "basic" });

      const result = await db.runTransaction((tx) =>
        runCreateCastInTransaction({
          tx,
          userRef: db.collection("users").doc(uid),
          uid,
          requestId,
          rodType: payload.rodType ?? "basic",
          baitUsed: payload.baitUsed ?? "random_bait",
        }),
      );

      await requestRef.set(
        {
          status: "succeeded",
          result,
          processedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    } catch (error) {
      const code = error instanceof HttpsError ? error.code : "internal";
      const message = error instanceof Error ? error.message : "Cast could not be started";
      logger.warn("processCastCreateRequest failed", { uid, requestId, code, message });
      await requestRef.set(
        {
          status: "failed",
          errorCode: code,
          errorMessage: message,
          processedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
  },
);

export const claimCast = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Authentication required");
  await assertAccountActive(uid);
  await assertActiveRodOrThrow(uid, { minRod: "basic" });

  // Invariant 8: castId is server-authoritative — ignore any client-supplied castId.
  const userRef = db.collection("users").doc(uid);

  try {
    const { claimSummary } = await executeClaimCast(uid, userRef);
    return { success: true, claim: claimSummary };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new HttpsError("internal", message);
  }
});

export {
  requestAccountDeletion,
  cancelAccountDeletion,
  getAccountDeletionStatus,
  confirmAccountDeletionWeb,
  requestAccountDeletionByEmail,
  purgeExpiredAccountDeletions,
} from "./auth/accountDeletionExports";
export { checkSignInEmailRegisteredCallable as checkSignInEmailRegistered } from "./auth/checkSignInEmailRegistered";
export { compensateEconomyEntryCallable as compensateEconomyEntry } from "./sanctuary/economy/compensateEconomyEntry";
export { adminReconcileUserCallable as adminReconcileUser } from "./sanctuary/economy/adminReconcileUser";
export {
  adminCompactEconomyLedgerCallable as adminCompactEconomyLedger,
  scheduledEconomyLedgerCompaction,
} from "./sanctuary/economy/compactEconomyLedger";
export { scheduledEconomyReconciliation } from "./sanctuary/economy/scheduledReconciliation";

export {
  trackNewUserBackend,
  sweepVerifyWallAbandoned,
  nightlyAbandonedAuthCleanup,
} from "./analytics/authFunnelTriggers";
