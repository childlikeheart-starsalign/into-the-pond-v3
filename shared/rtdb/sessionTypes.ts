/** Ephemeral co-session coordination — Firestore remains canonical for profile/economy. */

export type SessionMemberRole = "parent" | "child" | "invited";

export type SessionMember = {
  role: SessionMemberRole;
  addedAt: number;
};

export type SessionPresenceState = "joined" | "left";

export type SessionPresence = {
  state: SessionPresenceState;
  ts: number;
};

export type RitualEvent = {
  type: string;
  authorUid: string;
  ts: number;
};

export type CoSessionDoc = {
  createdBy: string;
  expiresAt: number;
  members: Record<string, SessionMember>;
  presence?: Record<string, SessionPresence>;
  ritual?: Record<string, RitualEvent>;
};

export type CreateCoSessionInput = {
  sessionId: string;
  creatorUid: string;
  childUid?: string;
  /** Unix ms — must be in the future per RTDB rules */
  expiresAt: number;
};
