import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { creditDevPreviewWonderIdempotent } from "@/src/features/sanctuary/devPreviewWonder";
import {
  classifyClaimError,
  shouldClearCastAfterClaimFailure,
} from "@/src/features/fishing/claimCastErrors";
import {
  DEFAULT_CASTING_LABEL,
  resolveFirstCastPondLabel,
} from "@/src/features/fishing/firstCastNarration";
import {
  cancelServerCast,
  claimServerCast,
  clearServerCast,
  FishingServiceError,
  getServerCastStatus,
  isWithinCancelGrace,
  reconcileServerCastCache,
  startServerCast,
  updateCachedCast,
  type ServerCastStatus,
  type ServerClaimSummary,
  type ServerFishingCast,
} from "@/src/features/fishing/fishingServerCast";
import { trackFishingCastCancelled } from "@/src/services/analytics/fishingClaimEvents";
import { Sentry } from "@/src/services/sentry/init";

export type UseActiveCastResult = {
  cast: ServerFishingCast | null;
  remainingMs: number;
  ready: boolean;
  active: boolean;
  /** True while grace window allows cancel (client display only). */
  canRecall: boolean;
  castingLabel: string | null;
  completedClaim: ServerClaimSummary | null;
  /** Cast id captured at claim success — survives applyCast(null). */
  completedClaimCastId: string | null;
  castError: string | null;
  startCast: (input: { rodId: string; baitId: string }) => Promise<boolean>;
  cancelCast: () => Promise<boolean>;
  clearCompletedClaim: () => void;
  clearCastError: () => void;
  /** Clear banner copy without unpausing claim / triggering retry. */
  dismissCastError: () => void;
};

function sameCast(a: ServerFishingCast | null, b: ServerFishingCast | null): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return (
    a.castId === b.castId &&
    a.readyAt === b.readyAt &&
    (a.mode ?? "server") === (b.mode ?? "server")
  );
}

/**
 * Sole owner of activeCast for the signed-in tabs session: local cache + server
 * reconcile, client `readyAt` countdown (no server poll), and claim when ready.
 * Mount via ActiveCastProvider — not sanctuary-focus gated.
 */
