"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminReconcileUserCallable = void 0;
const https_1 = require("firebase-functions/v2/https");
const assertEconomyAdmin_1 = require("./assertEconomyAdmin");
const reconcileUser_1 = require("./reconcileUser");
exports.adminReconcileUserCallable = (0, https_1.onCall)(async (request) => {
  (0, assertEconomyAdmin_1.assertEconomyAdminOrThrow)(request.auth?.uid, request.auth?.token);
  const { uid } = request.data ?? {};
  if (!uid?.trim()) {
    throw new https_1.HttpsError("invalid-argument", "uid is required");
  }
  try {
    return await (0, reconcileUser_1.reconcileUser)(uid.trim());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reconciliation failed";
    throw new https_1.HttpsError("not-found", message);
  }
});
