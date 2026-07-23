"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupAllChildrenSubtrees = backupAllChildrenSubtrees;
exports.deleteAllChildrenSubtrees = deleteAllChildrenSubtrees;
exports.restoreChildrenSubtrees = restoreChildrenSubtrees;
const firebase_functions_1 = require("firebase-functions");
const init_1 = require("../init");
const BATCH_DELETE_LIMIT = 400;
async function deleteCollectionDocs(collectionRef) {
  let deleted = 0;
  for (;;) {
    const snap = await collectionRef.limit(BATCH_DELETE_LIMIT).get();
    if (snap.empty) break;
    const batch = init_1.db.batch();
    for (const docSnap of snap.docs) {
      batch.delete(docSnap.ref);
    }
    await batch.commit();
    deleted += snap.size;
    if (snap.size < BATCH_DELETE_LIMIT) break;
  }
  return deleted;
}
async function readCollectionEntries(collectionRef) {
  const snap = await collectionRef.get();
  return snap.docs.map((d) => ({
    id: d.id,
    data: d.data() ?? {},
  }));
}
/** Snapshot every child doc + nested Well/Atlas for encrypted deletion backup. */
async function backupAllChildrenSubtrees(uid) {
  const childrenSnap = await init_1.db.collection("users").doc(uid).collection("children").get();
  const out = [];
  for (const childDoc of childrenSnap.docs) {
    const childRef = childDoc.ref;
    const wellStateSnap = await childRef.collection("wellState").doc("current").get();
    const wellQuestions = await readCollectionEntries(childRef.collection("wellQuestions"));
    const childAtlas = await readCollectionEntries(childRef.collection("childAtlas"));
    out.push({
      childId: childDoc.id,
      data: childDoc.data() ?? {},
      wellStateCurrent: wellStateSnap.exists ? (wellStateSnap.data() ?? {}) : null,
      wellQuestions,
      childAtlas,
    });
  }
  return out;
}
/** Phase-1 scrub: delete nested Well/Atlas under each child, then child docs. */
async function deleteAllChildrenSubtrees(uid) {
  const userRef = init_1.db.collection("users").doc(uid);
  const childrenSnap = await userRef.collection("children").get();
  for (const childDoc of childrenSnap.docs) {
    const childRef = childDoc.ref;
    for (const nested of ["wellState", "wellQuestions", "childAtlas"]) {
      const count = await deleteCollectionDocs(childRef.collection(nested));
      if (count > 0) {
        firebase_functions_1.logger.info("account_deletion_child_nested_deleted", {
          uid,
          childId: childDoc.id,
          nested,
          count,
        });
      }
    }
    await childRef.delete();
  }
  if (childrenSnap.size > 0) {
    firebase_functions_1.logger.info("account_deletion_children_deleted", {
      uid,
      count: childrenSnap.size,
    });
  }
}
/** Restore children from deletion backup (cancel / restore path). */
async function restoreChildrenSubtrees(uid, children) {
  if (!Array.isArray(children) || children.length === 0) return;
  const userRef = init_1.db.collection("users").doc(uid);
  for (const child of children) {
    const childRef = userRef.collection("children").doc(child.childId);
    await childRef.set(child.data, { merge: true });
    if (child.wellStateCurrent) {
      await childRef.collection("wellState").doc("current").set(child.wellStateCurrent, {
        merge: true,
      });
    }
    for (const entry of child.wellQuestions ?? []) {
      await childRef.collection("wellQuestions").doc(entry.id).set(entry.data, { merge: true });
    }
    for (const entry of child.childAtlas ?? []) {
      await childRef.collection("childAtlas").doc(entry.id).set(entry.data, { merge: true });
    }
  }
  firebase_functions_1.logger.info("account_deletion_children_restored", {
    uid,
    count: children.length,
  });
}
