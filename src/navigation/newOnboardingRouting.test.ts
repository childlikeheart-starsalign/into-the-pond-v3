import assert from "node:assert/strict";

import { resolveNewOnboardingRouting } from "./newOnboardingRouting";

export function runNewOnboardingRoutingSelfTest(): void {
  assert.deepEqual(
    resolveNewOnboardingRouting({
      newOnboardingEnabled: true,
      hasCompletedDay1Narrative: false,
      hasCompletedPrologueOnboarding: false,
    }),
    { legacyComplete: false, needsContinuation: true },
    "flag on, incomplete → needs continuation",
  );

  assert.deepEqual(
    resolveNewOnboardingRouting({
      newOnboardingEnabled: true,
      hasCompletedDay1Narrative: true,
      hasCompletedPrologueOnboarding: false,
    }),
    { legacyComplete: true, needsContinuation: false },
    "Day1 legacy complete skips Part 2",
  );

  assert.deepEqual(
    resolveNewOnboardingRouting({
      newOnboardingEnabled: false,
      hasCompletedDay1Narrative: false,
      hasCompletedPrologueOnboarding: false,
    }),
    { legacyComplete: false, needsContinuation: false },
    "flag off → no continuation",
  );

  assert.deepEqual(
    resolveNewOnboardingRouting({
      newOnboardingEnabled: true,
      hasCompletedDay1Narrative: false,
      hasCompletedPrologueOnboarding: false,
      existingChildCount: 1,
    }),
    { legacyComplete: false, needsContinuation: false },
    "flag on, incomplete flags, but child exists → no continuation trap",
  );

  assert.deepEqual(
    resolveNewOnboardingRouting({
      newOnboardingEnabled: true,
      hasCompletedDay1Narrative: false,
      hasCompletedPrologueOnboarding: false,
      existingChildCount: 0,
    }),
    { legacyComplete: false, needsContinuation: true },
    "flag on, incomplete, zero children → still needs continuation",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runNewOnboardingRoutingSelfTest();
  console.log("newOnboardingRouting ok");
}
