import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { CustomerInfo } from "react-native-purchases";

import {
  addCustomerInfoListener,
  getSubscriptionStatus,
  removeCustomerInfoListener,
} from "@/src/services/revenuecat/client";
import { Sentry } from "@/src/services/sentry/init";

function captureCustomerInfoHookError(err: unknown) {
  Sentry.captureException(err, {
    tags: { area: "revenuecat", flow: "customer_info_hook" },
  });
}

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

    void getSubscriptionStatus()
      .then((info) => {
        if (!cancelled && info) setCustomerInfo(info);
      })
      .catch((err) => {
        captureCustomerInfoHookError(err);
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

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void getSubscriptionStatus()
        .then((info) => {
          if (!cancelled && info) setCustomerInfo(info);
        })
        .catch((err) => {
          captureCustomerInfoHookError(err);
        });
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [enabled]);

  return { customerInfo, loading };
}
