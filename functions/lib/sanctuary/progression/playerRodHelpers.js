"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerRodsCollection = playerRodsCollection;
exports.playerRodRef = playerRodRef;
exports.subscriptionCraftTierFromUser = subscriptionCraftTierFromUser;
exports.lessonProgressFromUserDoc = lessonProgressFromUserDoc;
exports.loadLessonProgress = loadLessonProgress;
exports.playerRodDocToRecord = playerRodDocToRecord;
exports.playerRodRecordToDoc = playerRodRecordToDoc;
exports.loadPlayerRodRecords = loadPlayerRodRecords;
exports.ensureProgressionPlayerRodDocs = ensureProgressionPlayerRodDocs;
exports.ensurePhase1PlayerRodDocs = ensurePhase1PlayerRodDocs;
exports.buildUserProgressionContext = buildUserProgressionContext;
exports.reconcilePlayerRodsForUser = reconcilePlayerRodsForUser;
exports.assertCraftableRod = assertCraftableRod;
exports.assertPhase1CraftableRod = assertPhase1CraftableRod;
exports.recordRodAnalytics = recordRodAnalytics;
const firestore_1 = require("firebase-admin/firestore");
const init_1 = require("../../init");
const craftCosts_1 = require("./craftCosts");
const emitAnalytics_1 = require("./emitAnalytics");
const evaluateCraftable_1 = require("./evaluateCraftable");
const moduleRodMap_1 = require("./moduleRodMap");
function playerRodsCollection(uid) {
  return init_1.db.collection("users").doc(uid).collection("playerRods");
}
function playerRodRef(uid, rodId) {
  return playerRodsCollection(uid).doc(rodId);
}
function subscriptionCraftTierFromUser(data) {
  if (data.subscription?.isLifetime) return "lifetime";
  const status = data.subscription?.subscriptionStatus ?? "free";
  if (status === "free" || status === "wooden" || status === "fiberglass") {
    return status;
  }
  return "free";
}
function lessonProgressFromUserDoc(data) {
  return (0, evaluateCraftable_1.lessonProgressFromCompletedMap)(data.completedLessons ?? {});
}
async function loadLessonProgress(uid, userData) {
  const snapshot = await init_1.db.collection("users").doc(uid).collection("lessonProgress").get();
  if (snapshot.empty) {
    return lessonProgressFromUserDoc(userData);
  }
  const progress = {};
  for (const doc of snapshot.docs) {
    const data = doc.data();
    progress[doc.id] = {
      lessonId: doc.id,
      completed: data.completed === true,
      completedAt: data.completedAt?.toMillis() ?? null,
      lastOpenedAt: data.lastOpenedAt?.toMillis() ?? null,
    };
  }
  return progress;
}
function defaultPlayerRodRecord(rodId) {
  return {
    rodId,
    state: "locked",
    craftStartedAt: null,
    craftCompletedAt: null,
    wonderInvested: 0,
    partsSpentOnCraft: 0,
    sourceModule: (0, moduleRodMap_1.moduleIdForRareRod)(rodId),
    giftSource: null,
  };
}
function playerRodDocToRecord(rodId, doc) {
  if (!doc) return defaultPlayerRodRecord(rodId);
  return {
    rodId,
    state: doc.state,
    craftStartedAt: doc.craftStartedAt?.toMillis() ?? null,
    craftCompletedAt: doc.craftCompletedAt?.toMillis() ?? null,
    wonderInvested: doc.wonderInvested ?? 0,
    partsSpentOnCraft: doc.partsSpentOnCraft ?? 0,
    sourceModule: doc.sourceModule ?? (0, moduleRodMap_1.moduleIdForRareRod)(rodId),
    giftSource: doc.giftSource ?? null,
  };
}
function playerRodRecordToDoc(record) {
  return {
    state: record.state,
    craftStartedAt:
      record.craftStartedAt != null
        ? firestore_1.Timestamp.fromMillis(record.craftStartedAt)
        : null,
    craftCompletedAt:
      record.craftCompletedAt != null
        ? firestore_1.Timestamp.fromMillis(record.craftCompletedAt)
        : null,
    wonderInvested: record.wonderInvested,
    partsSpentOnCraft: record.partsSpentOnCraft,
    sourceModule: record.sourceModule,
    giftSource: record.giftSource ?? null,
  };
}
async function loadPlayerRodRecords(uid) {
  const snapshot = await playerRodsCollection(uid).get();
  const records = {};
  for (const doc of snapshot.docs) {
    const rodId = doc.id;
    records[rodId] = playerRodDocToRecord(rodId, doc.data());
  }
  return records;
}
async function ensureProgressionPlayerRodDocs(uid) {
  const allRodIds = [
    ...moduleRodMap_1.RARE_ELEMENT_ROD_IDS,
    moduleRodMap_1.WILDCARD_ROD_ID,
    ...moduleRodMap_1.EPIC_ELEMENT_ROD_IDS,
  ];
  const batch = init_1.db.batch();
  let writes = 0;
  for (const rodId of allRodIds) {
    const ref = playerRodRef(uid, rodId);
    const snap = await ref.get();
    if (snap.exists) continue;
    batch.set(ref, playerRodRecordToDoc(defaultPlayerRodRecord(rodId)));
    writes += 1;
  }
  if (writes > 0) {
    await batch.commit();
  }
}
/** @deprecated Use ensureProgressionPlayerRodDocs */
async function ensurePhase1PlayerRodDocs(uid) {
  await ensureProgressionPlayerRodDocs(uid);
}
function buildUserProgressionContext(userData, lessonProgress) {
  const inventory = userData.inventory ?? {};
  return {
    parts: inventory.parts ?? 0,
    storedWonder: userData.storedWonder ?? userData.totalWonder ?? 0,
    subscriptionTier: subscriptionCraftTierFromUser(userData),
    lessonProgress,
  };
}
async function reconcilePlayerRodsForUser(uid, options) {
  const persist = options?.persist !== false;
  const userRef = init_1.db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data() ?? {};
  await ensureProgressionPlayerRodDocs(uid);
  const lessonProgress = await loadLessonProgress(uid, userData);
  const playerRods = await loadPlayerRodRecords(uid);
  const context = buildUserProgressionContext(userData, lessonProgress);
  const evaluateResult = (0, evaluateCraftable_1.evaluateCraftableStates)({
    lessonProgress,
    playerRods,
    subscriptionTier: context.subscriptionTier,
    inventory: {
      parts: context.parts,
      storedWonder: context.storedWonder,
    },
  });
  const merged = (0, evaluateCraftable_1.mergeEvaluateResult)(playerRods, evaluateResult);
  if (persist && evaluateResult.transitions.length > 0) {
    const batch = init_1.db.batch();
    for (const transition of evaluateResult.transitions) {
      const record = merged[transition.rodId];
      if (!record) continue;
      batch.set(playerRodRef(uid, transition.rodId), playerRodRecordToDoc(record), { merge: true });
    }
    await batch.commit();
  }
  return { playerRods: merged, evaluateResult };
}
function assertCraftableRod(rodId) {
  if (rodId === moduleRodMap_1.WILDCARD_ROD_ID || rodId === "basic") {
    throw new Error(`Rod ${rodId} cannot be crafted via startCraft`);
  }
  if (!craftCosts_1.CRAFTABLE_ROD_IDS.includes(rodId)) {
    throw new Error(`Rod ${rodId} is not craftable`);
  }
}
/** @deprecated Use assertCraftableRod */
function assertPhase1CraftableRod(rodId) {
  assertCraftableRod(rodId);
}
async function recordRodAnalytics(uid, event) {
  await (0, emitAnalytics_1.emitAnalytics)(uid, event);
}
