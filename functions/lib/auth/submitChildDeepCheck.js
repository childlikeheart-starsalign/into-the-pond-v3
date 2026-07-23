"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitChildDeepCheckCallable = submitChildDeepCheckCallable;
exports.validateAndScoreDeepCheckAnswers = validateAndScoreDeepCheckAnswers;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const archetypeDeepCheck_1 = require("../childProfile/archetypeDeepCheck");
const computeAgeBand_1 = require("../sanctuary/well/computeAgeBand");
const init_1 = require("../init");
function parseDeepCheckAnswers(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new https_1.HttpsError("invalid-argument", "deepCheckAnswers must be a non-empty array");
  }
  if (raw.length !== archetypeDeepCheck_1.DEEP_CHECK_SCENARIO_COUNT) {
    throw new https_1.HttpsError(
      "invalid-argument",
      `deepCheckAnswers must contain exactly ${archetypeDeepCheck_1.DEEP_CHECK_SCENARIO_COUNT} pairs`,
    );
  }
  const answers = [];
  for (const item of raw) {
    if (!(0, archetypeDeepCheck_1.isDeepCheckAxisPair)(item)) {
      throw new https_1.HttpsError("invalid-argument", "deepCheckAnswers contains an invalid pair");
    }
    answers.push({
      expression: item.expression,
      driver: item.driver,
    });
  }
  return answers;
}
/**
 * Persist a Deep Check for an existing sealed child.
 * Updates archetype fields, rebuilds shared map trail (max 5 QC+DC), appends archetypeChecks.
 * Prunes older deep check docs after the transaction.
 */
async function submitChildDeepCheckCallable(uid, raw) {
  const childId = typeof raw.childId === "string" ? raw.childId.trim() : "";
  if (!childId) {
    throw new https_1.HttpsError("invalid-argument", "childId is required");
  }
  const answers = parseDeepCheckAnswers(raw.deepCheckAnswers);
  const scored = (0, archetypeDeepCheck_1.scoreDeepCheck)(answers);
  const completedAt = new Date().toISOString();
  const newestPoint = {
    axisA: scored.axisA,
    axisB: scored.axisB,
    completedAt,
    source: "deep",
  };
  const userRef = init_1.db.collection("users").doc(uid);
  const childRef = userRef.collection("children").doc(childId);
  const result = await init_1.db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new https_1.HttpsError("failed-precondition", "User profile missing");
    }
    const childSnap = await tx.get(childRef);
    if (!childSnap.exists) {
      throw new https_1.HttpsError("not-found", "Child profile not found");
    }
    const childData = childSnap.data();
    const dob = typeof childData.dob === "string" ? childData.dob.trim() : "";
    const birthDate = (0, computeAgeBand_1.parseBirthDate)(dob);
    if (!birthDate) {
      throw new https_1.HttpsError(
        "failed-precondition",
        "Child dob missing or invalid for age band",
      );
    }
    const ageBandAtCheck = (0, computeAgeBand_1.computeAgeBand)(birthDate);
    const checksQuery = childRef
      .collection("archetypeChecks")
      .orderBy("createdAt", "desc")
      .limit(archetypeDeepCheck_1.MAP_CHECK_HISTORY_CAP * 4);
    const checksSnap = await tx.get(checksQuery);
    const existingChecksNewestFirst = checksSnap.docs.map((d) => d.data());
    const recentDeepChecks = (0, archetypeDeepCheck_1.rebuildRecentMapChecks)({
      existingChecksNewestFirst,
      newest: newestPoint,
    });
    tx.update(childRef, {
      archetype: scored.primaryArchetype,
      displayArchetypeName: scored.displayArchetypeName,
      tieOccurred: false,
      tiedArchetypes: [],
      hasSeenArchetypeDisclaimer: true,
      recentDeepChecks,
      lastDeepCheckAt: completedAt,
    });
    const userData = userSnap.data();
    const summary = Array.isArray(userData.childrenSummary) ? [...userData.childrenSummary] : [];
    const idx = summary.findIndex((entry) => entry.childId === childId);
    if (idx >= 0) {
      summary[idx] = {
        ...summary[idx],
        displayArchetypeName: scored.displayArchetypeName,
        recentDeepChecks,
      };
      tx.set(userRef, { childrenSummary: summary }, { merge: true });
    }
    const checkRef = childRef.collection("archetypeChecks").doc();
    tx.set(checkRef, {
      type: "deep",
      createdAt: firestore_1.Timestamp.now(),
      deepCheckAnswers: answers,
      axisA: scored.axisA,
      axisB: scored.axisB,
      primaryArchetype: scored.primaryArchetype,
      displayArchetypeName: scored.displayArchetypeName,
      ageBandAtCheck,
    });
    return {
      status: "ok",
      childId,
      axisA: scored.axisA,
      axisB: scored.axisB,
      primaryArchetype: scored.primaryArchetype,
      displayArchetypeName: scored.displayArchetypeName,
      ageBandAtCheck,
      recentDeepChecks,
    };
  });
  // Prune deep check docs beyond the retention cap (outside transaction).
  try {
    const deepSnap = await childRef
      .collection("archetypeChecks")
      .where("type", "==", "deep")
      .orderBy("createdAt", "desc")
      .get();
    const overflow = deepSnap.docs.slice(archetypeDeepCheck_1.DEEP_CHECK_HISTORY_CAP);
    if (overflow.length > 0) {
      const batch = init_1.db.batch();
      for (const doc of overflow) {
        batch.delete(doc.ref);
      }
      await batch.commit();
    }
  } catch {
    // Index may be missing in some envs; denormalized recentDeepChecks still caps at 5.
  }
  return result;
}
/** Pure parse + score for unit tests (no Firestore). */
function validateAndScoreDeepCheckAnswers(raw) {
  const answers = parseDeepCheckAnswers(raw);
  return { answers, scored: (0, archetypeDeepCheck_1.scoreDeepCheck)(answers) };
}
