import { useCallback, useEffect, useState } from "react";

import type { SanctuaryCultivation } from "@/src/features/sanctuary/cultivationTypes";
import { EMPTY_CULTIVATION, normalizeCultivation } from "@/src/features/sanctuary/cultivationTypes";
import {
  getPendingArrivalBloomId,
  getSanctuaryCultivationState,
  refreshSanctuaryCultivation,
  subscribeSanctuaryCultivation,
} from "@/src/state/sanctuaryCultivation";

export function useSanctuaryCultivation() {
  const [cultivation, setCultivation] = useState<SanctuaryCultivation>(() =>
    normalizeCultivation(getSanctuaryCultivationState()),
  );
  const [pendingArrivalBloomId, setPendingArrivalBloomId] = useState<string | null>(
    getPendingArrivalBloomId(),
  );

  useEffect(() => {
    void refreshSanctuaryCultivation();
    return subscribeSanctuaryCultivation((next) => {
      setCultivation(normalizeCultivation(next));
      setPendingArrivalBloomId(getPendingArrivalBloomId());
    });
  }, []);

  const reload = useCallback(async () => {
    const next = await refreshSanctuaryCultivation();
    setPendingArrivalBloomId(getPendingArrivalBloomId());
    return next;
  }, []);

  return {
    cultivation,
    pendingArrivalBloomId,
    reload,
    isEmpty: (cultivation.blooms?.length ?? 0) === 0 && (cultivation.reflectionCount ?? 0) === 0,
    emptyCultivation: EMPTY_CULTIVATION,
  };
}
