"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitChildQuickCheckCallable = submitChildQuickCheckCallable;
exports.validateAndScoreQuickCheckTally = validateAndScoreQuickCheckTally;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const archetypeCaptionBank_1 = require("../childProfile/archetypeCaptionBank");
const archetypeDeepCheck_1 = require("../childProfile/archetypeDeepCheck");
const archetypeQuickCheck_1 = require("../childProfile/archetypeQuickCheck");
const computeAgeBand_1 = require("../sanctuary/well/computeAgeBand");
const init_1 = require("../init");
function parseQuickCheckTally(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new https_1.HttpsError("invalid-argument", "quickCheckTally must be a non-empty array");
  }
  if (raw.length !== archetypeQuickCheck_1.QUICK_CHECK_ANSWER_COUNT) {
    throw new https_1.HttpsError(
      "invalid-argument",
      `quickCheckTally must contain exactly ${archetypeQuickCheck_1.QUICK_CHECK_ANSWER_COUNT} answers`,
    );
  }
  const answers = [];
  for (const item of raw) {
    if (!(0, archetypeQuickCheck_1.isQuickCheckArchetype)(item)) {
      throw new https_1.HttpsError(
        "invalid-argument",
        "quickCheckTally contains an invalid archetype",
      );
    }
    answers.push(item);
  }
  return answers;
}
/**
 * Persist a post-onboarding Quick Check for an existing sealed child.
 * Updates child archetype fields, childrenSummary, shared map trail, and appends archetypeChecks.
 */
async function submitChildQuickCheckCallable(uid, raw) {
  const childId = typeof raw.childId === "string" ? raw.childId.trim() : "";
  if (!childId) {
    throw new https_1.HttpsError("invalid-argument", "childId is required");
  }
  const tally = parseQuickCheckTally(raw.quickCheckTally);
  const scored = (0, archetypeQuickCheck_1.scoreQuickCheckTally)(tally);
  const completedAt = new Date().toISOString();
  const axes = (0, archetypeCaptionBank_1.axesFromDisplayArchetype)(scored.displayArchetypeName);
  const newestPoint = {
    axisA: axes.axisA,
    axisB: axes.axisB,
    completedAt,
    source: "quick",
  };
  const userRef = init_1.db.collection("users").doc(uid);
  const childRef = userRef.collection("children").doc(childId);
  return init_1.db.runTransaction(async (tx) => {
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
      tieOccurred: scored.tieOccurred,
      tiedArchetypes: scored.tiedArchetypes,
      hasSeenArchetypeDisclaimer: true,
      recentDeepChecks,
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
      type: "quick",
      createdAt: firestore_1.Timestamp.now(),
      quickCheckTally: tally,
      primaryArchetype: scored.primaryArchetype,
      tieOccurred: scored.tieOccurred,
      tiedArchetypes: scored.tiedArchetypes,
      displayArchetypeName: scored.displayArchetypeName,
      ageBandAtCheck,
    });
    return {
      status: "ok",
      childId,
      primaryArchetype: scored.primaryArchetype,
      displayArchetypeName: scored.displayArchetypeName,
      tieOccurred: scored.tieOccurred,
      tiedArchetypes: scored.tiedArchetypes,
      ageBandAtCheck,
      recentDeepChecks,
    };
  });
}
/** Pure tally parse + score for unit tests (no Firestore). */
function validateAndScoreQuickCheckTally(raw) {
  const tally = parseQuickCheckTally(raw);
  return { tally, scored: (0, archetypeQuickCheck_1.scoreQuickCheckTally)(tally) };
}
