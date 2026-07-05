import type { ImageSourcePropType } from "react-native";

/**
 * Single source of truth for rod and bait definitions.
 * isPremium: true -> locked behind paywall for free users.
 * isLecture: true -> intended for a future lesson-completion gate.
 */
export type RodTier = "basic" | "rare" | "epic";
export type FishingElement = "fire" | "water" | "wind" | "electric" | "any";

export interface FishingRod {
  id: string;
  label: string;
  tier: RodTier;
  element?: FishingElement;
  isPremium: boolean;
  asset: ImageSourcePropType;
  previewAsset: ImageSourcePropType;
}

export interface Bait {
  id: string;
  isPremium: boolean;
  isLecture: boolean;
  asset: ImageSourcePropType;
  previewAsset: ImageSourcePropType;
}

export const RODS: FishingRod[] = [
  {
    id: "basic",
    label: "Basic",
    tier: "basic",
    isPremium: false,
    asset: require("@/assets/Fishing/rods/rod_basic.png"),
    previewAsset: require("@/assets/Fishing/preview/rods/rod_basic.png"),
  },
  {
    id: "rare_1",
    label: "Rare",
    tier: "rare",
    element: "fire",
    isPremium: true,
    asset: require("@/assets/Fishing/rods/rod_rare_1.png"),
    previewAsset: require("@/assets/Fishing/preview/rods/rod_rare_1.png"),
  },
  {
    id: "rare_2",
    label: "Rare",
    tier: "rare",
    element: "water",
    isPremium: true,
    asset: require("@/assets/Fishing/rods/rod_rare_2.png"),
    previewAsset: require("@/assets/Fishing/preview/rods/rod_rare_2.png"),
  },
  {
    id: "rare_3",
    label: "Rare",
    tier: "rare",
    element: "wind",
    isPremium: true,
    asset: require("@/assets/Fishing/rods/rod_rare_3.png"),
    previewAsset: require("@/assets/Fishing/preview/rods/rod_rare_3.png"),
  },
  {
    id: "rare_4",
    label: "Rare",
    tier: "rare",
    element: "electric",
    isPremium: true,
    asset: require("@/assets/Fishing/rods/rod_rare_4.png"),
    previewAsset: require("@/assets/Fishing/preview/rods/rod_rare_4.png"),
  },
  {
    id: "rare_5",
    label: "Rare",
    tier: "rare",
    element: "any",
    isPremium: true,
    asset: require("@/assets/Fishing/rods/rod_rare_5.png"),
    previewAsset: require("@/assets/Fishing/preview/rods/rod_rare_5.png"),
  },
  {
    id: "epic_1",
    label: "Epic",
    tier: "epic",
    element: "fire",
    isPremium: true,
    asset: require("@/assets/Fishing/rods/rod_epic_1.png"),
    previewAsset: require("@/assets/Fishing/preview/rods/rod_epic_1.png"),
  },
  {
    id: "epic_2",
    label: "Epic",
    tier: "epic",
    element: "water",
    isPremium: true,
    asset: require("@/assets/Fishing/rods/rod_epic_2.png"),
    previewAsset: require("@/assets/Fishing/preview/rods/rod_epic_2.png"),
  },
  {
    id: "epic_3",
    label: "Epic",
    tier: "epic",
    element: "wind",
    isPremium: true,
    asset: require("@/assets/Fishing/rods/rod_epic_3.png"),
    previewAsset: require("@/assets/Fishing/preview/rods/rod_epic_3.png"),
  },
  {
    id: "epic_4",
    label: "Epic",
    tier: "epic",
    element: "electric",
    isPremium: true,
    asset: require("@/assets/Fishing/rods/rod_epic_4.png"),
    previewAsset: require("@/assets/Fishing/preview/rods/rod_epic_4.png"),
  },
];

export const BAITS: Bait[] = [
  {
    id: "bait_basic",
    isPremium: false,
    isLecture: false,
    asset: require("@/assets/Fishing/baits/bait_basic.png"),
    previewAsset: require("@/assets/Fishing/preview/baits/bait_basic.png"),
  },
  {
    id: "bait_mid",
    isPremium: true,
    isLecture: true,
    asset: require("@/assets/Fishing/baits/bait_mid.png"),
    previewAsset: require("@/assets/Fishing/preview/baits/bait_mid.png"),
  },
  {
    id: "bait_premium",
    isPremium: true,
    isLecture: true,
    asset: require("@/assets/Fishing/baits/bait_premium.png"),
    previewAsset: require("@/assets/Fishing/preview/baits/bait_premium.png"),
  },
];

export const DEFAULT_ROD_ID = "basic";
export const DEFAULT_BAIT_ID = "bait_basic";

export function getRodById(rodId: string | null | undefined): FishingRod {
  return RODS.find((rod) => rod.id === rodId) ?? RODS[0];
}

export function getBaitById(baitId: string | null | undefined): Bait {
  return BAITS.find((bait) => bait.id === baitId) ?? BAITS[0];
}
