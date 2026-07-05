"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertEconomyAdminOrThrow = assertEconomyAdminOrThrow;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
function parseAdminUids() {
  const fromEnv = process.env.ECONOMY_ADMIN_UIDS ?? "";
  const fromConfig = (0, firebase_functions_1.config)().economy?.admin_uids ?? "";
  const combined = `${fromEnv},${fromConfig}`;
  return new Set(
    combined
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}
/** Admin-only economy corrections (compensation entries). */
function assertEconomyAdminOrThrow(uid, token) {
  if (!uid) {
    throw new https_1.HttpsError("unauthenticated", "Authentication required");
  }
  if (token?.economyAdmin === true) {
    return;
  }
  const allowlist = parseAdminUids();
  if (allowlist.has(uid)) {
    return;
  }
  throw new https_1.HttpsError("permission-denied", "Economy admin access required");
}
