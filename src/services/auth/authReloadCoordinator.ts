import type { User } from "firebase/auth";

import { reloadCurrentUser } from "@/src/services/firebase/auth";
import { firebaseAuth } from "@/src/services/firebase/client";

let reloadPromise: Promise<User | null> | null = null;

/** Mutex around Firebase `reload()` — concurrent AppState + verify Refresh share one call. */
export async function reloadAuthOnce(): Promise<User | null> {
  if (reloadPromise) return reloadPromise;

  reloadPromise = (async () => {
    try {
      await reloadCurrentUser();
      return firebaseAuth.currentUser;
    } finally {
      reloadPromise = null;
    }
  })();

  return reloadPromise;
}
