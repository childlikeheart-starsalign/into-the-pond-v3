import { useCallback, useEffect, useState } from "react";

import { computeSanctuaryResonance } from "@/src/domain/sanctuary";

type ResonanceState = ReturnType<typeof computeSanctuaryResonance>;

/** Ambient pause without Wonder deduction — garden/fishing quiet when inactive. */
export function useSanctuaryResonance(userId: string | null, lastReflectionAt: number | null) {
  const [resonance, setResonance] = useState<ResonanceState | null>(null);

  const refresh = useCallback(() => {
    if (!userId) {
      setResonance(null);
      return;
    }
    setResonance(computeSanctuaryResonance(userId, { lastReflectionAt }));
  }, [userId, lastReflectionAt]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return resonance;
}
