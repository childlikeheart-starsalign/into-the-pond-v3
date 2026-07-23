/** Native: persist auth in AsyncStorage (avoids memory-only default). */
import type { FirebaseApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function createFirebaseAuth(app: FirebaseApp, reuseExisting: boolean) {
  if (reuseExisting) {
    return getAuth(app);
  }

  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}
