"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purgeExpiredAccountDeletions =
  exports.requestAccountDeletionByEmail =
  exports.confirmAccountDeletionWeb =
  exports.getAccountDeletionStatus =
  exports.cancelAccountDeletion =
  exports.requestAccountDeletion =
    void 0;
const https_1 = require("firebase-functions/v2/https");
const accountDeletionCallables_1 = require("./accountDeletionCallables");
exports.requestAccountDeletion = (0, https_1.onCall)(async (request) => {
  const rawRequestId = request.data?.requestId;
  if (typeof rawRequestId !== "string" || rawRequestId.trim() === "") {
    throw new https_1.HttpsError("invalid-argument", "requestId is required");
  }
  return (0, accountDeletionCallables_1.requestAccountDeletionCallable)(
    request.auth?.uid,
    rawRequestId.trim(),
  );
});
exports.cancelAccountDeletion = (0, https_1.onCall)(async (request) => {
  return (0, accountDeletionCallables_1.cancelAccountDeletionCallable)(request.auth?.uid);
});
exports.getAccountDeletionStatus = (0, https_1.onCall)(async (request) => {
  return (0, accountDeletionCallables_1.getAccountDeletionStatusCallable)(request.auth?.uid);
});
exports.confirmAccountDeletionWeb = (0, https_1.onCall)(async (request) => {
  const data = request.data ?? {};
  const uid = typeof data.uid === "string" ? data.uid : "";
  const token = typeof data.token === "string" ? data.token : "";
  const requestId = typeof data.requestId === "string" ? data.requestId : "";
  return (0, accountDeletionCallables_1.confirmAccountDeletionWebCallable)({
    uid,
    token,
    requestId,
  });
});
exports.requestAccountDeletionByEmail = (0, https_1.onCall)(async (request) => {
  const email = typeof request.data?.email === "string" ? request.data.email : "";
  const forwarded = request.rawRequest?.headers?.["x-forwarded-for"];
  const clientIp =
    typeof forwarded === "string"
      ? forwarded.split(",")[0]?.trim() || null
      : Array.isArray(forwarded)
        ? String(forwarded[0] ?? "").trim() || null
        : request.rawRequest?.ip || null;
  return (0, accountDeletionCallables_1.requestAccountDeletionByEmailCallable)(email, { clientIp });
});
var purgeExpiredAccountDeletions_1 = require("./purgeExpiredAccountDeletions");
Object.defineProperty(exports, "purgeExpiredAccountDeletions", {
  enumerable: true,
  get: function () {
    return purgeExpiredAccountDeletions_1.purgeExpiredAccountDeletions;
  },
});
