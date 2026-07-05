"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUid = requireUid;
exports.parseLocalDate = parseLocalDate;
exports.wellStateRef = wellStateRef;
exports.userRef = userRef;
exports.recordWellAnalytics = recordWellAnalytics;
exports.logStaleAgeBandSubmission = logStaleAgeBandSubmission;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const init_1 = require("../../init");
const catalog_1 = require("./catalog");
const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function requireUid(authUid) {
  if (!authUid) throw new https_1.HttpsError("unauthenticated", "Authentication required");
  return authUid;
}
function parseLocalDate(localDate) {
  if (typeof localDate !== "string") return null;
  const trimmed = localDate.trim();
  if (!LOCAL_DATE_RE.test(trimmed)) return null;
  return trimmed;
}
function wellStateRef(uid) {
  return init_1.db.doc(`users/${uid}/wellState/current`);
}
function userRef(uid) {
  return init_1.db.doc(`users/${uid}`);
}
async function recordWellAnalytics(uid, event) {
  await userRef(uid)
    .collection("sanctuaryAnalytics")
    .add({
      ...event,
      userId: uid,
      channel: "well",
      timestamp: Date.now(),
      recordedAt: firestore_1.Timestamp.now(),
    });
}
function logStaleAgeBandSubmission(uid, questionId, expectedBand) {
  const question = catalog_1.WELL_QUESTION_BY_ID[questionId];
  void recordWellAnalytics(uid, {
    type: "well_stale_age_band_submission",
    questionId,
    expectedBand,
    actualBand: question?.ageBand,
  });
}
