import { PostHog } from "posthog-node";
import admin from "firebase-admin";

const POSTHOG_HOST = process.env.POSTHOG_HOST ?? "https://app.posthog.com";

let client: PostHog | null = null;

function getPostHogServer(): PostHog | null {
  const apiKey = process.env.POSTHOG_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new PostHog(apiKey, { host: POSTHOG_HOST });
  }
  return client;
}

async function isUserAnalyticsOptedOut(distinctId: string): Promise<boolean> {
  try {
    const snap = await admin.firestore().collection("users").doc(distinctId).get();
    return snap.data()?.analyticsOptOut === true;
  } catch {
    return false;
  }
}

async function captureServerEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const posthog = getPostHogServer();
  if (!posthog) return;
  if (await isUserAnalyticsOptedOut(distinctId)) return;
  posthog.capture({ distinctId, event, properties });
}

export async function captureLessonCompleted(params: {
  uid: string;
  lessonId: string;
  moduleId: number | null;
  timestamp: number;
}): Promise<void> {
  await captureServerEvent(params.uid, "lesson_completed", {
    user_id: params.uid,
    lesson_id: params.lessonId,
    module_id: params.moduleId,
    timestamp: params.timestamp,
  });
}

export async function captureRodEquipped(params: {
  uid: string;
  rodId: string;
  rodTier: "basic" | "rare" | "epic";
  rodElement: string;
  hoursToCollect: number;
  craftDurationHours: number;
  collectionTiming: "on_time" | "late" | "very_late";
  equippedSameSession: boolean | null;
  timestamp: number;
}): Promise<void> {
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

export async function captureAccountCreatedBackend(params: {
  uid: string;
  emailVerified: boolean;
  provider: string;
  createdAt?: string;
}): Promise<void> {
  await captureServerEvent(params.uid, "account_created_backend", {
    email_verified_status: params.emailVerified,
    provider: params.provider,
    created_at: params.createdAt ?? new Date().toISOString(),
  });
}

export async function captureEmailVerifiedBackend(params: {
  uid: string;
  provider: string;
  hoursSinceCreation: number;
}): Promise<void> {
  await captureServerEvent(params.uid, "email_verified_backend", {
    hours_since_creation: params.hoursSinceCreation,
    provider: params.provider,
  });
}

export async function captureVerifyWallAbandoned(params: {
  uid: string;
  hoursSinceCreation: number;
  provider: string;
  sweepWindowHours: number;
}): Promise<void> {
  await captureServerEvent(params.uid, "verify_wall_abandoned", {
    hours_since_creation: params.hoursSinceCreation,
    provider: params.provider,
    sweep_window_hours: params.sweepWindowHours,
  });
}

/** Flush pending events — call from scheduled jobs if needed. */
export async function captureAccountDeletionRequested(params: {
  uid: string;
  source: string;
}): Promise<void> {
  await captureServerEvent(params.uid, "account_deletion_requested", {
    source: params.source,
  });
}

export async function flushPostHogServer(): Promise<void> {
  if (!client) return;
  await client.shutdown();
  client = null;
}
