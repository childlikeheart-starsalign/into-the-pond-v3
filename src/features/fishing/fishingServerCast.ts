import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseError } from "firebase/app";

import {
  clearActiveFishingCast,
  FISHING_CAST_DURATION_MS,
  getFishingCastStatus,
  loadActiveFishingCast,
  startFishingCast,
} from "@/src/features/fishing/fishingCastStorage";
import { mergeServerCastWithLocalCache } from "@/src/features/fishing/mergeServerCastCache";
import { getUserProgress } from "@/src/services/firebase/progress";
import {
  claimCast,
  cancelCast,
  createCast,
  type ServerClaimSummary,
} from "@/src/services/firebase/serverActions";
import { CANCEL_CAST_GRACE_MS } from "@/shared/sanctuary/fishing/castTiming";
import {
  cancelCastReadyNotification,
  scheduleCastReadyNotification,
  syncCastReadyNotificationsWithServer,
} from "@/src/features/fishing/castReadyNotification";
import { firebaseAuth } from "@/src/services/firebase/client";
import { Sentry } from "@/src/services/sentry/init";

export type { ServerClaimSummary };

const STORAGE_KEY = "fishing:server-cast";
const PENDING_REQUEST_KEY = "fishing:server-cast-pending-request";

type PendingCastRequest = {
  requestId: string;
  rodId: string;
  baitId: string;
};

async function loadPendingCastRequest(): Promise<PendingCastRequest | null> {
  const raw = await AsyncStorage.getItem(PENDING_REQUEST_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingCastRequest>;
    if (!parsed.requestId || !parsed.rodId || !parsed.baitId) return null;
    return {
      requestId: parsed.requestId,
      rodId: parsed.rodId,
      baitId: parsed.baitId,
    };
  } catch {
    await AsyncStorage.removeItem(PENDING_REQUEST_KEY);
    return null;
  }
}

async function persistPendingCastRequest(pending: PendingCastRequest): Promise<void> {
  await AsyncStorage.setItem(PENDING_REQUEST_KEY, JSON.stringify(pending));
}

async function clearPendingCastRequest(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_REQUEST_KEY);
}

export type ServerFishingCast = {
  castId: string;
  readyAt: number;
  /** Server create time (ms) — grace window for cancel. */
  createdAtMs?: number;
  rodIdAtCast: string;
  baitIdAtCast: string;
  /** Stable id for createCast idempotency on retry. */
  requestId?: string;
  /** Dev-only fallback when Cloud Functions are not deployed. */
  mode?: "server" | "local";
  /** Pond overlay copy — client cache only (survives remount). */
  castingLabel?: string;
};

export type StartServerCastResult =
  | { status: "started"; cast: ServerFishingCast }
  | { status: "already_active"; cast: ServerFishingCast };

export type ServerCastStatus =
  | { active: false; cast: null; remainingMs: 0; ready: false }
  | { active: true; cast: ServerFishingCast; remainingMs: number; ready: boolean };

export class FishingServiceError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "FishingServiceError";
  }
}

function isFunctionsUnavailable(error: unknown): boolean {
  if (!(error instanceof FirebaseError)) return false;
  return (
    error.code === "functions/not-found" ||
    error.code === "functions/unavailable" ||
    error.message.includes("not-found")
  );
}

/** DEV-only local cast path — off unless explicitly opted in (avoids silent fake success). */
function isLocalCastAllowed(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_FISHING_ALLOW_LOCAL_CAST === "1";
}

function shouldForceServerClaim(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_FISHING_FORCE_SERVER_CLAIM === "1";
}

function isAlreadyActiveError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as { message?: unknown }).message) : "";
  if (message !== "A cast is already active") return false;
  if (error instanceof FirebaseError) {
    return error.code === "functions/failed-precondition";
  }
  const code = "code" in error ? String((error as { code?: unknown }).code) : "";
  return code === "failed-precondition" || code === "functions/failed-precondition";
}

