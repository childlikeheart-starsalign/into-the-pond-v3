import { FieldValue } from "firebase-admin/firestore";

import { db } from "../../init";

/** Append-only sanctuary analytics — shared entry point for progression events. */
export async function emitAnalytics(uid: string, event: Record<string, unknown>): Promise<void> {
  await db
    .collection("users")
    .doc(uid)
    .collection("sanctuaryAnalytics")
    .add({
      ...event,
      recordedAt: FieldValue.serverTimestamp(),
    });
}
