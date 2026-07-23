"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHILD_LIMIT_REACHED = void 0;
exports.createChildProfileCallable = createChildProfileCallable;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const childrenSummary_1 = require("../childProfile/childrenSummary");
const tierAccess_1 = require("../childProfile/tierAccess");
const archetypeQuickCheck_1 = require("../childProfile/archetypeQuickCheck");
const computeAgeBand_1 = require("../sanctuary/well/computeAgeBand");
const init_1 = require("../init");
const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NAME_LEN = 48;
/** Distinct from idempotent draft replay — client must NOT treat as success. */
exports.CHILD_LIMIT_REACHED = "CHILD_LIMIT_REACHED";
function validateDob(dob) {
  if (!DOB_RE.test(dob)) {
    throw new https_1.HttpsError("invalid-argument", "dob must be YYYY-MM-DD");
  }
  const parsed = new Date(`${dob}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new https_1.HttpsError("invalid-argument", "dob is not a valid date");
  }
  const [y, m, d] = dob.split("-").map(Number);
  if (
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() + 1 !== m ||
    parsed.getUTCDate() !== d
  ) {
    throw new https_1.HttpsError("invalid-argument", "dob is not a valid calendar date");
  }
  const now = new Date();
  if (parsed.getTime() > Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) {
    throw new https_1.HttpsError("invalid-argument", "dob cannot be in the future");
  }
  return dob;
}
function validateName(name) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new https_1.HttpsError("invalid-argument", "name is required");
  }
  if (trimmed.length > MAX_NAME_LEN) {
    throw new https_1.HttpsError("invalid-argument", `name must be ≤ ${MAX_NAME_LEN} characters`);
  }
  return trimmed;
}
function parseQuickCheckTally(raw, options) {
  if (raw == null) return null;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new https_1.HttpsError("invalid-argument", "quickCheckTally must be a non-empty array");
  }
  const requiredLength = options?.requiredLength;
  if (requiredLength != null && raw.length !== requiredLength) {
    throw new https_1.HttpsError(
      "invalid-argument",
      `quickCheckTally must contain exactly ${requiredLength} answers`,
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
function successFromChild(childId, data) {
  if (
    typeof data.name !== "string" ||
    typeof data.dob !== "string" ||
    !(0, tierAccess_1.isChildCompanionId)(data.companionId) ||
    typeof data.childOrder !== "number"
  ) {
    throw new https_1.HttpsError("internal", "Sealed child document is malformed");
  }
  return {
    status: "ok",
    childId,
    childOrder: data.childOrder,
    name: data.name,
    dob: data.dob,
    companionId: data.companionId,
    interests: (0, tierAccess_1.filterAllowedInterests)(data.interests ?? []),
    profileLocked: true,
    ...((0, archetypeQuickCheck_1.isQuickCheckArchetype)(data.archetype)
      ? {
          primaryArchetype: data.archetype,
          displayArchetypeName: data.displayArchetypeName ?? undefined,
        }
      : {}),
  };
}
/**
 * Atomic sealed create/append for users/{uid}/children/{childId}.
 * When onboardingComplete is true, also writes archetypeChecks + prologue flags
 * in the same transaction.
 */
async function createChildProfileCallable(uid, raw) {
  const draftId = typeof raw.draftId === "string" ? raw.draftId.trim() : "";
  if (!draftId) {
    throw new https_1.HttpsError("invalid-argument", "draftId is required");
  }
  const name = validateName(typeof raw.name === "string" ? raw.name : "");
  const dob = validateDob(typeof raw.dob === "string" ? raw.dob.trim() : "");
  if (!(0, tierAccess_1.isChildCompanionId)(raw.companionId)) {
    throw new https_1.HttpsError("invalid-argument", "companionId is invalid");
  }
  const companionId = raw.companionId;
  const interests = (0, tierAccess_1.filterAllowedInterests)(raw.interests);
  const onboardingComplete = raw.onboardingComplete === true;
  const tally = parseQuickCheckTally(raw.quickCheckTally, {
    requiredLength: onboardingComplete ? archetypeQuickCheck_1.QUICK_CHECK_ANSWER_COUNT : undefined,
  });
  let scored = null;
  let ageBandAtCheck = null;
  if (onboardingComplete) {
    if (!tally) {
      throw new https_1.HttpsError(
        "invalid-argument",
        "quickCheckTally is required when onboardingComplete is true",
      );
    }
    scored = (0, archetypeQuickCheck_1.scoreQuickCheckTally)(tally);
    if (raw.archetype != null && raw.archetype !== scored.primaryArchetype) {
      // Client hint is advisory only — server tally wins for branching truth.
      firebase_functions_1.logger.info(
        "createChildProfile archetype hint ignored in favor of tally",
        {
          uid,
          hint: raw.archetype,
          primary: scored.primaryArchetype,
        },
      );
    }
    const birthDate = (0, computeAgeBand_1.parseBirthDate)(dob);
    if (!birthDate) {
      throw new https_1.HttpsError(
        "invalid-argument",
        "dob could not be parsed for ageBandAtCheck",
      );
    }
    ageBandAtCheck = (0, computeAgeBand_1.computeAgeBand)(birthDate);
  } else if (
    raw.archetype != null &&
    !(0, archetypeQuickCheck_1.isQuickCheckArchetype)(raw.archetype)
  ) {
    throw new https_1.HttpsError("invalid-argument", "archetype is invalid");
  }
  const userRef = init_1.db.collection("users").doc(uid);
  const childrenCol = userRef.collection("children");
  try {
    return await init_1.db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new https_1.HttpsError(
          "failed-precondition",
          "User profile missing — initialize sanctuary first",
        );
      }
      const userData = userSnap.data();
      const childrenSnap = await tx.get(childrenCol);
      const draftMatch = childrenSnap.docs.find((docSnap) => {
        const data = docSnap.data();
        return data.childProfileSealDraftId === draftId;
      });
      if (draftMatch) {
        return successFromChild(draftMatch.id, draftMatch.data());
      }
      const tier = (0, tierAccess_1.resolveAccountTier)(userData.subscription);
      const currentCount = childrenSnap.size;
      const createCheck = (0, tierAccess_1.canCreateNextChild)(currentCount, tier);
      if (!createCheck.ok) {
        throw new https_1.HttpsError("failed-precondition", exports.CHILD_LIMIT_REACHED);
      }
      const childOrder = createCheck.nextOrder;
      const childRef = childrenCol.doc();
      const summary = Array.isArray(userData.childrenSummary) ? [...userData.childrenSummary] : [];
      const visitedAt = new Date().toISOString();
      summary.push(
        (0, childrenSummary_1.buildChildrenSummaryEntry)({
          childId: childRef.id,
          name,
          companionId,
          childOrder,
          displayArchetypeName: scored?.displayArchetypeName ?? null,
          dob,
          lastVisitedAt: visitedAt,
        }),
      );
      summary.sort((a, b) => a.childOrder - b.childOrder);
      const childPayload = {
        name,
        dob,
        companionId,
        interests,
        profileLocked: true,
        childOrder,
        childProfileSealDraftId: draftId,
        createdAt: firestore_1.Timestamp.now(),
        archetype:
          scored?.primaryArchetype ??
          ((0, archetypeQuickCheck_1.isQuickCheckArchetype)(raw.archetype) ? raw.archetype : null),
        hasCompletedDay1Narrative: false,
        narrativeProgress: null,
      };
      if (scored && ageBandAtCheck) {
        childPayload.displayArchetypeName = scored.displayArchetypeName;
        childPayload.tieOccurred = scored.tieOccurred;
        childPayload.tiedArchetypes = scored.tiedArchetypes;
        childPayload.hasSeenArchetypeDisclaimer = true;
      }
      tx.set(childRef, childPayload);
      const rootPatch = {
        activeChildId: childRef.id,
        childrenSummary: summary,
        ...(childOrder === 1 ? { childBirthDate: dob } : {}),
      };
      if (scored && onboardingComplete) {
        rootPatch.childArchetype = scored.primaryArchetype;
        rootPatch.hasCompletedDay1Narrative = true;
        rootPatch.hasCompletedPrologueOnboarding = true;
        if (childOrder === 1) {
          rootPatch.childBirthDate = dob;
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
      }
      tx.set(userRef, rootPatch, { merge: true });
      return {
        status: "ok",
        childId: childRef.id,
        childOrder,
        name,
        dob,
        companionId,
        interests,
        profileLocked: true,
        ...(scored
          ? {
              primaryArchetype: scored.primaryArchetype,
              displayArchetypeName: scored.displayArchetypeName,
              tieOccurred: scored.tieOccurred,
              tiedArchetypes: scored.tiedArchetypes,
              ageBandAtCheck: ageBandAtCheck ?? undefined,
            }
          : {}),
      };
    });
  } catch (err) {
    if (err instanceof https_1.HttpsError) throw err;
    firebase_functions_1.logger.error("createChildProfile failed", {
      uid,
      area: "profile",
      flow: "create_child_profile",
      err,
    });
    throw new https_1.HttpsError("internal", "createChildProfile failed");
  }
}
