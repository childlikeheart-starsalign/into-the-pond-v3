"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledEconomyReconciliation = void 0;
const firebase_functions_1 = require("firebase-functions");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const init_1 = require("../../init");
const reconcileUser_1 = require("./reconcileUser");
const DRIFT_ALERT_THRESHOLD = 2;
const USER_BATCH_SIZE = 100;
function hasSignificantDrift(drift) {
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
exports.scheduledEconomyReconciliation = (0, scheduler_1.onSchedule)("every 24 hours", async () => {
  const usersSnap = await init_1.db.collection("users").select().get();
  const driftingUsers = [];
  for (let i = 0; i < usersSnap.docs.length; i += USER_BATCH_SIZE) {
    const batch = usersSnap.docs.slice(i, i + USER_BATCH_SIZE);
    const reports = await Promise.all(
      batch.map(async (userDoc) => {
        try {
          return await (0, reconcileUser_1.reconcileUser)(userDoc.id);
        } catch (error) {
          firebase_functions_1.logger.warn("scheduledEconomyReconciliation skipped user", {
            uid: userDoc.id,
            error,
          });
          return null;
        }
      }),
    );
    for (const report of reports) {
      if (!report || !report.hasDrift) continue;
      if (!hasSignificantDrift(report.drift)) continue;
      driftingUsers.push({ uid: report.uid, drift: report.drift });
      firebase_functions_1.logger.error("Economy drift detected", {
        uid: report.uid,
        drift: report.drift,
      });
    }
  }
  if (driftingUsers.length > 0) {
    await init_1.db.collection("admin").doc("economyDriftReport").set({
      reportedAt: Date.now(),
      driftingUsers,
      totalDriftingUsers: driftingUsers.length,
      totalUsers: usersSnap.size,
      driftThreshold: DRIFT_ALERT_THRESHOLD,
    });
  }
  firebase_functions_1.logger.info("scheduledEconomyReconciliation complete", {
    totalUsers: usersSnap.size,
    totalDriftingUsers: driftingUsers.length,
  });
});
