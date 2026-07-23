import { FirebaseError } from "firebase/app";

import { firebaseAuth } from "@/src/services/firebase/client";

/**
 * Ensure Auth is ready and an ID token exists before httpsCallable.
 * Callables attach the token automatically; this avoids races where
 * currentUser exists in UI state but the token is not yet available.
 */
export async function ensureCallableAuth(options?: { forceRefresh?: boolean }): Promise<void> {
  await firebaseAuth.authStateReady();
  const user = firebaseAuth.currentUser;
  if (!user) {
    throw new FirebaseError("functions/unauthenticated", "Authentication required");
  }
  await user.getIdToken(options?.forceRefresh === true);
}

/**
 * Run an authenticated callable with one forced token refresh retry on
 * functions/unauthenticated (stale token / attach race).
 */
export async function withCallableAuth<T>(invoke: () => Promise<T>): Promise<T> {
  await ensureCallableAuth();
  try {
    return await invoke();
  } catch (error) {
    const code =
      error instanceof FirebaseError
        ? error.code
        : error && typeof error === "object" && "code" in error
          ? String((error as { code?: unknown }).code)
          : "";
    if (code !== "functions/unauthenticated" && code !== "unauthenticated") {
      throw error;
    }
    await ensureCallableAuth({ forceRefresh: true });
    return await invoke();
  }
}
