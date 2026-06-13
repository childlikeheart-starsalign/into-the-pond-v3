import type { PropsWithChildren } from "react";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { gatePercentRectStyle, type GateNormRect } from "@/src/features/gate/gateCardLayout";

type GateCardZoneProps = PropsWithChildren<{
  rect: GateNormRect;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: "box-none" | "none" | "auto" | "box-only";
}> &
  Pick<ViewProps, "accessibilityLabel" | "accessibilityRole">;

/** Absolutely positions children inside a gate card template zone. */
export function GateCardZone({
  rect,
  style,
  pointerEvents = "box-none",
  accessibilityLabel,
  accessibilityRole,
  children,
}: GateCardZoneProps) {
  return (
    <View
      style={[gatePercentRectStyle(rect), style]}
      pointerEvents={pointerEvents}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </View>
  );
}
