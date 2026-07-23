import type { ImageStyle, ViewStyle } from "react-native";

import type { HeaderCompositeSlot } from "@/src/features/sanctuary/sanctuaryHeaderLayout";

export function compositeSlotStyle(slot: HeaderCompositeSlot): ViewStyle {
  return slot.style as ViewStyle;
}

export function absoluteImageStyle(rect: {
  left: number;
  top: number;
  width: number;
  height: number;
}): ImageStyle {
  return {
    position: "absolute",
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}
