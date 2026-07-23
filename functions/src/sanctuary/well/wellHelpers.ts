import { Timestamp, type Transaction } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import { db } from "../../init";
import type { AgeBand } from "./types";
import { WELL_QUESTION_BY_ID } from "./catalog";

const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function requireUid(authUid: string | undefined): string {
  if (!authUid) throw new HttpsError("unauthenticated", "Authentication required");
  return authUid;
}

export function parseLocalDate(localDate: unknown): string | null {
  if (typeof localDate !== "string") return null;
  const trimmed = localDate.trim();
  if (!LOCAL_DATE_RE.test(trimmed)) return null;
  return trimmed;
}

export function wellStateRef(uid: string, childId?: string | null) {
  if (childId) {
    return db.doc(`users/${uid}/children/${childId}/wellState/current`);
  }
  return db.doc(`users/${uid}/wellState/current`);
}

export function childAtlasCollectionRef(uid: string, childId?: string | null) {
  if (childId) {
    return db.collection(`users/${uid}/children/${childId}/childAtlas`);
  }
  return db.collection(`users/${uid}/childAtlas`);
}

export function childDocRef(uid: string, childId: string) {
  return db.doc(`users/${uid}/children/${childId}`);
}

export function userRef(uid: string) {
  return db.doc(`users/${uid}`);
}

/** Optional childId from callable payload — never invents one. */
export function parseOptionalChildId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Dual-read birth date: prefer children/{childId}.dob when present, else legacy root.
 * Economy paths are untouched.
 */
export async function resolveBirthDateForWell(
  tx: Transaction,
  uid: string,
  childId?: string | null,
): Promise<string | null> {
  if (childId) {
    const childSnap = await tx.get(childDocRef(uid, childId));
    const dob = childSnap.data()?.dob;
    if (typeof dob === "string" && dob.trim()) return dob.trim();
  }
  const userSnap = await tx.get(userRef(uid));
  const legacy = userSnap.data()?.childBirthDate;
  return typeof legacy === "string" && legacy.trim() ? legacy.trim() : null;
}

export async function recordWellAnalytics(
  uid: string,
  event: Record<string, unknown>,
): Promise<void> {
  await userRef(uid)
    .collection("sanctuaryAnalytics")
    .add({
      ...event,
      userId: uid,
      channel: "well",
      timestamp: Date.now(),
      recordedAt: Timestamp.now(),
    });
}

export function logStaleAgeBandSubmission(
  uid: string,
  questionId: string,
  expectedBand: AgeBand,
): void {
  const question = WELL_QUESTION_BY_ID[questionId];
  void recordWellAnalytics(uid, {
    type: "well_stale_age_band_submission",
    questionId,
    expectedBand,
    actualBand: question?.ageBand,
  });
}
