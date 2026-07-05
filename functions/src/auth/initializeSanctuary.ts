import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import { db } from "../init";
import { captureEmailVerifiedBackend } from "../analytics/posthogServer";
import { DEFAULT_USER_WELL_STATE } from "../sanctuary/well/types";
import {
  readIdempotencyInTransaction,
  writeIdempotencyInTransaction,
} from "../sanctuary/economy/resolveCallableIdempotency";
import type { EconomyActionType } from "../sanctuary/economy/types";
import {
  DEFAULT_USER_DOC,
  sanctuaryInitKey,
  type InitializeSanctuaryResponse,
} from "./defaultUserDoc";

const SANCTUARY_INIT_ACTION = "compensation" as EconomyActionType;

function hoursSinceCreation(iso: string | undefined): number {
  if (!iso) return 0;
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(0, (Date.now() - created) / (1000 * 60 * 60));
}

export async function initializeSanctuaryCallable(
  authUid: string | undefined,
  requestId: string,
  email: string | null | undefined,
): Promise<InitializeSanctuaryResponse> {
  if (!authUid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
  if (!requestId.trim()) {
    throw new HttpsError("invalid-argument", "requestId is required");
  }

  const authUser = await getAuth().getUser(authUid);
  if (!authUser.emailVerified) {
    throw new HttpsError("failed-precondition", "Email must be verified before sanctuary init");
  }

  const uid = authUid;
  const userRef = db.collection("users").doc(uid);
  const wellRef = userRef.collection("wellState").doc("current");
  const idempotencyKey = sanctuaryInitKey(requestId.trim());

  const txResult = await db.runTransaction(async (tx) => {
    const idemRead = await readIdempotencyInTransaction<InitializeSanctuaryResponse>(
      tx,
      userRef,
      idempotencyKey,
    );
    if (idemRead.hit) {
      return { response: idemRead.response, captureEmailVerified: false };
    }

    const userSnap = await tx.get(userRef);
    const existing = userSnap.data() as
      | {
          authFunnel?: {
            sanctuaryInitialized?: boolean;
            emailVerifiedBackendSent?: boolean;
            provider?: string;
          };
          email?: string;
        }
      | undefined;

    if (existing?.authFunnel?.sanctuaryInitialized === true) {
      const response: InitializeSanctuaryResponse = {
        status: "already_initialized",
        sanctuaryInitialized: true,
      };
      writeIdempotencyInTransaction(tx, userRef, idempotencyKey, SANCTUARY_INIT_ACTION, response);
      return { response, captureEmailVerified: false };
    }

    const profileEmail = email ?? authUser.email ?? existing?.email ?? "";
    const captureEmailVerified =
      authUser.emailVerified && existing?.authFunnel?.emailVerifiedBackendSent !== true;

    tx.set(
      userRef,
      {
        ...DEFAULT_USER_DOC,
        email: profileEmail,
        authFunnel: {
          ...(existing?.authFunnel ?? {}),
          emailVerified: true,
          emailVerifiedBackendSent: true,
          verifiedAt: FieldValue.serverTimestamp(),
          sanctuaryInitialized: true,
          initializedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );

    const wellSnap = await tx.get(wellRef);
    if (!wellSnap.exists) {
      tx.set(wellRef, DEFAULT_USER_WELL_STATE);
    }

    const response: InitializeSanctuaryResponse = {
      status: "success",
      sanctuaryInitialized: true,
    };

    writeIdempotencyInTransaction(tx, userRef, idempotencyKey, SANCTUARY_INIT_ACTION, response);

    return { response, captureEmailVerified };
  });

  if (txResult.captureEmailVerified) {
    await captureEmailVerifiedBackend({
      uid,
      provider: authUser.providerData[0]?.providerId ?? "password",
      hoursSinceCreation: hoursSinceCreation(authUser.metadata.creationTime),
    });
  }

  return txResult.response;
}
