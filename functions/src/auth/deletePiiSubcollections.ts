import { logger } from "firebase-functions";

import { db } from "../init";
import { PII_SUBCOLLECTIONS } from "./accountDeletionConstants";

const BATCH_DELETE_LIMIT = 400;

async function deleteCollectionDocs(
  collectionRef: FirebaseFirestore.CollectionReference,
): Promise<number> {
  let deleted = 0;

  for (;;) {
    const snap = await collectionRef.limit(BATCH_DELETE_LIMIT).get();
    if (snap.empty) break;

    const batch = db.batch();
    for (const docSnap of snap.docs) {
      batch.delete(docSnap.ref);
    }
    await batch.commit();
    deleted += snap.size;

    if (snap.size < BATCH_DELETE_LIMIT) break;
  }

  return deleted;
}

export async function deletePiiSubcollections(uid: string): Promise<void> {
  const userRef = db.collection("users").doc(uid);

  for (const subcollection of PII_SUBCOLLECTIONS) {
    const count = await deleteCollectionDocs(userRef.collection(subcollection));
    if (count > 0) {
      logger.info("account_deletion_pii_subcollection_deleted", {
        uid,
        subcollection,
        count,
      });
    }
  }
}

/** Paginated delete for all subcollections under a user (Phase 3 purge). */
export async function deleteAllUserSubcollections(uid: string): Promise<void> {
  const userRef = db.collection("users").doc(uid);
  const subcollections = await userRef.listCollections();

  for (const collectionRef of subcollections) {
    const count = await deleteCollectionDocs(collectionRef);
    if (count > 0) {
      logger.info("account_purge_subcollection_deleted", {
        uid,
        subcollection: collectionRef.id,
        count,
      });
    }
  }
}
