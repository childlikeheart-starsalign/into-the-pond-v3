import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

import { captureAccountDeletionRequested } from "../analytics/posthogServer";
import { db } from "../init";
import {
  accountDeletionIdempotencyKey,
  ACCOUNT_DELETION_PAYLOAD_VERSION,
  isAccountDeletionEnabled,
  purgeAtFromRequestedAt,
} from "./accountDeletionConstants";
import {
  decryptRestorePayload,
  encryptRestorePayload,
  generateWebConfirmToken,
  hashEmailForLookup,
  hashWebConfirmToken,
  type AccountDeletionRestorePayload,
} from "./deletionCrypto";
import {
  backupAllChildrenSubtrees,
  deleteAllChildrenSubtrees,
  restoreChildrenSubtrees,
} from "./childrenDeletionBackup";
import { deletePiiSubcollections } from "./deletePiiSubcollections";
import { isDeletionWebRequestRateLimited } from "./deletionWebRateLimit";
import { sendDeletionConfirmEmail } from "./sendDeletionConfirmEmail";
import {
  readIdempotencyInTransaction,
  writeIdempotencyInTransaction,
} from "../sanctuary/economy/resolveCallableIdempotency";
import type { DeletionSource, DeletionStatus } from "../types";

export type AccountDeletionStatusResponse = {
  status: DeletionStatus;
  purgeAt: string | null;
  requestedAt: string | null;
};

export type RequestAccountDeletionResponse = AccountDeletionStatusResponse & {
  success: true;
};

const IDEMPOTENCY_ACTION = "compensation" as const;

type UserProfileSlice = {
  email?: string;
  childBirthDate?: string;
  childArchetype?: string | null;
  hasCompletedDay1Narrative?: boolean;
  narrativeProgress?: AccountDeletionRestorePayload["narrativeProgress"];
  activeChildId?: string | null;
  childrenSummary?: AccountDeletionRestorePayload["childrenSummary"];
  deletionStatus?: DeletionStatus;
  deletionPurgeAt?: Timestamp | null;
  deletionRequestedAt?: Timestamp | null;
  subscription?: {
    productId?: string | null;
    expiryDate?: Timestamp | null;
    isLifetime?: boolean;
    subscriptionStatus?: string;
    lastVerifiedAt?: Timestamp | null;
    source?: string;
  };
};

function toStatusResponse(data: UserProfileSlice): AccountDeletionStatusResponse {
  return {
    status: data.deletionStatus ?? "active",
    purgeAt: data.deletionPurgeAt?.toDate?.()?.toISOString?.() ?? null,
    requestedAt: data.deletionRequestedAt?.toDate?.()?.toISOString?.() ?? null,
  };
}

