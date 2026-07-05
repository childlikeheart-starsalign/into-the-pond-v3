import { getRodProgression } from "@/src/services/firebase/serverActions";
import { subscribeRodProgression } from "@/src/services/firebase/playerRods";
import { firebaseAuth } from "@/src/services/firebase/client";
import { completeSanctuaryInit } from "@/src/services/auth/completeSanctuaryInit";
import {
  loadPersistedRodProgression,
  persistRodProgression,
} from "@/src/state/rodProgressionPersistence";
import {
  hydrateRodProgressionSnapshot,
  resetRodProgressionState,
  setRodProgressionSnapshot,
  setUserDocStatus,
  type RodProgressionSnapshot,
} from "@/src/state/rodProgressionStore";

let activeUid: string | null = null;
let subscriberCount = 0;
let firestoreUnsub: (() => void) | null = null;

function applyServerReconcile(snapshot: RodProgressionSnapshot): void {
  setRodProgressionSnapshot(snapshot);
  if (activeUid) {
    void persistRodProgression(activeUid, snapshot);
  }
}

async function coldStartHydrate(uid: string): Promise<void> {
  const persisted = await loadPersistedRodProgression(uid);
  if (persisted) {
    hydrateRodProgressionSnapshot(persisted);
  }
}

async function triggerServerReconcile(uid: string): Promise<void> {
  try {
    const result = await getRodProgression(uid);
    const snapshot: RodProgressionSnapshot = {
      playerRods: result.playerRods as RodProgressionSnapshot["playerRods"],
      parts: result.parts,
      storedWonder: result.storedWonder,
    };
    applyServerReconcile(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load rod progression";
    setUserDocStatus("error", message);
  }
}

function startFirestoreListener(uid: string): void {
  setUserDocStatus("pending");
  firestoreUnsub?.();
  firestoreUnsub = subscribeRodProgression(uid);
}

function stopSync(): void {
  firestoreUnsub?.();
  firestoreUnsub = null;
  activeUid = null;
  resetRodProgressionState();
}

/**
 * Single app-wide reconciler for rod progression. Reference-counted so Craft Bench
 * and Fishing can mount without duplicate Firestore listeners.
 */
export function acquireRodProgressionSync(uid: string): void {
  if (activeUid && activeUid !== uid) {
    stopSync();
  }

  activeUid = uid;
  subscriberCount += 1;

  if (subscriberCount === 1) {
    void (async () => {
      await coldStartHydrate(uid);
      startFirestoreListener(uid);
      await triggerServerReconcile(uid);
    })();
  }
}

export function releaseRodProgressionSync(uid: string): void {
  if (activeUid !== uid) return;
  subscriberCount = Math.max(0, subscriberCount - 1);
  if (subscriberCount === 0) {
    stopSync();
  }
}

/** Re-trigger profile creation, then re-attach the Firestore listener. */
export async function retryRodProgressionUserDoc(uid: string): Promise<void> {
  if (activeUid !== uid) return;
  const user = firebaseAuth.currentUser;
  if (!user || user.uid !== uid) {
    throw new Error("Sign in required");
  }
  setUserDocStatus("pending");
  const initResult = await completeSanctuaryInit();
  if (initResult.status === "error") {
    throw new Error(initResult.message);
  }
  if (initResult.status === "not_verified") {
    throw new Error("Email not verified");
  }
  startFirestoreListener(uid);
}

/** Re-attach the Firestore listener after a listener/network error. */
export function reattachRodProgressionListener(uid: string): void {
  if (activeUid !== uid) return;
  startFirestoreListener(uid);
}
