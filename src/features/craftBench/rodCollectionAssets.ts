import type { ImageSourcePropType } from "react-native";

import type { FishingRodId } from "@/shared/sanctuary/types";

/** Transparent rod ceremony art (black background removed). */
const ROD_COLLECTION_ART: Partial<Record<FishingRodId, ImageSourcePropType>> = {
  rare_fire: require("@/assets/Craft bench/rod-collection/rare_fire.png"),
  rare_water: require("@/assets/Craft bench/rod-collection/rare_water.png"),
  rare_wind: require("@/assets/Craft bench/rod-collection/rare_wind.png"),
  rare_electric: require("@/assets/Craft bench/rod-collection/rare_electric.png"),
  rare_wildcard: require("@/assets/Craft bench/rod-collection/rare_wildcard.png"),
};

const EPIC_TO_RARE_ELEMENT: Partial<Record<FishingRodId, FishingRodId>> = {
  epic_fire: "rare_fire",
  epic_water: "rare_water",
  epic_wind: "rare_wind",
  epic_electric: "rare_electric",
};

export function rodCollectionArtFor(rodId: FishingRodId): ImageSourcePropType {
  const direct = ROD_COLLECTION_ART[rodId];
  if (direct) return direct;

  const rarePeer = EPIC_TO_RARE_ELEMENT[rodId];
  if (rarePeer && ROD_COLLECTION_ART[rarePeer]) {
    return ROD_COLLECTION_ART[rarePeer]!;
  }

  return ROD_COLLECTION_ART.rare_fire!;
}