function buildRestorePayload(
  _uid: string,
  userData: UserProfileSlice,
  authEmail: string | null | undefined,
  authProvider: string | undefined,
  children: AccountDeletionRestorePayload["children"],
): AccountDeletionRestorePayload {
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

function scrubbedSubscription(userData: UserProfileSlice) {
  return {
    productId: null,
    expiryDate: null,
    isLifetime: false,
    subscriptionStatus: "free",
    lastVerifiedAt: userData.subscription?.lastVerifiedAt ?? null,
    source: userData.subscription?.source ?? "unknown",
  };
}

async function runPhase1Deletion(params: {
  uid: string;
  requestId: string;
  source: DeletionSource;
  webConfirmTokenHash?: string | null;
}): Promise<RequestAccountDeletionResponse> {
  if (!isAccountDeletionEnabled()) {
    throw new HttpsError("failed-precondition", "Account deletion is temporarily unavailable.");
  }

  const { uid, requestId, source, webConfirmTokenHash = null } = params;
  const userRef = db.collection("users").doc(uid);
  const deletionRequestRef = db.collection("deletion_requests").doc(uid);
  const idempotencyKey = accountDeletionIdempotencyKey(requestId);

  const authUser = await getAuth().getUser(uid);
  const authProvider = authUser.providerData[0]?.providerId ?? "password";
  const authEmail = authUser.email;

  // Backup all children BEFORE the scrubbing transaction (reads outside txn are ok —
  // children are only deleted after a successful fresh deletion commit).
  const childrenBackup = await backupAllChildrenSubtrees(uid);

  const txResult = await db.runTransaction(async (tx) => {
    const idemRead = await readIdempotencyInTransaction<RequestAccountDeletionResponse>(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return { kind: "cached" as const, response: idemRead.response };
    }

    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "User profile not found.");
    }

    const userData = userSnap.data() as UserProfileSlice;
    const currentStatus = userData.deletionStatus ?? "active";

    if (currentStatus === "pending") {
      const response: RequestAccountDeletionResponse = {
        success: true,
        ...toStatusResponse(userData),
      };
      writeIdempotencyInTransaction(tx, userRef, idempotencyKey, IDEMPOTENCY_ACTION, response);
      return { kind: "cached" as const, response };
    }

    if (currentStatus !== "active") {
      throw new HttpsError(
        "failed-precondition",
        "Account cannot be deleted in its current state.",
      );
    }

    const requestedAt = Timestamp.now();
    const purgeAt = Timestamp.fromDate(purgeAtFromRequestedAt(requestedAt.toMillis()));
    const restorePayload = buildRestorePayload(
      uid,
      userData,
      authEmail,
      authProvider,
      childrenBackup,
    );
    const emailHmac = hashEmailForLookup(restorePayload.email || authEmail || uid);

    tx.set(deletionRequestRef, {
      encryptedPayload: encryptRestorePayload(restorePayload),
      payloadVersion: ACCOUNT_DELETION_PAYLOAD_VERSION,
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
        childBirthDate: FieldValue.delete(),
        narrativeProgress: FieldValue.delete(),
        activeChildId: FieldValue.delete(),
        childrenSummary: FieldValue.delete(),
        subscription: scrubbedSubscription(userData),
        deletionStatus: "pending",
        deletionRequestedAt: requestedAt,
        deletionPurgeAt: purgeAt,
        deletionRequestId: requestId,
        deletionSource: source,
      },
      { merge: true },
    );

    const response: RequestAccountDeletionResponse = {
      success: true,
      status: "pending",
      purgeAt: purgeAt.toDate().toISOString(),
      requestedAt: requestedAt.toDate().toISOString(),
    };

    writeIdempotencyInTransaction(tx, userRef, idempotencyKey, IDEMPOTENCY_ACTION, response);
    return { kind: "fresh" as const, response };
  });

  if (txResult.kind === "fresh") {
    await deletePiiSubcollections(uid);
    await deleteAllChildrenSubtrees(uid);
    await getAuth().revokeRefreshTokens(uid);
    await captureAccountDeletionRequested({ uid, source });
    logger.info("account_deletion_requested", { uid, source, requestId });
  }

  return txResult.response;
}

