"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchActiveChildCallable = switchActiveChildCallable;
const https_1 = require("firebase-functions/v2/https");
const childrenSummary_1 = require("../childProfile/childrenSummary");
const tierAccess_1 = require("../childProfile/tierAccess");
const archetypeQuickCheck_1 = require("../childProfile/archetypeQuickCheck");
const init_1 = require("../init");
function displayNameFromChild(data) {
  if (typeof data.displayArchetypeName === "string" && data.displayArchetypeName.trim()) {
    return data.displayArchetypeName;
  }
  if ((0, archetypeQuickCheck_1.isQuickCheckArchetype)(data.archetype)) {
    return (0, archetypeQuickCheck_1.resolveDisplayArchetypeName)({
      primaryArchetype: data.archetype,
      tieOccurred: false,
      tiedArchetypes: [],
    });
  }
  return null;
}
function entryFromChildDoc(childId, data, previous) {
  if (
    typeof data.name !== "string" ||
    !(0, tierAccess_1.isChildCompanionId)(data.companionId) ||
    typeof data.childOrder !== "number"
  ) {
    return null;
  }
  return (0, childrenSummary_1.buildChildrenSummaryEntry)({
    childId,
    name: data.name,
    companionId: data.companionId,
    childOrder: data.childOrder,
    displayArchetypeName: displayNameFromChild(data),
    dob: typeof data.dob === "string" ? data.dob : null,
    lastVisitedAt: previous?.lastVisitedAt ?? null,
    recentDeepChecks: Array.isArray(data.recentDeepChecks)
      ? data.recentDeepChecks
      : (previous?.recentDeepChecks ?? null),
  });
}
/**
 * Sets activeChildId and stamps lastVisitedAt on the selected summary entry.
 * Rebuilds childrenSummary from children docs so older accounts gain identity fields.
 */
async function switchActiveChildCallable(uid, raw) {
  const childId = typeof raw.childId === "string" ? raw.childId.trim() : "";
  if (!childId) {
    throw new https_1.HttpsError("invalid-argument", "childId is required");
  }
  const userRef = init_1.db.collection("users").doc(uid);
  const childrenCol = userRef.collection("children");
  return init_1.db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new https_1.HttpsError("failed-precondition", "User profile missing");
    }
    const userData = userSnap.data();
    const tier = (0, tierAccess_1.resolveAccountTier)(userData.subscription);
    const previousSummary = Array.isArray(userData.childrenSummary) ? userData.childrenSummary : [];
    const previousById = new Map(previousSummary.map((e) => [e.childId, e]));
    const childRef = childrenCol.doc(childId);
    const childSnap = await tx.get(childRef);
    if (!childSnap.exists) {
      throw new https_1.HttpsError("not-found", "Child profile not found");
    }
    const childData = childSnap.data();
    if (
      typeof childData.childOrder !== "number" ||
      !(0, tierAccess_1.canAccessChild)(childData.childOrder, tier)
    ) {
      throw new https_1.HttpsError("permission-denied", "Child is not accessible on this path");
    }
    const childrenSnap = await tx.get(childrenCol);
    const rebuilt = [];
    for (const docSnap of childrenSnap.docs) {
      const entry = entryFromChildDoc(docSnap.id, docSnap.data(), previousById.get(docSnap.id));
      if (entry) rebuilt.push(entry);
    }
    rebuilt.sort((a, b) => a.childOrder - b.childOrder);
    if (!rebuilt.some((e) => e.childId === childId)) {
      throw new https_1.HttpsError("failed-precondition", "Child missing from summary rebuild");
    }
    const atIso = new Date().toISOString();
    const childrenSummary = (0, childrenSummary_1.stampLastVisited)(rebuilt, childId, atIso);
    tx.set(
      userRef,
      {
        activeChildId: childId,
        childrenSummary,
      },
      { merge: true },
    );
    return {
      status: "ok",
      activeChildId: childId,
      childrenSummary,
    };
  });
}
