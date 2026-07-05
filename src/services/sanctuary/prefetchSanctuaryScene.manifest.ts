import type { ImageSourcePropType } from "react-native";

import { CRITICAL_PREFETCH_LAYERS } from "@/src/constants/curtainLift";
import {
  getSanctuaryBackground,
  getSanctuaryMoodOverlay,
  SANCTUARY_NAV_TABS,
  sanctuaryAssets,
} from "@/src/constants/sanctuaryAssets";
import { sanctuaryTabBarStrip } from "@/src/constants/sanctuaryNavLayout";

type CriticalPrefetchLayer = (typeof CRITICAL_PREFETCH_LAYERS)[number];

export type SanctuaryPrefetchLayer = CriticalPrefetchLayer | "navIcons";

export { CRITICAL_PREFETCH_LAYERS };

export type SanctuaryPrefetchManifest = {
  background: ImageSourcePropType;
  mood: ImageSourcePropType;
  avatar: ImageSourcePropType;
  tabStrip: ImageSourcePropType;
  navIcons: ImageSourcePropType[];
};

/** Afternoon tableau assets used for sign-in curtain lift preload. */
export function getSanctuaryPrefetchManifest(): SanctuaryPrefetchManifest {
  const navIcons = SANCTUARY_NAV_TABS.flatMap((tab) => [tab.icons.default, tab.icons.active]);

  return {
    background: getSanctuaryBackground("afternoon"),
    mood: getSanctuaryMoodOverlay("afternoon"),
    avatar: sanctuaryAssets.avatarPoses.standing.source,
    tabStrip: sanctuaryTabBarStrip,
    navIcons,
  };
}
