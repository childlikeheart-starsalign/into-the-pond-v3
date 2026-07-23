"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEnsureWellState = handleEnsureWellState;
exports.ensureWellStateCallable = ensureWellStateCallable;
const types_1 = require("./types");
const wellHelpers_1 = require("./wellHelpers");
async function handleEnsureWellState(uid, childId) {
  const ref = (0, wellHelpers_1.wellStateRef)(uid, childId);
  const snap = await ref.get();
  if (snap.exists) {
    return { success: true, alreadyExisted: true };
  }
  await ref.set(types_1.DEFAULT_USER_WELL_STATE);
  await (0, wellHelpers_1.recordWellAnalytics)(uid, { type: "well_state_initialized" });
  return { success: true, alreadyExisted: false };
}
function ensureWellStateCallable(authUid, data) {
  const uid = (0, wellHelpers_1.requireUid)(authUid);
  return handleEnsureWellState(uid, (0, wellHelpers_1.parseOptionalChildId)(data?.childId));
}
