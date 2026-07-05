import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import { CARD_FLIP_SWIPE_THRESHOLD_PX } from "@/src/features/well/cardFlipAnimation";

type UseCardFlipGestureOptions = {
  enabled: boolean;
  onFlipRequest: () => void;
};

/**
 * Tap anywhere on the card or horizontal swipe (left/right) after threshold.
 * Does not rotate during drag — only commits flip on release.
 */
export function useCardFlipGesture({ enabled, onFlipRequest }: UseCardFlipGestureOptions) {
  return useMemo(
    () =>
      Gesture.Exclusive(
        Gesture.Pan()
          .enabled(enabled)
          .maxPointers(1)
          .activeOffsetX([-12, 12])
          .failOffsetY([-24, 24])
          .onEnd((event) => {
            if (Math.abs(event.translationX) >= CARD_FLIP_SWIPE_THRESHOLD_PX) {
              runOnJS(onFlipRequest)();
            }
          }),
        Gesture.Tap()
          .enabled(enabled)
          .maxDuration(250)
          .onEnd(() => {
            runOnJS(onFlipRequest)();
          }),
      ),
    [enabled, onFlipRequest],
  );
}
