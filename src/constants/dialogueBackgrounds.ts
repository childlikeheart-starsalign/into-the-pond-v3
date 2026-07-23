import type { ImageSourcePropType } from "react-native";

import { sanctuaryAssets } from "@/src/constants/sanctuaryAssets";

export type SceneBackgroundKey = "kitchen_argument" | "sanctuary";

export const DIALOGUE_BACKGROUNDS: Record<SceneBackgroundKey, ImageSourcePropType> = {
  kitchen_argument: require("../../assets/images/dialogue/kitchen-argument.png"),
  sanctuary: sanctuaryAssets.backgrounds.afternoon,
};
