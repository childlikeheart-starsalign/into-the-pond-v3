import React, { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "@/src/constants/theme";
import { usePortrait916Layout } from "@/src/hooks/usePortrait916Layout";

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
  const { width, height, left, top } = usePortrait916Layout();

  return (
    // Full-screen backdrop with the warm background colour
    <View style={[StyleSheet.absoluteFill, { backgroundColor }]}>
      {/* Exactly-sized 9:16 box, centred */}
      <View
        style={{
          position: "absolute",
          left,
          top,
          width,
          height,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}
