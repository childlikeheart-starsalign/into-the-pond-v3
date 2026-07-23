/**
 * Shared Part 2 routing inputs for resolveAuthenticatedDestination.
 * Used by app/_layout.tsx and email-verified Enter handoff.
 *
 * Note: hasCompletedDay1Narrative remains client-writable (legacy). Treat as
 * UX routing only — prologue seal is hasCompletedPrologueOnboarding (server-only).
 */
export type NewOnboardingRoutingInput = {
  newOnboardingEnabled: boolean;
  hasCompletedDay1Narrative: boolean;
  hasCompletedPrologueOnboarding: boolean;
  /**
   * When > 0, Part 2 routing gate clears — a child is already sealed.
   * Prevents trapping users on /prologue-continuation after prepare hit CHILD_LIMIT.
   */
  existingChildCount?: number;
};

export type NewOnboardingRoutingState = {
  legacyComplete: boolean;
  needsContinuation: boolean;
};

export function resolveNewOnboardingRouting(
  input: NewOnboardingRoutingInput,
): NewOnboardingRoutingState {
  const legacyComplete = input.hasCompletedDay1Narrative || input.hasCompletedPrologueOnboarding;
  const existingChildCount = input.existingChildCount ?? 0;
  const needsContinuation =
    input.newOnboardingEnabled && !legacyComplete && existingChildCount === 0;
  return { legacyComplete, needsContinuation };
}
