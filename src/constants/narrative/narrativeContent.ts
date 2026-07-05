/**
 * Single source of truth for all UI copy in the narrative onboarding flow.
 * Swap any string here without touching logic, hooks, or layout files.
 */
export const narrativeContent = {
  /** Copy rendered inside individual narrative scene views. */
  scene: {
    /** Bottom hint shown on every paragraph except the last. */
    tapHintContinue: "Tap to continue",
    /** Bottom hint shown on the final paragraph of the whole flow. */
    tapHintComplete: "Tap to enter the garden",
  },

  /** Copy used on the archetype selection screen. */
  archetypeSelector: {
    headline: "Tell us about your child",
    subtext: "Which pattern do you recognise most right now?",
    reassurance: "You can explore all paths later. This just helps us start in the right place.",
  },

  childBirthDate: {
    headline: "When were they born?",
    subtext:
      "Month and year are enough. This helps the Well choose questions that fit your child's age.",
    reassurance: "You can update this later in settings.",
    continueLabel: "Continue",
    errorInvalid: "Please choose a valid month and year.",
    errorSyncFailed: "Couldn't save your answer. Check your connection and try again.",
    errorTooYoung: "Into the Pond is designed for children ages 4–12.",
    errorTooOld: "Into the Pond is designed for children ages 4–12.",
    wellGateHeadline: "Before the Well can speak",
    wellGateSubtext: "We need to know your child's age so the questions fit where they are now.",
  },

  /** Human-readable scene names — useful for accessibility labels and analytics. */
  sceneNames: {
    scene1: "The Finding",
    scene2: "The Child Who Follows",
    scene3: "The First Question",
    scene4: "The Others",
    scene5: "The Path Forward",
    scene6: "The Quiet Exit",
  },
} as const;
