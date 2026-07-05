"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePiiSubcollections = deletePiiSubcollections;
exports.deleteAllUserSubcollections = deleteAllUserSubcollections;
const firebase_functions_1 = require("firebase-functions");
const init_1 = require("../init");
const accountDeletionConstants_1 = require("./accountDeletionConstants");
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
async function deletePiiSubcollections(uid) {
  const userRef = init_1.db.collection("users").doc(uid);
  for (const subcollection of accountDeletionConstants_1.PII_SUBCOLLECTIONS) {
    const count = await deleteCollectionDocs(userRef.collection(subcollection));
    if (count > 0) {
      firebase_functions_1.logger.info("account_deletion_pii_subcollection_deleted", {
        uid,
        subcollection,
        count,
      });
    }
  }
}
/** Paginated delete for all subcollections under a user (Phase 3 purge). */
async function deleteAllUserSubcollections(uid) {
  const userRef = init_1.db.collection("users").doc(uid);
  const subcollections = await userRef.listCollections();
  for (const collectionRef of subcollections) {
    const count = await deleteCollectionDocs(collectionRef);
    if (count > 0) {
      firebase_functions_1.logger.info("account_purge_subcollection_deleted", {
        uid,
        subcollection: collectionRef.id,
        count,
      });
    }
  }
}
