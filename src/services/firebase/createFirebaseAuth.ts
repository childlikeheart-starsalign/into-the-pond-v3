import type { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/** Web/default: browser auth uses built-in persistence. */
export function createFirebaseAuth(app: FirebaseApp, reuseExisting: boolean) {
  return getAuth(app);
}
