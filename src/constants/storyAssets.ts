import type { ImageSourcePropType } from "react-native";

import type { SceneBackgroundKey } from "@/src/constants/dialogueBackgrounds";
import { sanctuaryAssets } from "@/src/constants/sanctuaryAssets";
import type { DialoguePortraitKey } from "@/src/data/dialogues";

export const STORY_BACKGROUNDS = {
  kitchen: require("../../assets/prologue/kitchen.webp"),
  sanctuary: sanctuaryAssets.backgrounds.afternoon,
} as const satisfies Record<string, ImageSourcePropType>;

export const STORY_PAPER_TEXTURE =
  require("../../assets/ui/paper-texture.png") as ImageSourcePropType;

/** Paper plate for interactive Part 2 input cards — center-cropped to exact card size. */
export const STORY_PAPER_INPUT_CARD =
  require("../../assets/ui/paper-input-card.png") as ImageSourcePropType;

/** Intrinsic size of STORY_PAPER_INPUT_CARD (2× points for ~420×168). */
export const STORY_PAPER_INPUT_CARD_SIZE = { width: 840, height: 336 } as const;

/** Botanical journal card — black keyed out, sized at 40% of source. */
export const STORY_JOURNAL_CARD = require("../../assets/ui/card.png") as ImageSourcePropType;

/** Intrinsic pixel size of STORY_JOURNAL_CARD after keying + 60% reduce. */
export const STORY_JOURNAL_CARD_SIZE = { width: 348, height: 211 } as const;

/** Quick Check quiz plate — black keyed out, cropped to parchment bounds. */
export const STORY_QUICK_CHECK_CARD =
  require("../../assets/ui/quick-check-card.png") as ImageSourcePropType;

/** Intrinsic pixel size of STORY_QUICK_CHECK_CARD after keying + crop. */
export const STORY_QUICK_CHECK_CARD_SIZE = { width: 869, height: 527 } as const;

/** Tall botanical plaque for lengthy Quick Check answer specimens. */
export const STORY_LONG_CARD = require("../../assets/ui/long-card.png") as ImageSourcePropType;

/** Intrinsic pixel size of STORY_LONG_CARD. */
export const STORY_LONG_CARD_SIZE = { width: 684, height: 990 } as const;

export const STORY_PORTRAITS = {
  child: require("../../assets/portraits/child.png"),
  parent: require("../../assets/portraits/parent.png"),
  spirit: require("../../assets/portraits/spirit.png"),
} as const satisfies Record<string, ImageSourcePropType>;

const PORTRAIT_KEY_MAP: Partial<Record<DialoguePortraitKey, keyof typeof STORY_PORTRAITS>> = {
  parent_frustrated: "parent",
  parent_tired: "parent",
  child_defiant: "child",
  child_hurt: "child",
  child_happy: "child",
  spirit_old: "spirit",
  spirit_warm: "spirit",
  spirit_smile: "spirit",
  spirit_wise: "spirit",
  spirit_pointing: "spirit",
  spirit_kneeling: "spirit",
};

const BACKGROUND_KEY_MAP: Record<SceneBackgroundKey, keyof typeof STORY_BACKGROUNDS> = {
  kitchen_argument: "kitchen",
  sanctuary: "sanctuary",
};

export function resolveStoryBackground(
  backgroundKey?: SceneBackgroundKey,
): ImageSourcePropType | null {
  if (!backgroundKey) return null;
  const key = BACKGROUND_KEY_MAP[backgroundKey];
  return key ? STORY_BACKGROUNDS[key] : null;
}

export function resolveStoryPortrait(
  portraitKey?: DialoguePortraitKey | null,
): ImageSourcePropType | null {
  if (!portraitKey) return null;
  const key = PORTRAIT_KEY_MAP[portraitKey];
  return key ? STORY_PORTRAITS[key] : null;
}
