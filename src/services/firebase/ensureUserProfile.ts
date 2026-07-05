import type { User } from "firebase/auth";

import { getDocument } from "@/src/services/firebase/firestore";

function isFirestoreOfflineError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  return code === "unavailable" || code === "failed-precondition";
}

/**
 * @deprecated Client-side profile creation is replaced by `initializeSanctuary` callable.
 * Retained for read-only existence checks during migration.
 */
export async function ensureUserProfileDocument(user: User): Promise<void> {
  const { uid } = user;
  try {
    const existing = await getDocument("users", uid);
    if (existing) return;
    throw new Error("User profile not initialized — complete sanctuary init first.");
  } catch (error) {
    if (isFirestoreOfflineError(error)) {
      return;
    }
    throw error;
  }
}
