import type { ImageSourcePropType } from "react-native";

import type { DialoguePortraitKey } from "@/src/data/dialogues";

const parentPortrait = require("../../assets/images/dialogue/parent-portrait.png");
const childPortrait = require("../../assets/images/dialogue/child-portrait.png");
const spiritPortrait = require("../../assets/images/dialogue/spirit-portrait.png");

/**
 * v1 map: every emotion variant uses a single bust per character.
 * `null` portraits (narration) stay hidden in DialogueOverlay.
 */
export const DIALOGUE_PORTRAITS: Record<DialoguePortraitKey, ImageSourcePropType> = {
  parent_frustrated: parentPortrait,
  parent_tired: parentPortrait,
  child_defiant: childPortrait,
  child_hurt: childPortrait,
  child_happy: childPortrait,
  spirit_old: spiritPortrait,
  spirit_warm: spiritPortrait,
  spirit_smile: spiritPortrait,
  spirit_wise: spiritPortrait,
  spirit_pointing: spiritPortrait,
  spirit_kneeling: spiritPortrait,
};

/** Drop-shadow only via RN (not baked into PNGs). */
export const DIALOGUE_PORTRAIT_SHADOW = {
  shadowColor: "#1F1A17",
  shadowOpacity: 0.2,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} as const;
