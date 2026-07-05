import { onCall, HttpsError } from "firebase-functions/v2/https";

import {
  cancelAccountDeletionCallable,
  confirmAccountDeletionWebCallable,
  getAccountDeletionStatusCallable,
  requestAccountDeletionByEmailCallable,
  requestAccountDeletionCallable,
} from "./accountDeletionCallables";

export const requestAccountDeletion = onCall(async (request) => {
  const rawRequestId = request.data?.requestId;
  if (typeof rawRequestId !== "string" || rawRequestId.trim() === "") {
    throw new HttpsError("invalid-argument", "requestId is required");
  }
  return requestAccountDeletionCallable(request.auth?.uid, rawRequestId.trim());
});

export const cancelAccountDeletion = onCall(async (request) => {
  return cancelAccountDeletionCallable(request.auth?.uid);
});

export const getAccountDeletionStatus = onCall(async (request) => {
  return getAccountDeletionStatusCallable(request.auth?.uid);
});

export const confirmAccountDeletionWeb = onCall(async (request) => {
  const data = request.data ?? {};
  const uid = typeof data.uid === "string" ? data.uid : "";
  const token = typeof data.token === "string" ? data.token : "";
  const requestId = typeof data.requestId === "string" ? data.requestId : "";
  return confirmAccountDeletionWebCallable({ uid, token, requestId });
});

export const requestAccountDeletionByEmail = onCall(async (request) => {
  const email = typeof request.data?.email === "string" ? request.data.email : "";
  return requestAccountDeletionByEmailCallable(email);
});

export { purgeExpiredAccountDeletions } from "./purgeExpiredAccountDeletions";
