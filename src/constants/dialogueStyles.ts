import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

/**
 * Geometry tokens for DialogueOverlay — always via useWindowDimensions(),
 * never module-scope Dimensions.get.
 */
export function useDialogueLayoutTokens() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const bubbleWidth = Math.min(width - 32, 360);
    const bubbleMinHeight = Math.round(bubbleWidth * 0.42);
    const portraitSize = Math.round(Math.min(112, width * 0.28));
    const lowerUiZone = Math.round(height * 0.4);

    return {
      width,
      height,
      bubbleWidth,
      bubbleMinHeight,
      bubblePaddingH: 28,
      bubblePaddingV: 22,
      bubbleRadius: 20,
      portraitSize,
      lowerUiZone,
      textSize: 17,
      textLineHeight: 26,
      hintSize: 13,
      kitchenUiBottomPad: 24,
    };
  }, [width, height]);
}
