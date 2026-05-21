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
