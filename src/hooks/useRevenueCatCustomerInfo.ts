import { useEffect, useState } from "react";
import Purchases, { CustomerInfo } from "react-native-purchases";

import {
  addCustomerInfoListener,
  removeCustomerInfoListener,
} from "@/src/services/revenuecat/client";

/**
 * Keeps `CustomerInfo` in sync with RevenueCat (including purchases elsewhere on device).
 * Enable only when Purchases is configured (e.g. signed-in tab after root layout setup).
 */
export function useRevenueCatCustomerInfo(enabled: boolean) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setCustomerInfo(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    void Purchases.getCustomerInfo()
      .then((info) => {
        if (!cancelled) setCustomerInfo(info);
      })
      .catch(() => {
        /* SDK may not be configured on web / missing keys */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const listener = addCustomerInfoListener((info) => {
      setCustomerInfo(info);
    });

    return () => {
      cancelled = true;
      removeCustomerInfoListener(listener);
    };
  }, [enabled]);

  return { customerInfo, loading };
}
