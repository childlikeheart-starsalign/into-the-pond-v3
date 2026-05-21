import React, { PropsWithChildren } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";

import { colors } from "@/src/constants/theme";

const PORTRAIT_916_ASPECT = 9 / 16; // width / height

type Portrait916FrameProps = PropsWithChildren<{
  backgroundColor?: string;
}>;

/**
 * Centers a 9:16 rectangle on screen, filling the device background with
 * backgroundColor (warm bars on non-9:16 screens).
 *
 * Uses explicit absolute positioning so it works regardless of the parent
 * flex chain — the only requirement is that parents allow the screen to fill
 * (i.e. are flex: 1 or stretch).
 */
export function Portrait916Frame({ children, backgroundColor = colors.bg }: Portrait916FrameProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  let frameWidth: number;
  let frameHeight: number;

  if (windowWidth > 0 && windowHeight > 0) {
    const windowAspect = windowWidth / windowHeight;
    if (windowAspect > PORTRAIT_916_ASPECT) {
      // Wider than 9:16 → pillarbox: constrain by height
      frameHeight = windowHeight;
      frameWidth = frameHeight * PORTRAIT_916_ASPECT;
    } else {
      // Taller / exact 9:16 → constrain by width
      frameWidth = windowWidth;
      frameHeight = frameWidth / PORTRAIT_916_ASPECT;
      // Never taller than the window (safety clamp for exact 9:16 screens)
      if (frameHeight > windowHeight) {
        frameHeight = windowHeight;
        frameWidth = frameHeight * PORTRAIT_916_ASPECT;
      }
    }
  } else {
    frameWidth = windowWidth || 0;
    frameHeight = windowHeight || 0;
  }

  const left = (windowWidth - frameWidth) / 2;
  const top = (windowHeight - frameHeight) / 2;

  return (
    // Full-screen backdrop with the warm background colour
    <View style={[StyleSheet.absoluteFill, { backgroundColor }]}>
      {/* Exactly-sized 9:16 box, centred */}
      <View
        style={{
          position: "absolute",
          left,
          top,
          width: frameWidth,
          height: frameHeight,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}
