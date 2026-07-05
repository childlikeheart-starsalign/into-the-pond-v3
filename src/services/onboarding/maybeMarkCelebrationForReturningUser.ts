import { getDocument } from "@/src/services/firebase/firestore";
import type { UserDoc } from "@/src/services/firebase/types";
import {
  markCelebrationSessionComplete,
  markEmailVerifiedCelebrationComplete,
  readCelebrationCache,
} from "@/src/services/onboarding/emailVerifiedCelebrationStorage";

export type ReturningMarkResult = true | false | "unknown";

/**
 * Marks email-verified celebration complete for returning users only.
 * Returns "unknown" when Firestore is unavailable (offline) so arrival can retry.
 */
export async function maybeMarkCelebrationForReturningUser(
  uid: string,
): Promise<ReturningMarkResult> {
  const cached = await readCelebrationCache(uid);
  if (cached) {
    markCelebrationSessionComplete(uid);
    return true;
  }

  try {
    const doc = await getDocument<UserDoc>("users", uid);
    if (doc) {
      await markEmailVerifiedCelebrationComplete(uid);
      return true;
    }
    return false;
  } catch {
    return "unknown";
  }
}
