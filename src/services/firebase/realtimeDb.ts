import { get, onDisconnect, ref, remove, set } from "firebase/database";

import { firebaseAuth, realtimeDb } from "@/src/services/firebase/client";

/** RTDB is optional until EXPO_PUBLIC_FIREBASE_DATABASE_URL is set. */
export function getRealtimeDbOrNull() {
  return realtimeDb;
}

export function assertRealtimeDb() {
  if (!realtimeDb) {
    throw new Error(
      "Realtime Database is not configured. Set EXPO_PUBLIC_FIREBASE_DATABASE_URL in .env and restart Metro.",
    );
  }
  return realtimeDb;
}

/**
 * Authenticated dev smoke test — writes `_dev/{uid}/ping` scoped by RTDB rules.
 * Call after sign-in when verifying Console + rules + env wiring.
 */
export async function pingRealtimeDb(): Promise<{ ok: true; at: number }> {
  const db = assertRealtimeDb();
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) {
    throw new Error("pingRealtimeDb requires a signed-in user.");
  }

  const pingRef = ref(db, `_dev/${uid}/ping`);
  const at = Date.now();
  await set(pingRef, { ok: true, at });
  const snap = await get(pingRef);
  if (!snap.exists()) {
    throw new Error("pingRealtimeDb read-back was empty.");
  }
  await remove(pingRef);
  return { ok: true, at };
}

/**
 * Online presence at `/presence/{uid}` with automatic cleanup on disconnect.
 * Not wired to any screen yet — Firestore remains canonical for profile/game data.
 */
export async function setPresenceOnline(online: boolean): Promise<void> {
  const db = assertRealtimeDb();
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) return;

  const presenceRef = ref(db, `presence/${uid}`);
  if (online) {
    const lastSeen = Date.now();
    await set(presenceRef, { state: "online", lastSeen });
    await onDisconnect(presenceRef).set({ state: "offline", lastSeen: Date.now() });
    return;
  }
  await remove(presenceRef);
}
