import { onCall, HttpsError } from "firebase-functions/v2/https";

import { assertEconomyAdminOrThrow } from "./assertEconomyAdmin";
import { reconcileUser } from "./reconcileUser";

export type AdminReconcileUserPayload = {
  uid: string;
};

export const adminReconcileUserCallable = onCall(async (request) => {
  assertEconomyAdminOrThrow(request.auth?.uid, request.auth?.token as Record<string, unknown>);

  const { uid } = (request.data ?? {}) as AdminReconcileUserPayload;
  if (!uid?.trim()) {
    throw new HttpsError("invalid-argument", "uid is required");
  }

  try {
    return await reconcileUser(uid.trim());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reconciliation failed";
    throw new HttpsError("not-found", message);
  }
});
