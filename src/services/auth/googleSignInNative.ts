import { Platform, TurboModuleRegistry } from "react-native";

type GoogleSignInModule = typeof import("@react-native-google-signin/google-signin");

let cachedModule: GoogleSignInModule | null | undefined;

/** Non-throwing probe — safe on iOS and dev clients without the native binary. */
export function isGoogleSignInNativeAvailable(): boolean {
  if (Platform.OS !== "android") {
    return false;
  }
  return TurboModuleRegistry.get("RNGoogleSignin") != null;
}

/** Lazy require so login/signup screens load on iOS without RNGoogleSignin linked. */
export function getGoogleSignInModule(): GoogleSignInModule | null {
  if (!isGoogleSignInNativeAvailable()) {
    return null;
  }
  if (cachedModule !== undefined) {
    return cachedModule;
  }
  try {
    cachedModule = require("@react-native-google-signin/google-signin") as GoogleSignInModule;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}
