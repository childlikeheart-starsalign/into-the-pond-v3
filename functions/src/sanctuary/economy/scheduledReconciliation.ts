import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { db } from "../../init";
import { reconcileUser, type ReconcileUserReport } from "./reconcileUser";

const DRIFT_ALERT_THRESHOLD = 2;
const USER_BATCH_SIZE = 100;

type DriftingUser = {
  uid: string;
  drift: ReconcileUserReport["drift"];
};

function hasSignificantDrift(drift: ReconcileUserReport["drift"]): boolean {
  const scalarDrift = [
    drift.currentWonder,
    drift.storedWonder,
    drift.parts,
    drift.feather,
    drift.scale,
    drift.glimmerdust,
    drift.lifetimeWonderEarned,
    ...Object.values(drift.baits),
  ];
  return scalarDrift.some((value) => Math.abs(value) > DRIFT_ALERT_THRESHOLD);
}

/** Daily ledger vs user-doc drift scan. Writes admin/economyDriftReport when drift exceeds threshold. */
export const scheduledEconomyReconciliation = onSchedule("every 24 hours", async () => {
  const usersSnap = await db.collection("users").select().get();
  const driftingUsers: DriftingUser[] = [];

  for (let i = 0; i < usersSnap.docs.length; i += USER_BATCH_SIZE) {
    const batch = usersSnap.docs.slice(i, i + USER_BATCH_SIZE);
    const reports = await Promise.all(
      batch.map(async (userDoc) => {
        try {
          return await reconcileUser(userDoc.id);
        } catch (error) {
          logger.warn("scheduledEconomyReconciliation skipped user", { uid: userDoc.id, error });
          return null;
        }
      }),
    );

    for (const report of reports) {
      if (!report || !report.hasDrift) continue;
      if (!hasSignificantDrift(report.drift)) continue;
      driftingUsers.push({ uid: report.uid, drift: report.drift });
      logger.error("Economy drift detected", { uid: report.uid, drift: report.drift });
    }
  }

  if (driftingUsers.length > 0) {
    await db.collection("admin").doc("economyDriftReport").set({
      reportedAt: Date.now(),
      driftingUsers,
      totalDriftingUsers: driftingUsers.length,
      totalUsers: usersSnap.size,
      driftThreshold: DRIFT_ALERT_THRESHOLD,
    });
  }

  logger.info("scheduledEconomyReconciliation complete", {
    totalUsers: usersSnap.size,
    totalDriftingUsers: driftingUsers.length,
  });
});
