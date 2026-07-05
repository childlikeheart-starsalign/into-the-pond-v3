"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureLessonCompleted = captureLessonCompleted;
exports.captureRodEquipped = captureRodEquipped;
exports.captureAccountCreatedBackend = captureAccountCreatedBackend;
exports.captureEmailVerifiedBackend = captureEmailVerifiedBackend;
exports.captureVerifyWallAbandoned = captureVerifyWallAbandoned;
exports.captureAccountDeletionRequested = captureAccountDeletionRequested;
exports.flushPostHogServer = flushPostHogServer;
const posthog_node_1 = require("posthog-node");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const POSTHOG_HOST = process.env.POSTHOG_HOST ?? "https://app.posthog.com";
let client = null;
function getPostHogServer() {
  const apiKey = process.env.POSTHOG_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new posthog_node_1.PostHog(apiKey, { host: POSTHOG_HOST });
  }
  return client;
}
async function isUserAnalyticsOptedOut(distinctId) {
  try {
    const snap = await firebase_admin_1.default
      .firestore()
      .collection("users")
      .doc(distinctId)
      .get();
    return snap.data()?.analyticsOptOut === true;
  } catch {
    return false;
  }
}
async function captureServerEvent(distinctId, event, properties) {
  const posthog = getPostHogServer();
  if (!posthog) return;
  if (await isUserAnalyticsOptedOut(distinctId)) return;
  posthog.capture({ distinctId, event, properties });
}
async function captureLessonCompleted(params) {
  await captureServerEvent(params.uid, "lesson_completed", {
    user_id: params.uid,
    lesson_id: params.lessonId,
    module_id: params.moduleId,
    timestamp: params.timestamp,
  });
}
async function captureRodEquipped(params) {
  await captureServerEvent(params.uid, "rod_equipped", {
    rodId: params.rodId,
    rodTier: params.rodTier,
    rodElement: params.rodElement,
    hoursToCollect: params.hoursToCollect,
    craftDurationHours: params.craftDurationHours,
    collectionTiming: params.collectionTiming,
    equippedSameSession: params.equippedSameSession,
    timestamp: params.timestamp,
  });
}
async function captureAccountCreatedBackend(params) {
  await captureServerEvent(params.uid, "account_created_backend", {
    email_verified_status: params.emailVerified,
    provider: params.provider,
    created_at: params.createdAt ?? new Date().toISOString(),
  });
}
async function captureEmailVerifiedBackend(params) {
  await captureServerEvent(params.uid, "email_verified_backend", {
    hours_since_creation: params.hoursSinceCreation,
    provider: params.provider,
  });
}
async function captureVerifyWallAbandoned(params) {
  await captureServerEvent(params.uid, "verify_wall_abandoned", {
    hours_since_creation: params.hoursSinceCreation,
    provider: params.provider,
    sweep_window_hours: params.sweepWindowHours,
  });
}
/** Flush pending events — call from scheduled jobs if needed. */
async function captureAccountDeletionRequested(params) {
  await captureServerEvent(params.uid, "account_deletion_requested", {
    source: params.source,
  });
}
async function flushPostHogServer() {
  if (!client) return;
  await client.shutdown();
  client = null;
}
