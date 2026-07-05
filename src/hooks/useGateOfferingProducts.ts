import { useEffect, useState } from "react";

import type { GateTiersConfig } from "@/src/features/gate/types";
import {
  collectTierProductIds,
  EMPTY_OFFERING_PRODUCT_SNAPSHOT,
  loadOfferingProductSnapshot,
  type OfferingProductSnapshot,
} from "@/src/services/iap/offeringProducts";

export function useGateOfferingProducts(
  config: GateTiersConfig,
  enabled: boolean,
  refreshKey: unknown,
): OfferingProductSnapshot {
  const [snapshot, setSnapshot] = useState<OfferingProductSnapshot>(
    EMPTY_OFFERING_PRODUCT_SNAPSHOT,
  );

  useEffect(() => {
    if (!enabled) {
      setSnapshot(EMPTY_OFFERING_PRODUCT_SNAPSHOT);
      return;
    }

    const productIds = collectTierProductIds(config);
    let cancelled = false;

    void loadOfferingProductSnapshot(productIds).then((next) => {
      if (!cancelled) setSnapshot(next);
    });

    return () => {
      cancelled = true;
    };
  }, [config, enabled, refreshKey]);

  return snapshot;
}
