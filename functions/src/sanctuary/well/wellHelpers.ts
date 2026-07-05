import { Timestamp } from "firebase-admin/firestore";
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

export function wellStateRef(uid: string) {
  return db.doc(`users/${uid}/wellState/current`);
}

export function userRef(uid: string) {
  return db.doc(`users/${uid}`);
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
