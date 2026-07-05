import type { ImageSourcePropType } from "react-native";

import type { IllustratedTabId } from "@/src/constants/illustratedTabBar";

/** Reference artboard for sanctuary backgrounds (576×1024). */
export const SANCTUARY_ARTBOARD_WIDTH = 576;
export const SANCTUARY_ARTBOARD_HEIGHT = 1024;

/**
 * Parchment strip height on the reference artboard (from processed asset: 109px).
 * Regenerate via: node scripts/process_sanctuary_tab_bar_strip.mjs
 */
export const SANCTUARY_TAB_BAR_STRIP_HEIGHT_RATIO = 109 / SANCTUARY_ARTBOARD_HEIGHT;

const stripPx = Math.round(SANCTUARY_ARTBOARD_HEIGHT * SANCTUARY_TAB_BAR_STRIP_HEIGHT_RATIO);
const iconFootprintPx = Math.round(SANCTUARY_ARTBOARD_HEIGHT * 0.0465) + 72;

/** Scroll clearance on tab screens that overlay the parchment strip. */
export const SANCTUARY_TAB_BAR_CLEARANCE_PX = Math.max(stripPx, iconFootprintPx);

export const sanctuaryTabBarStrip =
  require("@/assets/images/sanctuary/sanctuary_tab_bar_strip.png") as ImageSourcePropType;

export type SanctuaryNavIconLayout = {
  centerX: `${number}%`;
  centerBottom: `${number}%`;
};

/** Icon centers on the 9:16 sanctuary artboard — shared by Sanctuary and off-sanctuary overlays. */
export const NAV_ICON_LAYOUT: Record<IllustratedTabId, SanctuaryNavIconLayout> = {
  net: { centerX: "21.3%", centerBottom: "4.65%" },
  classroom: { centerX: "35.3%", centerBottom: "4.65%" },
  sanctuary: { centerX: "49.9%", centerBottom: "4.65%" },
  gate: { centerX: "64.7%", centerBottom: "4.65%" },
  store: { centerX: "77.8%", centerBottom: "4.65%" },
};
