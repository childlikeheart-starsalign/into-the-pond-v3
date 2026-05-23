import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export type Portrait916Layout = {
  width: number;
  height: number;
  left: number;
  top: number;
};

const PORTRAIT_916_ASPECT = 9 / 16;

export function usePortrait916Layout(): Portrait916Layout {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  return useMemo(() => {
    if (windowWidth <= 0 || windowHeight <= 0) {
      return { width: 0, height: 0, left: 0, top: 0 };
    }

    const windowAspect = windowWidth / windowHeight;
    let frameWidth: number;
    let frameHeight: number;

    if (windowAspect > PORTRAIT_916_ASPECT) {
      // Wider than 9:16 — fit to height, pillarbox left/right.
      frameHeight = windowHeight;
      frameWidth = frameHeight * PORTRAIT_916_ASPECT;
    } else {
      // Taller/narrower than 9:16 — fit to width, letterbox top/bottom.
      frameWidth = windowWidth;
      frameHeight = frameWidth / PORTRAIT_916_ASPECT;
      if (frameHeight > windowHeight) {
        frameHeight = windowHeight;
        frameWidth = frameHeight * PORTRAIT_916_ASPECT;
      }
    }

    return {
      width: frameWidth,
      height: frameHeight,
      left: (windowWidth - frameWidth) / 2,
      top: (windowHeight - frameHeight) / 2,
    };
  }, [windowWidth, windowHeight]);
}
