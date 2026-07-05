"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purgeExpiredAccountDeletions = void 0;
const node_crypto_1 = require("node:crypto");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const init_1 = require("../init");
const deletePiiSubcollections_1 = require("./deletePiiSubcollections");
const SWEEP_PAGE_SIZE = 500;
async function exportFinancialRecords(uid) {
  const userRef = init_1.db.collection("users").doc(uid);
  let exported = 0;
  const purchasesSnap = await userRef.collection("purchases").get();
  for (const purchaseDoc of purchasesSnap.docs) {
    const data = purchaseDoc.data();
    const recordId = `purchase_${purchaseDoc.id}`;
    await init_1.db
      .collection("financialRecords")
      .doc(recordId)
      .set({
        originalUidHash: (0, node_crypto_1.createHash)("sha256").update(uid).digest("hex"),
        platform: data.platform === "android" ? "google" : "apple",
        productId: data.productId ?? "unknown",
        transactionId: data.transactionId ?? purchaseDoc.id,
        amount: 0,
        currency: "USD",
        purchasedAt: data.purchasedAt ?? firestore_1.Timestamp.now(),
        exportedAt: firestore_1.Timestamp.now(),
        source: "purchases",
      });
    exported += 1;
  }
  return exported;
}
async function purgeSingleUser(uid) {
  const userRef = init_1.db.collection("users").doc(uid);
  const deletionRequestRef = init_1.db.collection("deletion_requests").doc(uid);
  const progress = {};
  await userRef.set({ deletionStatus: "purging" }, { merge: true });
  try {
    const financialCount = await exportFinancialRecords(uid);
    progress.financial = true;
    firebase_functions_1.logger.info("account_purge_financial_exported", { uid, financialCount });
    await (0, deletePiiSubcollections_1.deleteAllUserSubcollections)(uid);
    progress.subcollections = true;
    await deletionRequestRef.delete().catch(() => undefined);
    await userRef.delete();
    await (0, auth_1.getAuth)().deleteUser(uid);
    progress.auth = true;
    firebase_functions_1.logger.info("account_deletion_purged", { uid, progress });
  } catch (error) {
    firebase_functions_1.logger.error("account_deletion_purge_failed", { uid, progress, error });
    await userRef.set(
      {
        deletionStatus: "purging",
        purgeProgress: progress,
      },
      { merge: true },
    );
    throw error;
  }
}
async function processExpiredDeletionsPage(now) {
  let purged = 0;
  let lastDoc;
  for (;;) {
    let query = init_1.db
      .collection("users")
      .where("deletionStatus", "==", "pending")
      .where("deletionPurgeAt", "<", now)
      .orderBy("deletionPurgeAt")
      .limit(SWEEP_PAGE_SIZE);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    const snap = await query.get();
    if (snap.empty) break;
    for (const docSnap of snap.docs) {
      const uid = docSnap.id;
      try {
        await purgeSingleUser(uid);
        purged += 1;
      } catch (error) {
        firebase_functions_1.logger.warn("account_purge_user_failed", { uid, error });
      }
    }
    if (snap.size < SWEEP_PAGE_SIZE) break;
    lastDoc = snap.docs[snap.docs.length - 1];
  }
  return purged;
}
exports.purgeExpiredAccountDeletions = (0, scheduler_1.onSchedule)("every 24 hours", async () => {
  const now = firestore_1.Timestamp.now();
  const count = await processExpiredDeletionsPage(now);
  firebase_functions_1.logger.info("purge_expired_account_deletions complete", { count });
});
