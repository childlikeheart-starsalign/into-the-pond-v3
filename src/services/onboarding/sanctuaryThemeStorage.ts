import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_PREFIX = "@itp/sanctuary-first-reveal-theme-played-v1";

function cacheKey(uid: string): string {
  return `${STORAGE_PREFIX}:${uid}`;
}

export async function hasPlayedSanctuaryTheme(uid: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(uid));
    return raw === "1";
  } catch {
    return false;
  }
}

export async function markSanctuaryThemePlayed(uid: string): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(uid), "1");
  } catch {
    /* non-fatal */
  }
}
