"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
exports.nightlyAbandonedAuthCleanup =
  exports.sweepVerifyWallAbandoned =
  exports.trackNewUserBackend =
    void 0;
const functions = __importStar(require("firebase-functions/v1"));
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const init_1 = require("../init");
const posthogServer_1 = require("./posthogServer");
const VERIFY_ABANDON_HOURS = Number(process.env.VERIFY_ABANDON_HOURS ?? "1");
const AUTH_CLEANUP_DAYS = Number(process.env.AUTH_CLEANUP_DAYS ?? "7");
const SWEEP_PAGE_SIZE = 500;
exports.trackNewUserBackend = functions
  .region("asia-east2")
  .auth.user()
  .onCreate(async (user) => {
    const provider = user.providerData[0]?.providerId ?? "password";
    await (0, posthogServer_1.captureAccountCreatedBackend)({
      uid: user.uid,
      emailVerified: user.emailVerified,
      provider,
      createdAt: user.metadata.creationTime,
    });
    await init_1.db
      .collection("users")
      .doc(user.uid)
      .set(
        {
          authFunnel: {
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            provider,
            emailVerified: user.emailVerified,
            verifyAbandonedEventSent: false,
            sanctuaryInitialized: false,
          },
        },
        { merge: true },
      );
  });
async function processAbandonSweepPage(cutoff) {
  let processed = 0;
  let lastDoc;
  for (;;) {
    let query = init_1.db
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
        const authUser = await (0, auth_1.getAuth)().getUser(uid);
        if (authUser.emailVerified) {
          await docSnap.ref.set(
            { authFunnel: { emailVerified: true, verifyAbandonedEventSent: true } },
            { merge: true },
          );
          continue;
        }
        const data = docSnap.data();
        const createdAt = data.authFunnel?.createdAt?.toDate?.();
        const hours = createdAt
          ? Math.max(0, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60))
          : VERIFY_ABANDON_HOURS;
        await (0, posthogServer_1.captureVerifyWallAbandoned)({
          uid,
          hoursSinceCreation: hours,
          provider: data.authFunnel?.provider ?? "password",
          sweepWindowHours: VERIFY_ABANDON_HOURS,
        });
        await docSnap.ref.set({ authFunnel: { verifyAbandonedEventSent: true } }, { merge: true });
        processed += 1;
      } catch (error) {
        firebase_functions_1.logger.warn("verify_wall_abandoned sweep user failed", { uid, error });
      }
    }
    if (snap.size < SWEEP_PAGE_SIZE) break;
    lastDoc = snap.docs[snap.docs.length - 1];
  }
  return processed;
}
exports.sweepVerifyWallAbandoned = (0, scheduler_1.onSchedule)("every 1 hours", async () => {
  const cutoffMs = Date.now() - VERIFY_ABANDON_HOURS * 60 * 60 * 1000;
  const cutoff = firestore_1.Timestamp.fromMillis(cutoffMs);
  const count = await processAbandonSweepPage(cutoff);
  firebase_functions_1.logger.info("verify_wall_abandoned sweep complete", {
    count,
    VERIFY_ABANDON_HOURS,
  });
});
async function processAuthCleanupPage(cutoff) {
  let deleted = 0;
  let lastDoc;
  for (;;) {
    let query = init_1.db
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
        const authUser = await (0, auth_1.getAuth)().getUser(uid);
        if (authUser.emailVerified) {
          firebase_functions_1.logger.warn("auth cleanup skipped verified user", { uid });
          continue;
        }
        await (0, auth_1.getAuth)().deleteUser(uid);
        await docSnap.ref.delete();
        deleted += 1;
      } catch (error) {
        firebase_functions_1.logger.warn("auth cleanup user failed", { uid, error });
      }
    }
    if (snap.size < SWEEP_PAGE_SIZE) break;
    lastDoc = snap.docs[snap.docs.length - 1];
  }
  return deleted;
}
exports.nightlyAbandonedAuthCleanup = (0, scheduler_1.onSchedule)("every 24 hours", async () => {
  const cutoffMs = Date.now() - AUTH_CLEANUP_DAYS * 24 * 60 * 60 * 1000;
  const cutoff = firestore_1.Timestamp.fromMillis(cutoffMs);
  const count = await processAuthCleanupPage(cutoff);
  firebase_functions_1.logger.info("nightly auth cleanup complete", { count, AUTH_CLEANUP_DAYS });
});
