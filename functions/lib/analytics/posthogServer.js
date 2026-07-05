"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureLessonCompleted = captureLessonCompleted;
exports.captureRodEquipped = captureRodEquipped;
exports.captureAccountCreatedBackend = captureAccountCreatedBackend;
exports.captureEmailVerifiedBackend = captureEmailVerifiedBackend;
exports.captureVerifyWallAbandoned = captureVerifyWallAbandoned;
exports.flushPostHogServer = flushPostHogServer;
const posthog_node_1 = require("posthog-node");
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
function captureServerEvent(distinctId, event, properties) {
  const posthog = getPostHogServer();
  if (!posthog) return;
  posthog.capture({ distinctId, event, properties });
}
async function captureLessonCompleted(params) {
  captureServerEvent(params.uid, "lesson_completed", {
    user_id: params.uid,
    lesson_id: params.lessonId,
    module_id: params.moduleId,
    timestamp: params.timestamp,
  });
}
async function captureRodEquipped(params) {
  captureServerEvent(params.uid, "rod_equipped", {
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
  captureServerEvent(params.uid, "account_created_backend", {
    email_verified_status: params.emailVerified,
    provider: params.provider,
    created_at: params.createdAt ?? new Date().toISOString(),
  });
}
async function captureEmailVerifiedBackend(params) {
  captureServerEvent(params.uid, "email_verified_backend", {
    hours_since_creation: params.hoursSinceCreation,
    provider: params.provider,
  });
}
async function captureVerifyWallAbandoned(params) {
  captureServerEvent(params.uid, "verify_wall_abandoned", {
    hours_since_creation: params.hoursSinceCreation,
    provider: params.provider,
    sweep_window_hours: params.sweepWindowHours,
  });
}
/** Flush pending events — call from scheduled jobs if needed. */
async function flushPostHogServer() {
  if (!client) return;
  await client.shutdown();
  client = null;
}
