import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

type Portrait916Layout = {
  width: number;
  height: number;
};

const PORTRAIT_916_ASPECT = 9 / 16;

export function usePortrait916Layout(): Portrait916Layout {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  return useMemo(() => {
    if (windowWidth <= 0 || windowHeight <= 0) {
      return { width: 0, height: 0 };
    }

    const windowAspect = windowWidth / windowHeight;

    if (windowAspect > PORTRAIT_916_ASPECT) {
      // Wider than 9:16 — fit to height, pillarbox left/right.
      const height = windowHeight;
      const width = height * PORTRAIT_916_ASPECT;
      return { width, height };
    }

    // Taller/narrower than 9:16 — fit to width, letterbox top/bottom.
    const width = windowWidth;
    const height = width / PORTRAIT_916_ASPECT;
    return { width, height: Math.min(height, windowHeight) };
  }, [windowWidth, windowHeight]);
}
