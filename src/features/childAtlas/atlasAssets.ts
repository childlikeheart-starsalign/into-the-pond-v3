import type { ImageSourcePropType } from "react-native";

import type { DiscoveryCategory } from "@/shared/sanctuary/well/types";

export const ATLAS_ENTRY_CARDS: Record<DiscoveryCategory, ImageSourcePropType> = {
  curiosity: require("@/assets/child-atlas/entry-cards/curiosity.png"),
  worries: require("@/assets/child-atlas/entry-cards/worries.png"),
  excitement: require("@/assets/child-atlas/entry-cards/excitement.png"),
  interests: require("@/assets/child-atlas/entry-cards/interests.png"),
  emotional: require("@/assets/child-atlas/entry-cards/emotional.png"),
  social: require("@/assets/child-atlas/entry-cards/social.png"),
  identity: require("@/assets/child-atlas/atlas_entry_card_bg.png"),
  imagination: require("@/assets/child-atlas/entry-cards/imagination.png"),
};

export const ATLAS_WORRIES_VARIANT = require("@/assets/child-atlas/entry-cards/worries_variant.png");
export const ATLAS_PAPER_TEXTURE = require("@/assets/child-atlas/paper_texture.png");
export const ATLAS_TOPO = require("@/assets/child-atlas/topo_contours.png");
export const ATLAS_EMPTY_TRAIL = require("@/assets/child-atlas/empty_trail.png");
export const ATLAS_WAVY_DIVIDER = require("@/assets/child-atlas/wavy_divider.png");

export const ATLAS_CATEGORY_ICONS: Record<DiscoveryCategory, ImageSourcePropType> = {
  curiosity: require("@/assets/child-atlas/icons/curiosity.png"),
  worries: require("@/assets/child-atlas/icons/worries.png"),
  excitement: require("@/assets/child-atlas/icons/excitement.png"),
  interests: require("@/assets/child-atlas/icons/interests.png"),
  emotional: require("@/assets/child-atlas/icons/emotional.png"),
  social: require("@/assets/child-atlas/icons/social.png"),
  identity: require("@/assets/child-atlas/icons/identity.png"),
  imagination: require("@/assets/child-atlas/icons/imagination.png"),
};

export const ALL_DISCOVERY_CATEGORIES: DiscoveryCategory[] = [
  "curiosity",
  "worries",
  "excitement",
  "interests",
  "emotional",
  "social",
  "identity",
  "imagination",
];
