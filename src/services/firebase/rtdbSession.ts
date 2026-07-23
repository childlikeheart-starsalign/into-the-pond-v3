import { get, onDisconnect, push, ref, set, update } from "firebase/database";

import type {
  CreateCoSessionInput,
  RitualEvent,
  SessionMemberRole,
} from "@/shared/rtdb/sessionTypes";
import { assertRealtimeDb } from "@/src/services/firebase/realtimeDb";

/** Client refuses join/render when session TTL has passed (rules do not auto-delete). */
export function isSessionExpired(expiresAt: number, now = Date.now()): boolean {
  return expiresAt <= now;
}

/**
 * Create a co-session in one atomic write.
 * createdBy, members (self included), and expiresAt must be written together — RTDB rules reject multi-step create.
 */
export async function createCoSession(input: CreateCoSessionInput): Promise<void> {
  const db = assertRealtimeDb();
  const { sessionId, creatorUid, childUid, expiresAt } = input;
  const now = Date.now();

  if (isSessionExpired(expiresAt, now)) {
    throw new Error("expiresAt must be in the future.");
  }

  const members: Record<string, { role: SessionMemberRole; addedAt: number }> = {
    [creatorUid]: { role: "parent", addedAt: now },
  };
  if (childUid) {
    members[childUid] = { role: "child", addedAt: now };
  }

  await set(ref(db, `sessions/${sessionId}`), {
    createdBy: creatorUid,
    expiresAt,
    members,
  });
}

/** Existing member adds another uid under members/{newUid}. */
export async function addSessionMember(
  sessionId: string,
  newUid: string,
  role: SessionMemberRole,
): Promise<void> {
  const db = assertRealtimeDb();
  await update(ref(db, `sessions/${sessionId}/members/${newUid}`), {
    role,
    addedAt: Date.now(),
  });
}

/** Self-write session presence with onDisconnect cleanup on own leaf only. */
export async function writeSessionPresence(sessionId: string, uid: string): Promise<void> {
  const db = assertRealtimeDb();
  const presenceRef = ref(db, `sessions/${sessionId}/presence/${uid}`);
  const ts = Date.now();
  await set(presenceRef, { state: "joined", ts });
  await onDisconnect(presenceRef).set({ state: "left", ts: Date.now() });
}

/** Member appends a ritual coordination event (not system of record). */
export async function appendRitualEvent(
  sessionId: string,
  authorUid: string,
  type: string,
): Promise<string> {
  const db = assertRealtimeDb();
  const ritualRef = push(ref(db, `sessions/${sessionId}/ritual`));
  const event: RitualEvent = {
    type,
    authorUid,
    ts: Date.now(),
  };
  await set(ritualRef, event);
  return ritualRef.key ?? "";
}
