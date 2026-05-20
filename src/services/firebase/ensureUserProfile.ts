import type { User } from "firebase/auth";

import { getDocument, setDocument } from "@/src/services/firebase/firestore";
import { DEFAULT_USER_DOC, UserDoc } from "@/src/services/firebase/types";

/**
 * Idempotent: creates `users/{uid}` with defaults if missing.
 * Does NOT overwrite an existing document.
 *
 * Firestore rules required (deploy in Firebase Console):
 *
 *   match /users/{userId} {
 *     allow read, write: if request.auth != null && request.auth.uid == userId;
 *   }
 */
export async function ensureUserProfileDocument(user: User): Promise<void> {
  const { uid, email } = user;
  const existing = await getDocument<UserDoc>("users", uid);
  if (existing) return;

  const payload: UserDoc = {
    ...DEFAULT_USER_DOC,
    email: email ?? "",
  };

  await setDocument("users", uid, payload as unknown as Record<string, unknown>);
}
