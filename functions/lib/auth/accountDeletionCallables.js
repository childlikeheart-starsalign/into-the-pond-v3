"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestAccountDeletionCallable = requestAccountDeletionCallable;
exports.getAccountDeletionStatusCallable = getAccountDeletionStatusCallable;
exports.cancelAccountDeletionCallable = cancelAccountDeletionCallable;
exports.confirmAccountDeletionWebCallable = confirmAccountDeletionWebCallable;
exports.requestAccountDeletionByEmailCallable = requestAccountDeletionByEmailCallable;
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const posthogServer_1 = require("../analytics/posthogServer");
const init_1 = require("../init");
const accountDeletionConstants_1 = require("./accountDeletionConstants");
const deletionCrypto_1 = require("./deletionCrypto");
const childrenDeletionBackup_1 = require("./childrenDeletionBackup");
const deletePiiSubcollections_1 = require("./deletePiiSubcollections");
const deletionWebRateLimit_1 = require("./deletionWebRateLimit");
const sendDeletionConfirmEmail_1 = require("./sendDeletionConfirmEmail");
const resolveCallableIdempotency_1 = require("../sanctuary/economy/resolveCallableIdempotency");
const IDEMPOTENCY_ACTION = "compensation";
function toStatusResponse(data) {
  return {
    status: data.deletionStatus ?? "active",
    purgeAt: data.deletionPurgeAt?.toDate?.()?.toISOString?.() ?? null,
    requestedAt: data.deletionRequestedAt?.toDate?.()?.toISOString?.() ?? null,
  };
}
function buildRestorePayload(_uid, userData, authEmail, authProvider, children) {
  return {
    email: userData.email ?? authEmail ?? "",
    childBirthDate: userData.childBirthDate,
    childArchetype: userData.childArchetype ?? null,
    hasCompletedDay1Narrative: userData.hasCompletedDay1Narrative,
    narrativeProgress: userData.narrativeProgress,
    authProvider: authProvider ?? "password",
    children,
    activeChildId: userData.activeChildId ?? null,
    childrenSummary: userData.childrenSummary,
  };
}
function scrubbedSubscription(userData) {
  return {
    productId: null,
    expiryDate: null,
    isLifetime: false,
    subscriptionStatus: "free",
    lastVerifiedAt: userData.subscription?.lastVerifiedAt ?? null,
    source: userData.subscription?.source ?? "unknown",
  };
}
async function runPhase1Deletion(params) {
  if (!(0, accountDeletionConstants_1.isAccountDeletionEnabled)()) {
    throw new https_1.HttpsError(
      "failed-precondition",
      "Account deletion is temporarily unavailable.",
    );
  }
  const { uid, requestId, source, webConfirmTokenHash = null } = params;
  const userRef = init_1.db.collection("users").doc(uid);
  const deletionRequestRef = init_1.db.collection("deletion_requests").doc(uid);
  const idempotencyKey = (0, accountDeletionConstants_1.accountDeletionIdempotencyKey)(requestId);
  const authUser = await (0, auth_1.getAuth)().getUser(uid);
  const authProvider = authUser.providerData[0]?.providerId ?? "password";
  const authEmail = authUser.email;
  // Backup all children BEFORE the scrubbing transaction (reads outside txn are ok —
  // children are only deleted after a successful fresh deletion commit).
  const childrenBackup = await (0, childrenDeletionBackup_1.backupAllChildrenSubtrees)(uid);
  const txResult = await init_1.db.runTransaction(async (tx) => {
    const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return { kind: "cached", response: idemRead.response };
    }
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new https_1.HttpsError("not-found", "User profile not found.");
    }
    const userData = userSnap.data();
    const currentStatus = userData.deletionStatus ?? "active";
    if (currentStatus === "pending") {
      const response = {
        success: true,
        ...toStatusResponse(userData),
      };
      (0, resolveCallableIdempotency_1.writeIdempotencyInTransaction)(
        tx,
        userRef,
        idempotencyKey,
        IDEMPOTENCY_ACTION,
        response,
      );
      return { kind: "cached", response };
    }
    if (currentStatus !== "active") {
      throw new https_1.HttpsError(
        "failed-precondition",
        "Account cannot be deleted in its current state.",
      );
    }
    const requestedAt = firestore_1.Timestamp.now();
    const purgeAt = firestore_1.Timestamp.fromDate(
      (0, accountDeletionConstants_1.purgeAtFromRequestedAt)(requestedAt.toMillis()),
    );
    const restorePayload = buildRestorePayload(
      uid,
      userData,
      authEmail,
      authProvider,
      childrenBackup,
    );
    const emailHmac = (0, deletionCrypto_1.hashEmailForLookup)(
      restorePayload.email || authEmail || uid,
    );
    tx.set(deletionRequestRef, {
      encryptedPayload: (0, deletionCrypto_1.encryptRestorePayload)(restorePayload),
      payloadVersion: accountDeletionConstants_1.ACCOUNT_DELETION_PAYLOAD_VERSION,
      createdAt: requestedAt,
      expiresAt: purgeAt,
      emailHmac,
      webConfirmTokenHash,
      usedAt: null,
    });
    tx.set(
      userRef,
      {
        email: "",
        childArchetype: null,
        childBirthDate: firestore_1.FieldValue.delete(),
        narrativeProgress: firestore_1.FieldValue.delete(),
        activeChildId: firestore_1.FieldValue.delete(),
        childrenSummary: firestore_1.FieldValue.delete(),
        subscription: scrubbedSubscription(userData),
        deletionStatus: "pending",
        deletionRequestedAt: requestedAt,
        deletionPurgeAt: purgeAt,
        deletionRequestId: requestId,
        deletionSource: source,
      },
      { merge: true },
    );
    const response = {
      success: true,
      status: "pending",
      purgeAt: purgeAt.toDate().toISOString(),
      requestedAt: requestedAt.toDate().toISOString(),
    };
    (0, resolveCallableIdempotency_1.writeIdempotencyInTransaction)(
      tx,
      userRef,
      idempotencyKey,
      IDEMPOTENCY_ACTION,
      response,
    );
    return { kind: "fresh", response };
  });
  if (txResult.kind === "fresh") {
    await (0, deletePiiSubcollections_1.deletePiiSubcollections)(uid);
    await (0, childrenDeletionBackup_1.deleteAllChildrenSubtrees)(uid);
    await (0, auth_1.getAuth)().revokeRefreshTokens(uid);
    await (0, posthogServer_1.captureAccountDeletionRequested)({ uid, source });
    firebase_functions_1.logger.info("account_deletion_requested", { uid, source, requestId });
  }
  return txResult.response;
}
async function requestAccountDeletionCallable(authUid, requestId) {
  if (!authUid) {
    throw new https_1.HttpsError("unauthenticated", "Authentication required");
  }
  if (!requestId.trim()) {
    throw new https_1.HttpsError("invalid-argument", "requestId is required");
  }
  return runPhase1Deletion({
    uid: authUid,
    requestId: requestId.trim(),
    source: "in_app",
  });
}
async function getAccountDeletionStatusCallable(authUid) {
  if (!authUid) {
    throw new https_1.HttpsError("unauthenticated", "Authentication required");
  }
  const snap = await init_1.db.collection("users").doc(authUid).get();
  if (!snap.exists) {
    return { status: "active", purgeAt: null, requestedAt: null };
  }
  return toStatusResponse(snap.data());
}
async function cancelAccountDeletionCallable(authUid) {
  if (!authUid) {
    throw new https_1.HttpsError("unauthenticated", "Authentication required");
  }
  const uid = authUid;
  const userRef = init_1.db.collection("users").doc(uid);
  const deletionRequestRef = init_1.db.collection("deletion_requests").doc(uid);
  let childrenToRestore;
  await init_1.db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new https_1.HttpsError("not-found", "User profile not found.");
    }
    const userData = userSnap.data();
    if ((userData.deletionStatus ?? "active") !== "pending") {
      throw new https_1.HttpsError("failed-precondition", "No pending deletion to cancel.");
    }
    const purgeAt = userData.deletionPurgeAt;
    if (purgeAt && purgeAt.toMillis() <= Date.now()) {
      throw new https_1.HttpsError("failed-precondition", "Deletion grace period has expired.");
    }
    const deletionSnap = await tx.get(deletionRequestRef);
    if (!deletionSnap.exists) {
      throw new https_1.HttpsError("failed-precondition", "Deletion backup not found.");
    }
    const encryptedPayload = deletionSnap.data()?.encryptedPayload;
    if (!encryptedPayload) {
      throw new https_1.HttpsError("failed-precondition", "Deletion backup is invalid.");
    }
    const restored = (0, deletionCrypto_1.decryptRestorePayload)(encryptedPayload);
    childrenToRestore = restored.children;
    tx.set(
      userRef,
      {
        email: restored.email,
        childArchetype: restored.childArchetype ?? null,
        ...(restored.childBirthDate ? { childBirthDate: restored.childBirthDate } : {}),
        ...(restored.hasCompletedDay1Narrative != null
          ? { hasCompletedDay1Narrative: restored.hasCompletedDay1Narrative }
          : {}),
        ...(restored.narrativeProgress ? { narrativeProgress: restored.narrativeProgress } : {}),
        ...(restored.activeChildId != null ? { activeChildId: restored.activeChildId } : {}),
        ...(restored.childrenSummary ? { childrenSummary: restored.childrenSummary } : {}),
        deletionStatus: "active",
        deletionRequestedAt: null,
        deletionPurgeAt: null,
        deletionRequestId: null,
        deletionSource: null,
      },
      { merge: true },
    );
    tx.delete(deletionRequestRef);
  });
  await (0, childrenDeletionBackup_1.restoreChildrenSubtrees)(uid, childrenToRestore);
  firebase_functions_1.logger.info("account_deletion_restored", { uid });
  return { success: true, status: "active" };
}
async function confirmAccountDeletionWebCallable(params) {
  const uid = params.uid.trim();
  const token = params.token.trim();
  const requestId = params.requestId.trim();
  if (!uid || !token || !requestId) {
    throw new https_1.HttpsError("invalid-argument", "uid, token, and requestId are required.");
  }
  const tokenHash = (0, deletionCrypto_1.hashWebConfirmToken)(token);
  const webTokenRef = init_1.db.collection("deletion_web_tokens").doc(uid);
  const webTokenSnap = await webTokenRef.get();
  if (!webTokenSnap.exists) {
    throw new https_1.HttpsError("permission-denied", "Invalid confirmation token.");
  }
  const webData = webTokenSnap.data();
  if (webData.tokenHash !== tokenHash || webData.usedAt) {
    throw new https_1.HttpsError("permission-denied", "Invalid confirmation token.");
  }
  if (webData.requestId && webData.requestId !== requestId) {
    throw new https_1.HttpsError("permission-denied", "Invalid confirmation token.");
  }
  const response = await runPhase1Deletion({
    uid,
    requestId,
    source: "web_email",
    webConfirmTokenHash: tokenHash,
  });
  await webTokenRef.set({ usedAt: firestore_1.Timestamp.now() }, { merge: true });
  await init_1.db
    .collection("deletion_requests")
    .doc(uid)
    .set({ usedAt: firestore_1.Timestamp.now() }, { merge: true });
  return response;
}
async function requestAccountDeletionByEmailCallable(email, opts = {}) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !/^\S+@\S+\.\S+$/.test(normalized)) {
    throw new https_1.HttpsError("invalid-argument", "A valid email address is required.");
  }
  const genericMessage =
    "If an account exists for this email, you will receive a confirmation link shortly.";
  if (!(0, accountDeletionConstants_1.isAccountDeletionEnabled)()) {
    return { message: genericMessage };
  }
  const rateLimited = await (0, deletionWebRateLimit_1.isDeletionWebRequestRateLimited)({
    email: normalized,
    clientIp: opts.clientIp ?? null,
  });
  if (rateLimited) {
    firebase_functions_1.logger.warn("account_deletion_web_rate_limited", {
      hasIp: Boolean(opts.clientIp),
    });
    return { message: genericMessage };
  }
  let uid;
  try {
    const authUser = await (0, auth_1.getAuth)().getUserByEmail(normalized);
    uid = authUser.uid;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "auth/user-not-found") {
      return { message: genericMessage };
    }
    throw new https_1.HttpsError("internal", "Unable to process deletion request.");
  }
  const userSnap = await init_1.db.collection("users").doc(uid).get();
  const userData = userSnap.data() ?? {};
  if ((userData.deletionStatus ?? "active") === "pending") {
    return { message: genericMessage };
  }
  const token = (0, deletionCrypto_1.generateWebConfirmToken)();
  const tokenHash = (0, deletionCrypto_1.hashWebConfirmToken)(token);
  const requestId = `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await init_1.db
    .collection("deletion_web_tokens")
    .doc(uid)
    .set({
      tokenHash,
      emailHmac: (0, deletionCrypto_1.hashEmailForLookup)(normalized),
      requestId,
      createdAt: firestore_1.Timestamp.now(),
      usedAt: null,
    });
  if (process.env.FUNCTIONS_EMULATOR === "true") {
    firebase_functions_1.logger.info("account_deletion_web_email_issued", {
      uid,
      requestId,
      emulatorLink: `confirm?uid=${uid}&token=${token}&requestId=${requestId}`,
    });
  } else {
    firebase_functions_1.logger.info("account_deletion_web_email_issued", { uid, requestId });
  }
  try {
    await (0, sendDeletionConfirmEmail_1.sendDeletionConfirmEmail)({
      to: normalized,
      uid,
      token,
      requestId,
    });
  } catch (error) {
    firebase_functions_1.logger.error("account_deletion_web_email_send_failed", {
      uid,
      requestId,
      message: error instanceof Error ? error.message : String(error),
    });
    throw new https_1.HttpsError(
      "internal",
      "Unable to send confirmation email. Please try again in a moment.",
    );
  }
  return { message: genericMessage };
}
