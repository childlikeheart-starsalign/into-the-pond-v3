import type { ImageSourcePropType } from "react-native";

export const WELL_SCENE_ESTABLISHING = require("@/assets/well/well_scene_establishing.png");
export const WELL_SCENE_CLOSEUP = require("@/assets/well/well_scene_closeup.png");
export const WELL_GHOST_BLURRED = require("@/assets/well/well_ghost_blurred.png");
export const TODAYS_FOCUS_CARD = require("@/assets/well/todays_focus_card.png");
export const TODAYS_FOCUS_CARD_BACK = require("@/assets/well/todays_focus_card_back.png");
export const DEPTH_RATING_LEAF = require("@/assets/well/depth_rating_leaf.png");
export const WELL_INSIGHT_GLOW = require("@/assets/well/well_insight_glow.png");
export const WELL_ATLAS_SAVED_ICON = require("@/assets/well/well_atlas_saved_icon.png");
export const BOTANICAL_CORNER = require("@/assets/well/botanical_corner.png");
export const PARCHMENT_RITUAL_SHEET = require("@/assets/well/parchment_ritual_sheet.png");
export const CONTINUE_PLAQUE = require("@/assets/well/continue_plaque.png");
export const WELL_BIRTHDATE_CARD = require("@/assets/well/well_birthdate_card.png");

/** Decorative assets reused from gate / sanctuary-gate for birthdate gate overlays. */
export const PRESSED_LEAF = require("@/assets/gate/decorative/pressed_leaf.png");
export const IVY_HANGING = require("@/assets/sanctuary-gate/ui/08-background/ivy_hanging_segment.png");
export const WILDFLOWER_LEFT = require("@/assets/sanctuary-gate/ui/08-background/wildflower_cluster_left.png");
export const WILDFLOWER_RIGHT = require("@/assets/sanctuary-gate/ui/08-background/wildflower_cluster_right.png");

export const wellAssets = {
  sceneEstablishing: WELL_SCENE_ESTABLISHING,
  sceneCloseup: WELL_SCENE_CLOSEUP,
  ghostBlurred: WELL_GHOST_BLURRED,
  focusCardFront: TODAYS_FOCUS_CARD,
  focusCardBack: TODAYS_FOCUS_CARD_BACK,
  depthLeaf: DEPTH_RATING_LEAF,
  insightGlow: WELL_INSIGHT_GLOW,
  atlasSavedIcon: WELL_ATLAS_SAVED_ICON,
  botanicalCorner: BOTANICAL_CORNER,
  parchmentRitualSheet: PARCHMENT_RITUAL_SHEET,
  continuePlaque: CONTINUE_PLAQUE,
  birthdateCard: WELL_BIRTHDATE_CARD,
  pressedLeaf: PRESSED_LEAF,
  ivyHanging: IVY_HANGING,
  wildflowerLeft: WILDFLOWER_LEFT,
  wildflowerRight: WILDFLOWER_RIGHT,
} as const satisfies Record<string, ImageSourcePropType>;

/** Aspect ratio of extracted parchment ritual sheet art (width / height). */
export const PARCHMENT_RITUAL_SHEET_ASPECT = 436 / 220;

/** Aspect ratio of continue plaque art (width / height). */
export const CONTINUE_PLAQUE_ASPECT = 473 / 265;

/** Aspect ratio of unified birthdate card art (682 / 1024). */
export const WELL_BIRTHDATE_CARD_ASPECT = 682 / 1024;
