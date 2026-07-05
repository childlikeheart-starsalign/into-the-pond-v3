import AsyncStorage from "@react-native-async-storage/async-storage";

import { getDocument, setDocument } from "@/src/services/firebase/firestore";
import type { UserDoc } from "@/src/services/firebase/types";
import {
  clearCelebrationSessionComplete,
  getSyncCelebrationComplete,
  markCelebrationSessionComplete,
} from "@/src/services/onboarding/emailVerifiedCelebrationSession";

export {
  clearCelebrationSessionComplete,
  getSyncCelebrationComplete,
  markCelebrationSessionComplete,
} from "@/src/services/onboarding/emailVerifiedCelebrationSession";

const CELEBRATION_CACHE_PREFIX = "@itp/email-verified-celebration-complete-v1";

function cacheKey(uid: string): string {
  return `${CELEBRATION_CACHE_PREFIX}:${uid}`;
}

export async function readCelebrationCache(uid: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(uid));
    return raw === "1";
  } catch {
    return false;
  }
}

export async function writeCelebrationCache(uid: string, completed: boolean): Promise<void> {
  try {
    if (completed) {
      await AsyncStorage.setItem(cacheKey(uid), "1");
    } else {
      await AsyncStorage.removeItem(cacheKey(uid));
    }
  } catch {
    /* non-fatal */
  }
}

export async function readCelebrationFromFirestore(uid: string): Promise<boolean> {
  try {
    const doc = await getDocument<UserDoc>("users", uid);
    return doc?.hasCompletedEmailVerifiedCelebration === true;
  } catch {
    return false;
  }
}

export async function markEmailVerifiedCelebrationComplete(uid: string): Promise<void> {
  markCelebrationSessionComplete(uid);
  await writeCelebrationCache(uid, true);
  try {
    await setDocument("users", uid, { hasCompletedEmailVerifiedCelebration: true });
  } catch {
    /* profile doc may not exist yet — cache is sufficient until Enter ensures profile */
  }
}
