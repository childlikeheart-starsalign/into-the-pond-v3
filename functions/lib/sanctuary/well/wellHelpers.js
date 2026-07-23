"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUid = requireUid;
exports.parseLocalDate = parseLocalDate;
exports.wellStateRef = wellStateRef;
exports.childAtlasCollectionRef = childAtlasCollectionRef;
exports.childDocRef = childDocRef;
exports.userRef = userRef;
exports.parseOptionalChildId = parseOptionalChildId;
exports.resolveBirthDateForWell = resolveBirthDateForWell;
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
function wellStateRef(uid, childId) {
  if (childId) {
    return init_1.db.doc(`users/${uid}/children/${childId}/wellState/current`);
  }
  return init_1.db.doc(`users/${uid}/wellState/current`);
}
function childAtlasCollectionRef(uid, childId) {
  if (childId) {
    return init_1.db.collection(`users/${uid}/children/${childId}/childAtlas`);
  }
  return init_1.db.collection(`users/${uid}/childAtlas`);
}
function childDocRef(uid, childId) {
  return init_1.db.doc(`users/${uid}/children/${childId}`);
}
function userRef(uid) {
  return init_1.db.doc(`users/${uid}`);
}
/** Optional childId from callable payload — never invents one. */
function parseOptionalChildId(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
/**
 * Dual-read birth date: prefer children/{childId}.dob when present, else legacy root.
 * Economy paths are untouched.
 */
async function resolveBirthDateForWell(tx, uid, childId) {
  if (childId) {
    const childSnap = await tx.get(childDocRef(uid, childId));
    const dob = childSnap.data()?.dob;
    if (typeof dob === "string" && dob.trim()) return dob.trim();
  }
  const userSnap = await tx.get(userRef(uid));
  const legacy = userSnap.data()?.childBirthDate;
  return typeof legacy === "string" && legacy.trim() ? legacy.trim() : null;
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
