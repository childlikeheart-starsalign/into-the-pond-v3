import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

/**
 * Horizontal inset fractions for the Gate content corridor.
 * Keeps cards over the artwork's quiet center zone — away from window,
 * shelves, jars, and floor clusters.
 */
export const CONTENT_SAFE_LEFT = 0.2;
export const CONTENT_SAFE_RIGHT = 0.2;

/** Usable width ratio for scrollable gate UI (center ~60% corridor). */
export const CONTENT_CORRIDOR_WIDTH_RATIO = 1 - CONTENT_SAFE_LEFT - CONTENT_SAFE_RIGHT;

/** Future parallax motion inputs — defaults keep the scene stationary. */
export type ParallaxBackgroundMotion = {
  backgroundOffsetY: number;
  backgroundScale: number;
  parallaxIntensity: number;
};

export const PARALLAX_BACKGROUND_DEFAULTS: ParallaxBackgroundMotion = {
  backgroundOffsetY: 0,
  backgroundScale: 1,
  parallaxIntensity: 0,
};

/** Optional readability wash over artwork (disabled in production). */
export const GATE_AMBIENT_OVERLAY_OPACITY = 0;

export function useGateContentCorridorInsets() {
  const { width: windowWidth } = useWindowDimensions();

  return useMemo(
    () => ({
      paddingLeft: windowWidth * CONTENT_SAFE_LEFT,
      paddingRight: windowWidth * CONTENT_SAFE_RIGHT,
      corridorWidth: windowWidth * CONTENT_CORRIDOR_WIDTH_RATIO,
    }),
    [windowWidth],
  );
}
