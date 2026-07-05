import { getSyncCelebrationComplete } from "@/src/services/onboarding/emailVerifiedCelebrationSession";

export type CelebrationState = {
  ready: boolean;
  hasCompleted: boolean;
};

/** Session sync + hook state — shared by _layout resolver and sign-in arrival. */
export function mergeCelebrationState(
  uid: string | null,
  celebration: CelebrationState,
): CelebrationState {
  const sessionComplete = getSyncCelebrationComplete(uid);
  return {
    ready: celebration.ready || sessionComplete,
    hasCompleted: celebration.hasCompleted || sessionComplete,
  };
}
