import type { ImageSourcePropType } from "react-native";

import type { SanctuaryTimeOfDay } from "@/src/constants/sanctuaryAssets";

export interface SanctuaryHeaderContent {
  month: string;
  /** Sanctuary time-of-day for bottom journal margin. */
  timeOfDay: SanctuaryTimeOfDay;
  wonderLabel: string;
  wonderAccessibilityLabel: string;
  displayName: string;
  avatarSource?: ImageSourcePropType;
}

export interface SanctuaryHeaderActions {
  onPressSettings(): void;
  onPressAvatar?(): void;
}

export interface SanctuaryHeaderLayoutProps {
  layoutWidth: number;
  disableAnimations?: boolean;
  onArtworkLoad?(): void;
}

export interface SanctuaryHeaderProps
  extends SanctuaryHeaderContent, SanctuaryHeaderActions, SanctuaryHeaderLayoutProps {}