async function persistServerCast(cast: ServerFishingCast): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cast));
}

function parseCastingLabel(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Merge client-only fields (e.g. castingLabel) into the cached cast. */
export async function updateCachedCast(
  patch: Pick<ServerFishingCast, "castingLabel">,
): Promise<ServerFishingCast | null> {
  const current = await loadServerCast();
  if (!current) return null;
  const next: ServerFishingCast = {
    ...current,
    castingLabel: parseCastingLabel(patch.castingLabel) ?? current.castingLabel,
  };
  await persistServerCast(next);
  return next;
}

export async function loadServerCast(): Promise<ServerFishingCast | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    if (!isLocalCastAllowed()) {
      await clearActiveFishingCast();
      return null;
    }
    const legacy = await loadActiveFishingCast();
    if (!legacy) return null;
    return {
      castId: `local_${legacy.castStartTime}`,
      readyAt: legacy.castStartTime + FISHING_CAST_DURATION_MS,
      rodIdAtCast: legacy.rodIdAtCast,
      baitIdAtCast: legacy.baitIdAtCast,
      mode: "local",
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ServerFishingCast>;
    if (!parsed.castId || !parsed.readyAt) return null;
    const cast: ServerFishingCast = {
      castId: parsed.castId,
      readyAt: parsed.readyAt,
      rodIdAtCast: parsed.rodIdAtCast ?? "basic",
      baitIdAtCast: parsed.baitIdAtCast ?? "bait_basic",
      requestId: typeof parsed.requestId === "string" ? parsed.requestId : undefined,
      mode: parsed.mode ?? "server",
      castingLabel: parseCastingLabel(parsed.castingLabel),
    };
    if (cast.mode === "local" && !isLocalCastAllowed()) {
      await clearServerCast();
      return null;
    }
    return cast;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function clearServerCast(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  await clearPendingCastRequest();
  await clearActiveFishingCast();
}

export function getServerCastStatus(
  cast: ServerFishingCast | null,
  now = Date.now(),
): ServerCastStatus {
  if (!cast) return { active: false, cast: null, remainingMs: 0, ready: false };
  const remainingMs = Math.max(0, cast.readyAt - now);
  return { active: true, cast, remainingMs, ready: remainingMs === 0 };
}

/** Client display only — server enforces CANCEL_CAST_GRACE_MS against createdAt. */
export function isWithinCancelGrace(cast: ServerFishingCast | null, now = Date.now()): boolean {
  if (!cast?.createdAtMs) return false;
  return now - cast.createdAtMs <= CANCEL_CAST_GRACE_MS;
}

async function fetchActiveCastFromServer(uid: string): Promise<ServerFishingCast | null> {
  const userDoc = await getUserProgress(uid);
  const activeCast = userDoc?.activeCast;
  if (!activeCast?.castId || !activeCast.readyTimestamp) return null;

  return {
    castId: activeCast.castId,
    readyAt: activeCast.readyTimestamp.toMillis(),
    createdAtMs: activeCast.createdAt?.toMillis?.(),
    rodIdAtCast: activeCast.rodType ?? "basic",
    baitIdAtCast: activeCast.baitUsed ?? "random_bait",
    mode: "server",
  };
}

/** Overwrite local cast cache from server `users/{uid}.activeCast`. */
export async function reconcileServerCastCache(uid: string): Promise<ServerFishingCast | null> {
  const localCast = await loadServerCast();
  const serverCast = await fetchActiveCastFromServer(uid);
  const hadDesync = (localCast?.castId ?? null) !== (serverCast?.castId ?? null);

  if (serverCast) {
    const merged = mergeServerCastWithLocalCache(localCast, serverCast);
    await persistServerCast(merged);
    void syncCastReadyNotificationsWithServer({
      activeCastId: merged.castId,
      readyAt: merged.readyAt,
    });
    if (hadDesync) {
      Sentry.addBreadcrumb({
        category: "cast_reconciliation",
        message: "Local/server activeCast desync detected and reconciled on foreground",
        level: "info",
      });
    }
    return merged;
  }
  await clearServerCast();
  void syncCastReadyNotificationsWithServer({ activeCastId: null });
  if (hadDesync) {
    Sentry.addBreadcrumb({
      category: "cast_reconciliation",
      message: "Local/server activeCast desync detected and reconciled on foreground",
      level: "info",
    });
  }
  return null;
}

async function startLocalCast(input: {
  rodId: string;
  baitId: string;
}): Promise<StartServerCastResult | null> {
  const legacy = await startFishingCast({
    rodIdAtCast: input.rodId,
    baitIdAtCast: input.baitId,
  });
  if (!legacy) {
    const existing = await loadServerCast();
    if (existing) return { status: "already_active", cast: existing };
    return null;
  }

  const cast: ServerFishingCast = {
    castId: `local_${legacy.castStartTime}`,
    readyAt: legacy.castStartTime + FISHING_CAST_DURATION_MS,
    createdAtMs: legacy.castStartTime,
    rodIdAtCast: input.rodId,
    baitIdAtCast: input.baitId,
    mode: "local",
  };
  await persistServerCast(cast);
  return { status: "started", cast };
}

function createCastRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `cast_${globalThis.crypto.randomUUID()}`;
  }
  return `cast_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

export async function startServerCast(
  uid: string,
  input: { rodId: string; baitId: string },
): Promise<StartServerCastResult> {
  const existingServer = await fetchActiveCastFromServer(uid);
  if (existingServer) {
    await persistServerCast(existingServer);
    return { status: "already_active", cast: existingServer };
  }

  const persisted = await loadServerCast();
  const pending = await loadPendingCastRequest();
  const requestId =
    pending && pending.rodId === input.rodId && pending.baitId === input.baitId
      ? pending.requestId
      : persisted?.requestId &&
          persisted.rodIdAtCast === input.rodId &&
          persisted.baitIdAtCast === input.baitId
        ? persisted.requestId
        : createCastRequestId();

  try {
    await persistPendingCastRequest({
      requestId,
      rodId: input.rodId,
      baitId: input.baitId,
    });

    const result = await createCast(uid, {
      rodType: input.rodId,
      baitUsed: input.baitId,
      requestId,
    });
    if (!result.success || !result.castId || !result.readyAt) {
      throw new FishingServiceError("Cast could not be started.", "cast-failed");
    }

    const cast: ServerFishingCast = {
      castId: result.castId,
      readyAt: result.readyAt,
      createdAtMs: result.createdAt ?? Date.now(),
      rodIdAtCast: input.rodId,
      baitIdAtCast: input.baitId,
      requestId,
      mode: "server",
    };
    await persistServerCast(cast);
    await clearPendingCastRequest();
    void scheduleCastReadyNotification({ castId: cast.castId, readyAt: cast.readyAt });
    return { status: "started", cast };
  } catch (error) {
    if (isAlreadyActiveError(error)) {
      const existing = await fetchActiveCastFromServer(uid);
      if (!existing) {
        throw new FishingServiceError(
          "A cast is already active but could not be loaded. Try again in a moment.",
          "cast-reconcile-failed",
        );
      }
      await persistServerCast(existing);
      Sentry.addBreadcrumb({
        category: "cast_reconciliation",
        message: "Local/server activeCast desync detected and reconciled on cast",
        level: "info",
        data: { castId: existing.castId },
      });
      return { status: "already_active", cast: existing };
    }

    if (isLocalCastAllowed() && isFunctionsUnavailable(error)) {
      console.warn(
        "[Fishing] Cloud Function createCast unavailable — using local cast (EXPO_PUBLIC_FISHING_ALLOW_LOCAL_CAST=1).",
        error,
      );
      const localResult = await startLocalCast(input);
      if (localResult) return localResult;
      throw new FishingServiceError("Cast could not be started.", "cast-failed");
    }

    if (isFunctionsUnavailable(error)) {
      throw new FishingServiceError(
        "Fishing service is not available yet. Cloud Functions need to be deployed.",
        "functions-not-found",
      );
    }

    throw error;
  }
}

export async function claimServerCast(
  uid: string,
  cast: ServerFishingCast,
): Promise<ServerClaimSummary | null> {
  if (cast.mode === "local") {
    if (!isLocalCastAllowed()) {
      await clearServerCast();
      throw new FishingServiceError(
        "Local fishing sessions are unavailable.",
        "local-session-unavailable",
      );
    }
    const { resolveDevFishingClaim } =
      await import("@/src/features/fishing/resolveDevFishingClaim");
    const summary = await resolveDevFishingClaim(uid, cast);
    await clearServerCast();
    await cancelCastReadyNotification(cast.castId);
    return summary;
  }

  const authUser = firebaseAuth.currentUser;
  if (!authUser) {
    throw new FirebaseError("functions/unauthenticated", "unauthenticated");
  }
  if (authUser.uid !== uid) {
    throw new FirebaseError("functions/unauthenticated", "unauthenticated");
  }

  try {
    const result = await claimCast(uid, {});
    if (!result.success || !result.claim) return null;
    await clearServerCast();
    await cancelCastReadyNotification(cast.castId);
    return result.claim;
  } catch (error) {
    if (error instanceof FirebaseError && error.code === "functions/failed-precondition") {
      try {
        const retry = await claimCast(uid, {});
        if (retry.success && retry.claim) {
          await clearServerCast();
          await cancelCastReadyNotification(cast.castId);
          return retry.claim;
        }
      } catch {
        // fall through — do not clear local cast on ambiguous failure
      }
      // Reconcile only; leave local cast until caller decides from classification.
      await reconcileServerCastCache(uid);
    }
    if (isLocalCastAllowed() && !shouldForceServerClaim() && isFunctionsUnavailable(error)) {
      return claimServerCast(uid, { ...cast, mode: "local" });
    }
    throw error;
  }
}

export type CancelServerCastResult = {
  success: true;
  castId: string;
  baitRefunded: boolean;
};

/**
 * Cancel within grace window. Reconcile from server on ambiguous failure —
 * same discipline as claim.
 */
export async function cancelServerCast(
  uid: string,
  cast: ServerFishingCast,
): Promise<CancelServerCastResult> {
  if (cast.mode === "local") {
    if (!isLocalCastAllowed()) {
      throw new FishingServiceError(
        "Local fishing sessions are unavailable.",
        "local-session-unavailable",
      );
    }
    await clearServerCast();
    await cancelCastReadyNotification(cast.castId);
    return { success: true, castId: cast.castId, baitRefunded: false };
  }

  const authUser = firebaseAuth.currentUser;
  if (!authUser) {
    throw new FirebaseError("functions/unauthenticated", "unauthenticated");
  }
  if (authUser.uid !== uid) {
    throw new FirebaseError("functions/unauthenticated", "unauthenticated");
  }

  try {
    const result = await cancelCast(uid);
    if (!result.success || !result.castId) {
      throw new FishingServiceError("Could not recall this cast.", "cancel-failed");
    }
    await clearServerCast();
    await cancelCastReadyNotification(result.castId);
    return {
      success: true,
      castId: result.castId,
      baitRefunded: result.baitRefunded === true,
    };
  } catch (error) {
    // Reconcile — if server already cleared, unlock pond.
    try {
      const reconciled = await reconcileServerCastCache(uid);
      if (!reconciled) {
        await cancelCastReadyNotification(cast.castId);
      }
    } catch {
      // leave cache; caller classifies
    }
    throw error;
  }
}

/** @deprecated use getServerCastStatus */
export { getFishingCastStatus };
