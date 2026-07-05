import type { Router } from "expo-router";

import {
  resolveAuthenticatedDestination,
  type AuthDestinationInput,
} from "@/src/navigation/resolveAuthenticatedDestination";
import { postAuthBreathMoment } from "@/src/navigation/postAuthBreathMoment";
import { completeSanctuaryInitWithLegacyFallback } from "@/src/services/auth/completeSanctuaryInit";
import { firebaseAuth } from "@/src/services/firebase/client";
import { markEmailVerifiedCelebrationComplete } from "@/src/services/onboarding/emailVerifiedCelebrationStorage";

/**
 * Enter flow after email verification: init sanctuary, then commit celebration flag, then resolve route.
 * Throws on init failure — caller stays on email-verified with retry UX.
 */
export async function navigateAfterEmailVerified(
  router: Router,
  ctx: AuthDestinationInput,
): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user) {
    throw new Error("Not signed in");
  }

  const initResult = await completeSanctuaryInitWithLegacyFallback(user.uid);
  if (initResult.status === "not_verified") {
    throw new Error("Email not verified yet");
  }
  if (initResult.status === "error") {
    throw new Error(initResult.message);
  }

  await markEmailVerifiedCelebrationComplete(user.uid);

  const destination = resolveAuthenticatedDestination({
    ...ctx,
    sanctuaryInitialized: true,
    celebration: { ready: true, hasCompleted: true },
  });

  if (destination) {
    await postAuthBreathMoment();
    router.replace(destination);
  }
}
