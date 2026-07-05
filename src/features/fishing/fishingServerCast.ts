import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseError } from "firebase/app";

import {
  clearActiveFishingCast,
  FISHING_CAST_DURATION_MS,
  getFishingCastStatus,
  loadActiveFishingCast,
  startFishingCast,
} from "@/src/features/fishing/fishingCastStorage";
import { getUserProgress } from "@/src/services/firebase/progress";
import {
  claimCast,
  createCast,
  type ServerClaimSummary,
} from "@/src/services/firebase/serverActions";
import { Sentry } from "@/src/services/sentry/init";

export type { ServerClaimSummary };

const STORAGE_KEY = "fishing:server-cast";

export type ServerFishingCast = {
  castId: string;
  readyAt: number;
  rodIdAtCast: string;
  baitIdAtCast: string;
  /** Stable id for createCast idempotency on retry. */
  requestId?: string;
  /** Dev-only fallback when Cloud Functions are not deployed. */
  mode?: "server" | "local";
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

function isAlreadyActiveError(error: unknown): boolean {
  return (
    error instanceof FirebaseError &&
    error.code === "functions/failed-precondition" &&
    error.message === "A cast is already active"
  );
}

async function persistServerCast(cast: ServerFishingCast): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cast));
}

export async function loadServerCast(): Promise<ServerFishingCast | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    if (!__DEV__) {
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
      mode: parsed.mode ?? "server",
    };
    if (!__DEV__ && cast.mode === "local") {
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

async function fetchActiveCastFromServer(uid: string): Promise<ServerFishingCast | null> {
  const userDoc = await getUserProgress(uid);
  const activeCast = userDoc?.activeCast;
  if (!activeCast?.castId || !activeCast.readyTimestamp) return null;

  return {
    castId: activeCast.castId,
    readyAt: activeCast.readyTimestamp.toMillis(),
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
    await persistServerCast(serverCast);
    if (hadDesync) {
      Sentry.addBreadcrumb({
        category: "cast_reconciliation",
        message: "Local/server activeCast desync detected and reconciled on foreground",
        level: "info",
      });
    }
    return serverCast;
  }
  await clearServerCast();
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
  const persisted = await loadServerCast();
  const requestId =
    persisted?.requestId &&
    persisted.rodIdAtCast === input.rodId &&
    persisted.baitIdAtCast === input.baitId
      ? persisted.requestId
      : createCastRequestId();

  try {
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
      rodIdAtCast: input.rodId,
      baitIdAtCast: input.baitId,
      requestId,
      mode: "server",
    };
    await persistServerCast(cast);
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

    if (__DEV__ && isFunctionsUnavailable(error)) {
      console.warn(
        "[Fishing] Cloud Function createCast not found — using local dev cast. Deploy functions to asia-east2.",
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

function shouldForceServerClaim(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_FISHING_FORCE_SERVER_CLAIM === "1";
}

export async function claimServerCast(
  uid: string,
  cast: ServerFishingCast,
): Promise<ServerClaimSummary | null> {
  if (cast.mode === "local") {
    if (!__DEV__) {
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
    return summary;
  }

  try {
    const result = await claimCast(uid, {});
    if (!result.success || !result.claim) return null;
    await clearServerCast();
    return result.claim;
  } catch (error) {
    if (error instanceof FirebaseError && error.code === "functions/failed-precondition") {
      try {
        const retry = await claimCast(uid, {});
        if (retry.success && retry.claim) {
          await clearServerCast();
          return retry.claim;
        }
      } catch {
        // fall through to reconcile / rethrow
      }
      await reconcileServerCastCache(uid);
    }
    if (__DEV__ && !shouldForceServerClaim() && isFunctionsUnavailable(error)) {
      return claimServerCast(uid, { ...cast, mode: "local" });
    }
    throw error;
  }
}

/** @deprecated use getServerCastStatus */
export { getFishingCastStatus };
