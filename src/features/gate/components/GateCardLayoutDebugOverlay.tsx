import { StyleSheet, View } from "react-native";

import type { CardFrame, CardLayout } from "@/src/features/gate/cardLayouts";
import { frameToGridStyle } from "@/src/features/gate/components/GateCardTemplate";

type GateCardLayoutDebugOverlayProps = {
  layout: CardLayout;
  buttonSlots?: readonly CardFrame[];
};

/** Safe-area overlay debug: red=forbidden, green=text, blue=illustration, dashed=buttonFrame. */
export function GateCardLayoutDebugOverlay({
  layout,
  buttonSlots = [],
}: GateCardLayoutDebugOverlayProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {layout.forbiddenRegions.map((frame, index) => (
        <View key={`forbidden-${index}`} style={[styles.forbidden, frameToGridStyle(frame)]} />
      ))}

      <View style={[styles.illustration, frameToGridStyle(layout.illustrationFrame)]} />

      <View style={[styles.text, frameToGridStyle(layout.titleFrame)]} />
      <View style={[styles.text, frameToGridStyle(layout.descriptionFrame)]} />

      {layout.featuresFrame ? (
        <View style={[styles.text, frameToGridStyle(layout.featuresFrame)]} />
      ) : null}

      {layout.pricingFrame ? (
        <View style={[styles.text, frameToGridStyle(layout.pricingFrame)]} />
      ) : null}

      {layout.buttonFrame ? (
        <View style={[styles.button, frameToGridStyle(layout.buttonFrame)]} />
      ) : null}

      {buttonSlots.map((frame, index) => (
        <View key={`btn-slot-${index}`} style={[styles.buttonSlot, frameToGridStyle(frame)]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  forbidden: {
    position: "absolute",
    backgroundColor: "rgba(220, 80, 80, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(180, 40, 40, 0.8)",
  },
  illustration: {
    position: "absolute",
    backgroundColor: "rgba(80, 120, 220, 0.3)",
    borderWidth: 2,
    borderColor: "rgba(40, 80, 180, 0.9)",
  },
  text: {
    position: "absolute",
    backgroundColor: "rgba(80, 180, 100, 0.28)",
    borderWidth: 1,
    borderColor: "rgba(40, 120, 60, 0.85)",
  },
  button: {
    position: "absolute",
    backgroundColor: "rgba(80, 180, 100, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(40, 120, 60, 0.85)",
    borderStyle: "dashed",
  },
  buttonSlot: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(40, 120, 60, 0.6)",
    borderStyle: "dotted",
  },
});
