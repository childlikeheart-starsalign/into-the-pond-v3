import type { DiscoveryCategory } from "@/shared/sanctuary/well/types";

export const TODAYS_FOCUS_LABEL = "TODAY'S FOCUS";
export const FLIP_SWIPE_HINT = "Swipe to flip";
export const FLIP_TAP_ALT_HINT = "or tap anywhere on the card";
/** @deprecated use FLIP_SWIPE_HINT */
export const FLIP_REFLECT_HINT = "Swipe or tap to reflect →";
export const WHY_THIS_MATTERS_HEADING = "Why this matters";
export const WHY_THIS_MATTERS_FLIP_PROMPT = "Why this matters";
export const REFLECTION_GUIDANCE =
  "After you've had the conversation, capture what surprised you or what you learned.";
export const ASKED_TODAY_LABEL = "I asked this today ✓";
/** @deprecated use FLIP_REFLECT_HINT / ASKED_TODAY_LABEL */
export const FLIP_HINT = "I asked this today";
export const FLIP_BACK_HINT = "Back to question";
export const REFLECTION_HEADER = "What did you learn?";
export const REFLECTION_PLACEHOLDER = "She said something that surprised you, or didn't...";
export const REFLECTION_SAVE_LABEL = "Save to Child Atlas";
export const REFLECTION_CHAR_LIMIT = 2000;
export const HEADLINE_FIELD_LABEL = "In a few words, the discovery:";
export const HEADLINE_PLACEHOLDER = "e.g., Loves making things";
/** @deprecated use REFLECTION_SAVE_LABEL */
export const REFLECTION_SAVE_SHORT = "Save";
export const ATLAS_SAVED_LABEL = "Saved to Child Atlas";
export const REROLL_LABEL = "Try a different question";
export const DEFER_LABEL = "Save for later";
export const WELL_QUIET_LABEL = "The well is quiet for today.";
export const VIEW_ATLAS_LABEL = "View in Child Atlas";

const CATEGORY_NAMES: Record<DiscoveryCategory, string> = {
  curiosity: "Curiosity",
  worries: "Worries",
  excitement: "Excitement",
  interests: "Interests",
  emotional: "Emotional",
  social: "Social",
  identity: "Identity",
  imagination: "Imagination",
};

export function categoryLabel(category: DiscoveryCategory): string {
  return `Category: ${CATEGORY_NAMES[category]}`;
}

export function wellLoadErrorMessage(error: string | null | undefined): string {
  switch (error) {
    case "MISSING_BIRTH_DATE":
      return "Add your child's birth month and year to open the Well.";
    case "OFFLINE":
      return "You're offline. Try again when you're connected.";
    case "FUNCTIONS_UNAVAILABLE":
      return "The Well isn't available right now. Try again in a moment.";
    default:
      return "Something went wrong loading today's question.";
  }
}