export function useActiveCast(uid: string | null): UseActiveCastResult {
  const [cast, setCast] = useState<ServerFishingCast | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [completedClaim, setCompletedClaim] = useState<ServerClaimSummary | null>(null);
  const [completedClaimCastId, setCompletedClaimCastId] = useState<string | null>(null);
  const [castError, setCastError] = useState<string | null>(null);
  const [castingLabel, setCastingLabel] = useState<string | null>(null);
  const [claimRetryTick, setClaimRetryTick] = useState(0);
  const claimingRef = useRef(false);
  const castRef = useRef<ServerFishingCast | null>(null);
  /** Cast ids that failed with non-autoRetry (e.g. auth) — do not hammer claim. */
  const claimPausedCastIdsRef = useRef<Set<string>>(new Set());

  const status: ServerCastStatus = getServerCastStatus(cast, nowMs);
  const castId = cast?.castId ?? null;
  const canRecall = status.active && isWithinCancelGrace(status.cast, nowMs);

  const applyCast = useCallback((next: ServerFishingCast | null) => {
    if (!sameCast(castRef.current, next)) {
      castRef.current = next;
      setCast(next);
    } else if (next && castRef.current && next.castingLabel !== castRef.current.castingLabel) {
      castRef.current = next;
      setCast(next);
    }
    if (!next) {
      setCastingLabel(null);
    } else if (typeof next.castingLabel === "string") {
      setCastingLabel(next.castingLabel);
    }
  }, []);

  const refreshFromStorage = useCallback(async () => {
    if (!uid) {
      applyCast(null);
      return;
    }
    try {
      const reconciled = await reconcileServerCastCache(uid);
      applyCast(reconciled);
    } catch (error) {
      console.warn("[Fishing] reconcile failed", error);
      Sentry.captureException(error, {
        tags: { area: "fishing", flow: "cast_reconcile" },
      });
    }
  }, [applyCast, uid]);

  useEffect(() => {
    if (!uid) return;
    void refreshFromStorage();
  }, [uid, refreshFromStorage]);

  useEffect(() => {
    if (!uid) return;
    const onChange = (state: AppStateStatus) => {
      if (state === "active") {
        void refreshFromStorage();
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [uid, refreshFromStorage]);

  // Client countdown only — does not re-fetch server. Also drives grace expiry UI.
  useEffect(() => {
    if (!status.active) return;
    if (status.ready && !canRecall) return;
    const tick = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(tick);
  }, [status.active, status.ready, canRecall, castId]);

  useEffect(() => {
    if (!uid || !status.active || !status.ready || !status.cast) return;
    if (claimingRef.current || completedClaim) return;
    if (castId && claimPausedCastIdsRef.current.has(castId)) return;

    const activeCast = status.cast;
    claimingRef.current = true;

    void (async () => {
      try {
        const claim = await claimServerCast(uid, activeCast);
        if (claim) {
          if (claim.previewOnly && claim.wonderAwarded > 0 && __DEV__) {
            await creditDevPreviewWonderIdempotent(
              uid,
              claim.wonderAwarded,
              `fishing:${activeCast.castId}`,
            );
          }
          claimPausedCastIdsRef.current.delete(activeCast.castId);
          setCastError(null);
          setCompletedClaimCastId(activeCast.castId);
          setCompletedClaim(claim);
          applyCast(null);
          return;
        }
        // Null claim without throw — reconcile; unlock if server has no cast.
        const reconciled = await reconcileServerCastCache(uid);
        if (!reconciled) {
          await clearServerCast();
          claimPausedCastIdsRef.current.delete(activeCast.castId);
          applyCast(null);
          return;
        }
        applyCast(reconciled);
        setTimeout(() => setClaimRetryTick((tick) => tick + 1), 4000);
      } catch (error) {
        const classified = classifyClaimError(error, { signedIn: Boolean(uid) });
        setCastError(classified.message);

        if (!classified.autoRetry) {
          claimPausedCastIdsRef.current.add(activeCast.castId);
        }

        // Server activeCast is truth — never self-clear on ambiguous failure.
        // Terminal / no server cast → clear cache and unlock the pond.
        try {
          const reconciled = await reconcileServerCastCache(uid);
          if (
            shouldClearCastAfterClaimFailure({
              terminal: classified.terminal,
              serverHasActiveCast: reconciled != null,
            })
          ) {
            await clearServerCast();
            claimPausedCastIdsRef.current.delete(activeCast.castId);
            applyCast(null);
          } else {
            applyCast(reconciled);
          }
        } catch (reconcileError) {
          console.warn("[Fishing] claim reconcile failed", reconcileError);
          if (classified.terminal) {
            await clearServerCast();
            claimPausedCastIdsRef.current.delete(activeCast.castId);
            applyCast(null);
          }
        }

        console.warn("[Fishing] claim failed", error);
        Sentry.captureException(error, {
          tags: { area: "fishing", flow: "cast_claim" },
          extra: {
            claimErrorCode: classified.code,
            retrySafe: classified.retrySafe,
            autoRetry: classified.autoRetry,
            terminal: classified.terminal,
          },
        });

        if (classified.autoRetry) {
          setTimeout(() => setClaimRetryTick((tick) => tick + 1), 5000);
        }
      } finally {
        claimingRef.current = false;
      }
    })();
  }, [applyCast, castId, claimRetryTick, completedClaim, status.active, status.ready, uid]);

  const startCast = useCallback(
    async ({ rodId, baitId }: { rodId: string; baitId: string }) => {
      if (!uid) return false;
      try {
        setCastError(null);
        const result = await startServerCast(uid, { rodId, baitId });
        claimPausedCastIdsRef.current.delete(result.cast.castId);
        setCompletedClaim(null);
        setCompletedClaimCastId(null);
        const label = await resolveFirstCastPondLabel(rodId);
        const castWithLabel: ServerFishingCast = {
          ...result.cast,
          castingLabel: label,
        };
        const persisted = await updateCachedCast({ castingLabel: label });
        applyCast(persisted ?? castWithLabel);
        setNowMs(Date.now());
        return true;
      } catch (error) {
        const message =
          error instanceof FishingServiceError
            ? error.message
            : "Could not start a cast. Try again in a moment.";
        setCastError(message);
        console.warn("[Fishing] cast failed", error);
        Sentry.captureException(error, {
          tags: { area: "fishing", flow: "cast_start" },
        });
        return false;
      }
    },
    [applyCast, uid],
  );

  const cancelCast = useCallback(async () => {
    if (!uid || !castRef.current) return false;
    const active = castRef.current;
    try {
      setCastError(null);
      const result = await cancelServerCast(uid, active);
      trackFishingCastCancelled({
        castId: result.castId,
        baitRefunded: result.baitRefunded,
      });
      Sentry.addBreadcrumb({
        category: "fishing",
        message: "cancel_cast",
        level: "info",
        data: { castId: result.castId, baitRefunded: result.baitRefunded },
      });
      claimPausedCastIdsRef.current.delete(active.castId);
      applyCast(null);
      setNowMs(Date.now());
      return true;
    } catch (error) {
      const classified = classifyClaimError(error, { signedIn: Boolean(uid) });
      setCastError(classified.message);
      try {
        const reconciled = await reconcileServerCastCache(uid);
        if (
          shouldClearCastAfterClaimFailure({
            terminal: classified.terminal,
            serverHasActiveCast: reconciled != null,
          })
        ) {
          await clearServerCast();
          applyCast(null);
        } else {
          applyCast(reconciled);
        }
      } catch {
        /* keep current */
      }
      console.warn("[Fishing] cancel failed", error);
      Sentry.captureException(error, {
        tags: { area: "fishing", flow: "cancel_cast" },
        extra: { claimErrorCode: classified.code },
      });
      return false;
    }
  }, [applyCast, uid]);

  const clearCompletedClaim = useCallback(() => {
    setCompletedClaim(null);
    setCompletedClaimCastId(null);
  }, []);
  const clearCastError = useCallback(() => {
    if (castId) claimPausedCastIdsRef.current.delete(castId);
    setCastError(null);
    // Allow a single manual retry after dismiss.
    setClaimRetryTick((tick) => tick + 1);
  }, [castId]);
  const dismissCastError = useCallback(() => {
    setCastError(null);
  }, []);

  return {
    cast,
    remainingMs: status.remainingMs,
    ready: status.ready,
    active: status.active,
    canRecall,
    castingLabel: status.active ? (castingLabel ?? DEFAULT_CASTING_LABEL) : null,
    completedClaim,
    completedClaimCastId,
    castError,
    startCast,
    cancelCast,
    clearCompletedClaim,
    clearCastError,
    dismissCastError,
  };
}
