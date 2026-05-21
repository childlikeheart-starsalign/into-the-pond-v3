import React from "react";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";

import { narrativeContent } from "@/src/constants/narrative/narrativeContent";
import { colors, fontFamilies } from "@/src/constants/theme";

export type NarrativeTapHintProps = {
  isLastStep: boolean;
  style?: StyleProp<TextStyle>;
  /** Override the "continue" copy pulled from narrativeContent. */
  continueCopy?: string;
  /** Override the "complete" copy pulled from narrativeContent. */
  completeCopy?: string;
};

/**
 * Composable "tap to continue / enter the garden" hint label.
 * Swap copy via props or globally via narrativeContent.
 */
export function NarrativeTapHint({
  isLastStep,
  style,
  continueCopy = narrativeContent.scene.tapHintContinue,
  completeCopy = narrativeContent.scene.tapHintComplete,
}: NarrativeTapHintProps) {
  // ANIMATION PLACEHOLDER: fade/pulse this label in on each paragraph transition.
  return <Text style={[styles.hint, style]}>{isLastStep ? completeCopy : continueCopy}</Text>;
}

const styles = StyleSheet.create({
  hint: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    color: colors.textSecondary,
    opacity: 0.7,
  },
});
