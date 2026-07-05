import type { FirebaseApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { createAsyncStorage } from "@react-native-async-storage/async-storage";

/** Native: persist auth in AsyncStorage (avoids memory-only default). */
export function createFirebaseAuth(app: FirebaseApp, reuseExisting: boolean) {
  if (reuseExisting) {
    return getAuth(app);
  }

  return initializeAuth(app, {
    persistence: getReactNativePersistence(createAsyncStorage("firebase-auth")),
  });
}