export async function requestAccountDeletionCallable(
  authUid: string | undefined,
  requestId: string,
): Promise<RequestAccountDeletionResponse> {
  if (!authUid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  if (!requestId.trim()) {
    throw new HttpsError("invalid-argument", "requestId is required");
  }

  return runPhase1Deletion({
    uid: authUid,
    requestId: requestId.trim(),
    source: "in_app",
  });
}

export async function getAccountDeletionStatusCallable(
  authUid: string | undefined,
): Promise<AccountDeletionStatusResponse> {
  if (!authUid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const snap = await db.collection("users").doc(authUid).get();
  if (!snap.exists) {
    return { status: "active", purgeAt: null, requestedAt: null };
  }

  return toStatusResponse(snap.data() as UserProfileSlice);
}

export async function cancelAccountDeletionCallable(
  authUid: string | undefined,
): Promise<{ success: true; status: "active" }> {
  if (!authUid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const uid = authUid;
  const userRef = db.collection("users").doc(uid);
  const deletionRequestRef = db.collection("deletion_requests").doc(uid);

  let childrenToRestore: AccountDeletionRestorePayload["children"];

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "User profile not found.");
    }

    const userData = userSnap.data() as UserProfileSlice;
    if ((userData.deletionStatus ?? "active") !== "pending") {
      throw new HttpsError("failed-precondition", "No pending deletion to cancel.");
    }

    const purgeAt = userData.deletionPurgeAt;
    if (purgeAt && purgeAt.toMillis() <= Date.now()) {
      throw new HttpsError("failed-precondition", "Deletion grace period has expired.");
    }

    const deletionSnap = await tx.get(deletionRequestRef);
    if (!deletionSnap.exists) {
      throw new HttpsError("failed-precondition", "Deletion backup not found.");
    }

    const encryptedPayload = deletionSnap.data()?.encryptedPayload as string | undefined;
    if (!encryptedPayload) {
      throw new HttpsError("failed-precondition", "Deletion backup is invalid.");
    }

    const restored = decryptRestorePayload(encryptedPayload);
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

  await restoreChildrenSubtrees(uid, childrenToRestore);

  logger.info("account_deletion_restored", { uid });
  return { success: true, status: "active" };
}

export async function confirmAccountDeletionWebCallable(params: {
  uid: string;
  token: string;
  requestId: string;
}): Promise<RequestAccountDeletionResponse> {
  const uid = params.uid.trim();
  const token = params.token.trim();
  const requestId = params.requestId.trim();

  if (!uid || !token || !requestId) {
    throw new HttpsError("invalid-argument", "uid, token, and requestId are required.");
  }

  const tokenHash = hashWebConfirmToken(token);
  const webTokenRef = db.collection("deletion_web_tokens").doc(uid);
  const webTokenSnap = await webTokenRef.get();

  if (!webTokenSnap.exists) {
    throw new HttpsError("permission-denied", "Invalid confirmation token.");
  }

  const webData = webTokenSnap.data() as {
    tokenHash?: string;
    usedAt?: Timestamp | null;
    requestId?: string;
  };

  if (webData.tokenHash !== tokenHash || webData.usedAt) {
    throw new HttpsError("permission-denied", "Invalid confirmation token.");
  }
  if (webData.requestId && webData.requestId !== requestId) {
    throw new HttpsError("permission-denied", "Invalid confirmation token.");
  }

  const response = await runPhase1Deletion({
    uid,
    requestId,
    source: "web_email",
    webConfirmTokenHash: tokenHash,
  });

  await webTokenRef.set({ usedAt: Timestamp.now() }, { merge: true });
  await db
    .collection("deletion_requests")
    .doc(uid)
    .set({ usedAt: Timestamp.now() }, { merge: true });

  return response;
}

export async function requestAccountDeletionByEmailCallable(
  email: string,
  opts: { clientIp?: string | null } = {},
): Promise<{ message: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !/^\S+@\S+\.\S+$/.test(normalized)) {
    throw new HttpsError("invalid-argument", "A valid email address is required.");
  }

  const genericMessage =
    "If an account exists for this email, you will receive a confirmation link shortly.";

  if (!isAccountDeletionEnabled()) {
    return { message: genericMessage };
  }

  const rateLimited = await isDeletionWebRequestRateLimited({
    email: normalized,
    clientIp: opts.clientIp ?? null,
  });
  if (rateLimited) {
    logger.warn("account_deletion_web_rate_limited", {
      hasIp: Boolean(opts.clientIp),
    });
    return { message: genericMessage };
  }

  let uid: string;
  try {
    const authUser = await getAuth().getUserByEmail(normalized);
    uid = authUser.uid;
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "auth/user-not-found") {
      return { message: genericMessage };
    }
    throw new HttpsError("internal", "Unable to process deletion request.");
  }

  const userSnap = await db.collection("users").doc(uid).get();
  const userData = (userSnap.data() ?? {}) as UserProfileSlice;
  if ((userData.deletionStatus ?? "active") === "pending") {
    return { message: genericMessage };
  }

  const token = generateWebConfirmToken();
  const tokenHash = hashWebConfirmToken(token);
  const requestId = `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  await db
    .collection("deletion_web_tokens")
    .doc(uid)
    .set({
      tokenHash,
      emailHmac: hashEmailForLookup(normalized),
      requestId,
      createdAt: Timestamp.now(),
      usedAt: null,
    });

  if (process.env.FUNCTIONS_EMULATOR === "true") {
    logger.info("account_deletion_web_email_issued", {
      uid,
      requestId,
      emulatorLink: `confirm?uid=${uid}&token=${token}&requestId=${requestId}`,
    });
  } else {
    logger.info("account_deletion_web_email_issued", { uid, requestId });
  }

  try {
    await sendDeletionConfirmEmail({
      to: normalized,
      uid,
      token,
      requestId,
    });
  } catch (error) {
    logger.error("account_deletion_web_email_send_failed", {
      uid,
      requestId,
      message: error instanceof Error ? error.message : String(error),
    });
    throw new HttpsError(
      "internal",
      "Unable to send confirmation email. Please try again in a moment.",
    );
  }

  return { message: genericMessage };
}
