"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSanctuaryCallable = initializeSanctuaryCallable;
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const init_1 = require("../init");
const posthogServer_1 = require("../analytics/posthogServer");
const types_1 = require("../sanctuary/well/types");
const resolveCallableIdempotency_1 = require("../sanctuary/economy/resolveCallableIdempotency");
const defaultUserDoc_1 = require("./defaultUserDoc");
const SANCTUARY_INIT_ACTION = "compensation";
function hoursSinceCreation(iso) {
  if (!iso) return 0;
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(0, (Date.now() - created) / (1000 * 60 * 60));
}
async function initializeSanctuaryCallable(authUid, requestId, email) {
  if (!authUid) {
    throw new https_1.HttpsError("unauthenticated", "Authentication required");
  }
  if (!requestId.trim()) {
    throw new https_1.HttpsError("invalid-argument", "requestId is required");
  }
  const authUser = await (0, auth_1.getAuth)().getUser(authUid);
  if (!authUser.emailVerified) {
    throw new https_1.HttpsError(
      "failed-precondition",
      "Email must be verified before sanctuary init",
    );
  }
  const uid = authUid;
  const userRef = init_1.db.collection("users").doc(uid);
  const wellRef = userRef.collection("wellState").doc("current");
  const idempotencyKey = (0, defaultUserDoc_1.sanctuaryInitKey)(requestId.trim());
  const txResult = await init_1.db.runTransaction(async (tx) => {
    const idemRead = await (0, resolveCallableIdempotency_1.readIdempotencyInTransaction)(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return { response: idemRead.response, captureEmailVerified: false };
    }
    const userSnap = await tx.get(userRef);
    const existing = userSnap.data();
    if (existing?.authFunnel?.sanctuaryInitialized === true) {
      const response = {
        status: "already_initialized",
        sanctuaryInitialized: true,
      };
      (0, resolveCallableIdempotency_1.writeIdempotencyInTransaction)(
        tx,
        userRef,
        idempotencyKey,
        SANCTUARY_INIT_ACTION,
        response,
      );
      return { response, captureEmailVerified: false };
    }
    const profileEmail = email ?? authUser.email ?? existing?.email ?? "";
    const captureEmailVerified =
      authUser.emailVerified && existing?.authFunnel?.emailVerifiedBackendSent !== true;
    tx.set(
      userRef,
      {
        ...defaultUserDoc_1.DEFAULT_USER_DOC,
        email: profileEmail,
        authFunnel: {
          ...(existing?.authFunnel ?? {}),
          emailVerified: true,
          emailVerifiedBackendSent: true,
          verifiedAt: firestore_1.FieldValue.serverTimestamp(),
          sanctuaryInitialized: true,
          initializedAt: firestore_1.FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );
    const wellSnap = await tx.get(wellRef);
    if (!wellSnap.exists) {
      tx.set(wellRef, types_1.DEFAULT_USER_WELL_STATE);
    }
    const response = {
      status: "success",
      sanctuaryInitialized: true,
    };
    (0, resolveCallableIdempotency_1.writeIdempotencyInTransaction)(
      tx,
      userRef,
      idempotencyKey,
      SANCTUARY_INIT_ACTION,
      response,
    );
    return { response, captureEmailVerified };
  });
  if (txResult.captureEmailVerified) {
    await (0, posthogServer_1.captureEmailVerifiedBackend)({
      uid,
      provider: authUser.providerData[0]?.providerId ?? "password",
      hoursSinceCreation: hoursSinceCreation(authUser.metadata.creationTime),
    });
  }
  return txResult.response;
}
