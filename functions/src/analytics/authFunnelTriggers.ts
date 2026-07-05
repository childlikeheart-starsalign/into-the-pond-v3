import * as functions from "firebase-functions/v1";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";

import { db } from "../init";
import { captureAccountCreatedBackend, captureVerifyWallAbandoned } from "./posthogServer";

const VERIFY_ABANDON_HOURS = Number(process.env.VERIFY_ABANDON_HOURS ?? "1");
const AUTH_CLEANUP_DAYS = Number(process.env.AUTH_CLEANUP_DAYS ?? "7");
const SWEEP_PAGE_SIZE = 500;

export const trackNewUserBackend = functions
  .region("asia-east2")
  .auth.user()
  .onCreate(async (user) => {
    const provider = user.providerData[0]?.providerId ?? "password";

    await captureAccountCreatedBackend({
      uid: user.uid,
      emailVerified: user.emailVerified,
      provider,
      createdAt: user.metadata.creationTime,
    });

    await db
      .collection("users")
      .doc(user.uid)
      .set(
        {
          authFunnel: {
            createdAt: FieldValue.serverTimestamp(),
            provider,
            emailVerified: user.emailVerified,
            verifyAbandonedEventSent: false,
            sanctuaryInitialized: false,
          },
        },
        { merge: true },
      );
  });

async function processAbandonSweepPage(cutoff: Timestamp): Promise<number> {
  let processed = 0;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  for (;;) {
    let query = db
      .collection("users")
      .where("authFunnel.verifyAbandonedEventSent", "==", false)
      .where("authFunnel.emailVerified", "==", false)
      .where("authFunnel.provider", "==", "password")
      .where("authFunnel.createdAt", "<", cutoff)
      .orderBy("authFunnel.createdAt")
      .limit(SWEEP_PAGE_SIZE);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snap = await query.get();
    if (snap.empty) break;

    for (const docSnap of snap.docs) {
      const uid = docSnap.id;
      try {
        const authUser = await getAuth().getUser(uid);
        if (authUser.emailVerified) {
          await docSnap.ref.set(
            { authFunnel: { emailVerified: true, verifyAbandonedEventSent: true } },
            { merge: true },
          );
          continue;
        }

        const data = docSnap.data() as {
          authFunnel?: { createdAt?: Timestamp; provider?: string };
        };
        const createdAt = data.authFunnel?.createdAt?.toDate?.();
        const hours = createdAt
          ? Math.max(0, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60))
          : VERIFY_ABANDON_HOURS;

        await captureVerifyWallAbandoned({
          uid,
          hoursSinceCreation: hours,
          provider: data.authFunnel?.provider ?? "password",
          sweepWindowHours: VERIFY_ABANDON_HOURS,
        });

        await docSnap.ref.set({ authFunnel: { verifyAbandonedEventSent: true } }, { merge: true });
        processed += 1;
      } catch (error) {
        logger.warn("verify_wall_abandoned sweep user failed", { uid, error });
      }
    }

    if (snap.size < SWEEP_PAGE_SIZE) break;
    lastDoc = snap.docs[snap.docs.length - 1];
  }

  return processed;
}

export const sweepVerifyWallAbandoned = onSchedule("every 1 hours", async () => {
  const cutoffMs = Date.now() - VERIFY_ABANDON_HOURS * 60 * 60 * 1000;
  const cutoff = Timestamp.fromMillis(cutoffMs);
  const count = await processAbandonSweepPage(cutoff);
  logger.info("verify_wall_abandoned sweep complete", { count, VERIFY_ABANDON_HOURS });
});

async function processAuthCleanupPage(cutoff: Timestamp): Promise<number> {
  let deleted = 0;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  for (;;) {
    let query = db
      .collection("users")
      .where("authFunnel.sanctuaryInitialized", "==", false)
      .where("authFunnel.emailVerified", "==", false)
      .where("authFunnel.provider", "==", "password")
      .where("authFunnel.createdAt", "<", cutoff)
      .orderBy("authFunnel.createdAt")
      .limit(SWEEP_PAGE_SIZE);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snap = await query.get();
    if (snap.empty) break;

    for (const docSnap of snap.docs) {
      const uid = docSnap.id;
      try {
        const authUser = await getAuth().getUser(uid);
        if (authUser.emailVerified) {
          logger.warn("auth cleanup skipped verified user", { uid });
          continue;
        }

        await getAuth().deleteUser(uid);
        await docSnap.ref.delete();
        deleted += 1;
      } catch (error) {
        logger.warn("auth cleanup user failed", { uid, error });
      }
    }

    if (snap.size < SWEEP_PAGE_SIZE) break;
    lastDoc = snap.docs[snap.docs.length - 1];
  }

  return deleted;
}

export const nightlyAbandonedAuthCleanup = onSchedule("every 24 hours", async () => {
  const cutoffMs = Date.now() - AUTH_CLEANUP_DAYS * 24 * 60 * 60 * 1000;
  const cutoff = Timestamp.fromMillis(cutoffMs);
  const count = await processAuthCleanupPage(cutoff);
  logger.info("nightly auth cleanup complete", { count, AUTH_CLEANUP_DAYS });
});
