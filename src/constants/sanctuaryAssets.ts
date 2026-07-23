import type { ImageSourcePropType } from "react-native";

import type { IllustratedTabId } from "@/src/constants/illustratedTabBar";

/** Time-of-day variants for sanctuary background art (576×1024). */
export type SanctuaryTimeOfDay = "morning" | "afternoon" | "lateAfternoon" | "night";

export const SANCTUARY_TIME_OF_DAY_ORDER: SanctuaryTimeOfDay[] = [
  "morning",
  "afternoon",
  "lateAfternoon",
  "night",
];

/** Human-readable time-of-day for journal margin / header furniture. */
export function formatSanctuaryTimeOfDayLabel(timeOfDay: SanctuaryTimeOfDay): string {
  if (timeOfDay === "morning") return "Morning";
  if (timeOfDay === "afternoon") return "Afternoon";
  if (timeOfDay === "lateAfternoon") return "Late afternoon";
  return "Night";
}

/** Avatar pose keys cycled in SanctuaryAvatar. */
export const SANCTUARY_AVATAR_POSES = ["standing", "sitting", "fishing", "fishingLeft"] as const;
export type SanctuaryAvatarPose = (typeof SANCTUARY_AVATAR_POSES)[number];

export type SanctuaryNavIconSet = {
  default: ImageSourcePropType;
  active: ImageSourcePropType;
};

export type SanctuaryAvatarPoseAsset = {
  source: ImageSourcePropType;
  /** Normalized bbox of the visible avatar within the 9:16 artboard. */
  hitRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

/**
 * Single manifest for all sanctuary screen PNG assets.
 * Backgrounds, avatar poses, and bottom-nav icons.
 */
export const sanctuaryAssets = {
  backgrounds: {
    morning: require("@/assets/images/sanctuary/Morning:background.png"),
    afternoon: require("@/assets/images/sanctuary/Afternoon:background.png"),
    lateAfternoon: require("@/assets/images/sanctuary/late_afternoon:background.png"),
    night: require("@/assets/images/sanctuary/night:background.png"),
  },
  moodOverlays: {
    morning: require("@/assets/images/sanctuary/frame-61.png"),
    afternoon: require("@/assets/images/sanctuary/frame-62.png"),
    lateAfternoon: require("@/assets/images/sanctuary/frame-63.png"),
    night: require("@/assets/images/sanctuary/frame-60.png"),
  },
  avatarPoses: {
    standing: {
      source: require("@/assets/images/Avatar_poses/avatar_standing.png"),
      hitRect: { left: 0.3963, top: 0.4854, width: 0.1019, height: 0.2219 },
    },
    sitting: {
      source: require("@/assets/images/Avatar_poses/avatar_sitting.png"),
      hitRect: { left: 0.6935, top: 0.4609, width: 0.0833, height: 0.0953 },
    },
    fishing: {
      source: require("@/assets/images/Avatar_poses/avatar_fishing.png"),
      hitRect: { left: 0.6037, top: 0.3927, width: 0.2185, height: 0.2917 },
    },
    fishingLeft: {
      source: require("@/assets/images/Avatar_poses/avatar_fishing_left.png"),
      hitRect: { left: 0.3907, top: 0.4005, width: 0.2204, height: 0.2958 },
    },
  },
  navIcons: {
    net: {
      default: require("@/assets/images/sanctuary/tab-icons/nav_net.png"),
      active: require("@/assets/images/sanctuary/tab-icons/nav_net.png"),
    },
    classroom: {
      default: require("@/assets/images/sanctuary/tab-icons/nav_classroom.png"),
      active: require("@/assets/images/sanctuary/tab-icons/nav_classroom.png"),
    },
    sanctuary: {
      default: require("@/assets/images/sanctuary/tab-icons/nav_sanctuary.png"),
      active: require("@/assets/images/sanctuary/tab-icons/nav_sanctuary.png"),
    },
    store: {
      default: require("@/assets/images/sanctuary/tab-icons/nav_store.png"),
      active: require("@/assets/images/sanctuary/tab-icons/nav_store.png"),
    },
    gate: {
      default: require("@/assets/images/sanctuary/tab-icons/nav_gate.png"),
      active: require("@/assets/images/sanctuary/tab-icons/nav_gate.png"),
    },
  },
} as const satisfies {
  backgrounds: Record<SanctuaryTimeOfDay, ImageSourcePropType>;
  moodOverlays: Record<SanctuaryTimeOfDay, ImageSourcePropType>;
  avatarPoses: Record<SanctuaryAvatarPose, SanctuaryAvatarPoseAsset>;
  navIcons: Record<IllustratedTabId, SanctuaryNavIconSet>;
};

/** Ordered pose assets for cycling animation. */
export function getSanctuaryAvatarPoseAssets(): SanctuaryAvatarPoseAsset[] {
  return SANCTUARY_AVATAR_POSES.map((pose) => sanctuaryAssets.avatarPoses[pose]);
}

export function getSanctuaryBackground(timeOfDay: SanctuaryTimeOfDay): ImageSourcePropType {
  return sanctuaryAssets.backgrounds[timeOfDay];
}

export function getSanctuaryMoodOverlay(timeOfDay: SanctuaryTimeOfDay): ImageSourcePropType {
  return sanctuaryAssets.moodOverlays[timeOfDay];
}

export type SanctuaryNavTab = {
  id: IllustratedTabId;
  label: string;
  icons: SanctuaryNavIconSet;
};

export const SANCTUARY_NAV_TABS: SanctuaryNavTab[] = [
  { id: "net", label: "Fish collection", icons: sanctuaryAssets.navIcons.net },
  { id: "classroom", label: "Classroom", icons: sanctuaryAssets.navIcons.classroom },
  { id: "sanctuary", label: "Sanctuary", icons: sanctuaryAssets.navIcons.sanctuary },
  { id: "store", label: "Store", icons: sanctuaryAssets.navIcons.store },
  { id: "gate", label: "Gate", icons: sanctuaryAssets.navIcons.gate },
];
