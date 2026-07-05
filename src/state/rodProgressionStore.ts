import type { FishingRodId } from "@/shared/sanctuary/types";
import type { PlayerRodRecord } from "@/shared/sanctuary/progression";

export type RodProgressionSnapshot = {
  playerRods: Partial<Record<FishingRodId, PlayerRodRecord>>;
  parts: number;
  storedWonder: number;
  equippedRodId?: FishingRodId;
};

export type UserDocStatus = "pending" | "ready" | "missing" | "error";

type RodProgressionCore = RodProgressionSnapshot & {
  userDocStatus: UserDocStatus;
  userDocError: string | null;
  pendingRodIds: FishingRodId[];
  lastError: string | null;
  lastSyncedAt: number | null;
};

export type RodProgressionState = RodProgressionCore & {
  /** Derived — true only when userDocStatus === 'ready'. */
  hydrated: boolean;
};

function withDerivedHydrated(state: RodProgressionCore): RodProgressionState {
  return {
    ...state,
    hydrated: state.userDocStatus === "ready",
  };
}

export const EMPTY_ROD_PROGRESSION: RodProgressionState = withDerivedHydrated({
  playerRods: {},
  parts: 0,
  storedWonder: 0,
  userDocStatus: "pending",
  userDocError: null,
  pendingRodIds: [],
  lastError: null,
  lastSyncedAt: null,
});

type Listener = (state: RodProgressionState) => void;

let current: RodProgressionState = { ...EMPTY_ROD_PROGRESSION };
const listeners = new Set<Listener>();
let lastReconciledSnapshot: RodProgressionSnapshot | null = null;

function emit() {
  listeners.forEach((listener) => listener(current));
}

function commit(next: RodProgressionCore): void {
  current = withDerivedHydrated(next);
  emit();
}

export function getRodProgressionState(): RodProgressionState {
  return current;
}

export function subscribeRodProgression(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setUserDocStatus(status: UserDocStatus, error: string | null = null): void {
  commit({
    ...current,
    userDocStatus: status,
    userDocError: status === "error" ? error : null,
  });
}

/** Paint cache from disk before Firestore connects (cold start). */
export function hydrateRodProgressionSnapshot(snapshot: RodProgressionSnapshot): void {
  commit({
    ...current,
    ...snapshot,
    userDocStatus: "pending",
    userDocError: null,
    lastError: null,
  });
}

/**
 * Reconcile rod data from Firestore or server — does not change userDocStatus.
 */
export function setRodProgressionSnapshot(snapshot: RodProgressionSnapshot): void {
  lastReconciledSnapshot = snapshot;
  const now = Date.now();

  let playerRods: Partial<Record<FishingRodId, PlayerRodRecord>> = {
    ...snapshot.playerRods,
  };
  let parts = snapshot.parts;
  let storedWonder = snapshot.storedWonder;
  const equippedRodId = snapshot.equippedRodId;

  if (current.pendingRodIds.length > 0) {
    for (const rodId of current.pendingRodIds) {
      const optimistic = current.playerRods[rodId];
      if (optimistic) {
        playerRods = { ...playerRods, [rodId]: optimistic };
      }
    }
    parts = current.parts;
    storedWonder = current.storedWonder;
  }

  const pendingRodIds = current.pendingRodIds.filter((rodId) => {
    const incoming = snapshot.playerRods[rodId];
    const optimistic = current.playerRods[rodId];
    if (!incoming || !optimistic) return false;
    return optimistic.state !== incoming.state;
  });

  commit({
    ...current,
    playerRods,
    parts,
    storedWonder,
    equippedRodId,
    pendingRodIds,
    lastSyncedAt: now,
  });
}

export function applyOptimisticRodPatch(
  rodId: FishingRodId,
  patch: Partial<PlayerRodRecord>,
): void {
  const existing = current.playerRods[rodId];
  commit({
    ...current,
    playerRods: {
      ...current.playerRods,
      [rodId]: {
        rodId,
        state: "locked",
        craftStartedAt: null,
        craftCompletedAt: null,
        wonderInvested: 0,
        partsSpentOnCraft: 0,
        sourceModule: null,
        giftSource: null,
        ...existing,
        ...patch,
      },
    },
    pendingRodIds: current.pendingRodIds.includes(rodId)
      ? current.pendingRodIds
      : [...current.pendingRodIds, rodId],
    lastError: null,
  });
}

export function applyOptimisticEconomyPatch(patch: {
  parts?: number;
  storedWonder?: number;
}): void {
  commit({
    ...current,
    parts: patch.parts ?? current.parts,
    storedWonder: patch.storedWonder ?? current.storedWonder,
    lastError: null,
  });
}

export function rollbackOptimisticRod(rodId: FishingRodId): void {
  if (!lastReconciledSnapshot) {
    commit({
      ...current,
      pendingRodIds: current.pendingRodIds.filter((id) => id !== rodId),
    });
    return;
  }

  const restored = lastReconciledSnapshot.playerRods[rodId];
  const nextRods = { ...current.playerRods };
  if (restored) {
    nextRods[rodId] = restored;
  } else {
    delete nextRods[rodId];
  }

  commit({
    ...current,
    playerRods: nextRods,
    parts: lastReconciledSnapshot.parts,
    storedWonder: lastReconciledSnapshot.storedWonder,
    equippedRodId: lastReconciledSnapshot.equippedRodId,
    pendingRodIds: current.pendingRodIds.filter((id) => id !== rodId),
  });
}

export function clearPendingRod(rodId: FishingRodId): void {
  if (!current.pendingRodIds.includes(rodId)) return;
  commit({
    ...current,
    pendingRodIds: current.pendingRodIds.filter((id) => id !== rodId),
  });
}

export function setRodProgressionError(message: string | null): void {
  commit({ ...current, lastError: message });
}

export function resetRodProgressionState(): void {
  current = { ...EMPTY_ROD_PROGRESSION };
  lastReconciledSnapshot = null;
  emit();
}

export function isRodProgressionPending(rodId: FishingRodId): boolean {
  return current.pendingRodIds.includes(rodId);
}
