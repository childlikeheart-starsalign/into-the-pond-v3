import { createHash } from "node:crypto";

import { getAuth } from "firebase-admin/auth";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { db } from "../init";
import { deleteAllUserSubcollections } from "./deletePiiSubcollections";

const SWEEP_PAGE_SIZE = 500;

type PurgeProgress = {
  subcollections?: boolean;
  financial?: boolean;
  auth?: boolean;
};

async function exportFinancialRecords(uid: string): Promise<number> {
  const userRef = db.collection("users").doc(uid);
  let exported = 0;

  const purchasesSnap = await userRef.collection("purchases").get();
  for (const purchaseDoc of purchasesSnap.docs) {
    const data = purchaseDoc.data() as {
      productId?: string;
      platform?: string;
      transactionId?: string;
      purchasedAt?: Timestamp;
    };
    const recordId = `purchase_${purchaseDoc.id}`;
    await db
      .collection("financialRecords")
      .doc(recordId)
      .set({
        originalUidHash: createHash("sha256").update(uid).digest("hex"),
        platform: data.platform === "android" ? "google" : "apple",
        productId: data.productId ?? "unknown",
        transactionId: data.transactionId ?? purchaseDoc.id,
        amount: 0,
        currency: "USD",
        purchasedAt: data.purchasedAt ?? Timestamp.now(),
        exportedAt: Timestamp.now(),
        source: "purchases",
      });
    exported += 1;
  }

  return exported;
}

async function purgeSingleUser(uid: string): Promise<void> {
  const userRef = db.collection("users").doc(uid);
  const deletionRequestRef = db.collection("deletion_requests").doc(uid);
  const progress: PurgeProgress = {};

  await userRef.set({ deletionStatus: "purging" }, { merge: true });

  try {
    const financialCount = await exportFinancialRecords(uid);
    progress.financial = true;
    logger.info("account_purge_financial_exported", { uid, financialCount });

    await deleteAllUserSubcollections(uid);
    progress.subcollections = true;

    await deletionRequestRef.delete().catch(() => undefined);
    await userRef.delete();

    await getAuth().deleteUser(uid);
    progress.auth = true;

    logger.info("account_deletion_purged", { uid, progress });
  } catch (error) {
    logger.error("account_deletion_purge_failed", { uid, progress, error });
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

async function processExpiredDeletionsPage(now: Timestamp): Promise<number> {
  let purged = 0;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  for (;;) {
    let query = db
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
        logger.warn("account_purge_user_failed", { uid, error });
      }
    }

    if (snap.size < SWEEP_PAGE_SIZE) break;
    lastDoc = snap.docs[snap.docs.length - 1];
  }

  return purged;
}

export const purgeExpiredAccountDeletions = onSchedule("every 24 hours", async () => {
  const now = Timestamp.now();
  const count = await processExpiredDeletionsPage(now);
  logger.info("purge_expired_account_deletions complete", { count });
});
