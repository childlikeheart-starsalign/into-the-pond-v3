import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { colors } from "@/src/constants/theme";

export type NarrativeProgressDotsProps = {
  currentStep: number;
  totalSteps: number;
  activeColor?: string;
  inactiveColor?: string;
  style?: ViewStyle;
};

/**
 * Composable progress-dot row for narrative scenes.
 * Drop in as-is or replace entirely via NarrativeStepView's renderProgress prop.
 */
export function NarrativeProgressDots({
  currentStep,
  totalSteps,
  activeColor = colors.primary,
  inactiveColor = colors.border,
  style,
}: NarrativeProgressDotsProps) {
  // ANIMATION PLACEHOLDER: wrap each dot in Animated.View to scale/fade on step change.
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        // ANIMATION PLACEHOLDER: per-dot entrance animation (stagger fade-in on mount).
        <View
          key={i}
          style={[styles.dot, { backgroundColor: i <= currentStep ? activeColor : inactiveColor }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
