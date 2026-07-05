import * as SplashScreen from "expo-splash-screen";

let hidden = false;

/** Hide the native splash once; safe to call from multiple boot paths. */
export async function hideAppSplashOnce(): Promise<void> {
  if (hidden) return;
  hidden = true;
  await SplashScreen.hideAsync();
}

export function isAppSplashHidden(): boolean {
  return hidden;
}
