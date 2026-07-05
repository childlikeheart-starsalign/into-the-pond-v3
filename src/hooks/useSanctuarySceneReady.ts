import { useCallback } from "react";

import type { SanctuarySceneLayer } from "@/src/constants/curtainLift";
import { useCurtainLiftOptional } from "@/src/contexts/CurtainLiftContext";

/** Reports sanctuary layer loads and exposes curtain-lift reveal state. */
export function useSanctuarySceneReady() {
  const curtain = useCurtainLiftOptional();

  const reportLayerLoad = useCallback(
    (layer: SanctuarySceneLayer) => {
      curtain?.reportLayerLoad(layer);
    },
    [curtain],
  );

  return {
    reportLayerLoad,
    curtainLiftActive: curtain?.active ?? false,
    sanctuaryRevealOpacity: curtain?.sanctuaryRevealOpacity,
  };
}
