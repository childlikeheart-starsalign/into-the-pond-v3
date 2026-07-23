import { useEffect } from "react";

import {
  useEveningPondSessionRegistry,
  type EveningPondSuppression,
  type EveningPondSuppressionKind,
} from "@/src/contexts/EveningPondSessionContext";

type UseEveningPondSuppressionOptions = {
  kind: EveningPondSuppressionKind;
  active: boolean;
  volume?: number;
  volumeOnly?: boolean;
};

/** Register a pause/stop (or volume override) against the continuous pond session bed. */
export function useEveningPondSuppression(
  id: string,
  { kind, active, volume, volumeOnly }: UseEveningPondSuppressionOptions,
): void {
  const { setSuppression } = useEveningPondSessionRegistry();

  useEffect(() => {
    const suppression: EveningPondSuppression = { kind, active, volume, volumeOnly };
    setSuppression(id, suppression);

    return () => {
      setSuppression(id, null);
    };
  }, [active, id, kind, setSuppression, volume, volumeOnly]);
}
