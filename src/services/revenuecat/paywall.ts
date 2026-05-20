import { Platform } from "react-native";
import Purchases from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

import { env } from "@/src/config/env";
import { getPurchaseErrorMessage } from "@/src/services/iap/errors";
import { syncSubscriptionWithBackendAfterPurchase } from "@/src/services/iap/purchaseFlow";

/** RevenueCat entitlement identifier — must match dashboard (display name may be “Into the pond Pro”). */
export function getProEntitlementIdentifier(): string {
  return env.revenueCat.entitlementPro;
}

function paywallResultHandled(result: PAYWALL_RESULT): boolean {
  return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
}

/**
 * Full-screen paywall for the **current** offering (configured in RevenueCat).
 * Syncs Firebase subscription via `verifyPurchase` after a successful purchase or restore.
 */
export async function presentIntoThePondPaywall(): Promise<{ ok: boolean; message: string }> {
  try {
    const paywallResult = await RevenueCatUI.presentPaywall({ displayCloseButton: true });
    if (paywallResultHandled(paywallResult)) {
      const verification = await syncSubscriptionWithBackendAfterPurchase();
      if (!verification.success) {
        return {
          ok: false,
          message: verification.reason ?? "Purchase recorded locally but server sync failed.",
        };
      }
      return {
        ok: true,
        message:
          paywallResult === PAYWALL_RESULT.RESTORED
            ? "Restored successfully."
            : "Thank you — you're subscribed!",
      };
    }
    if (paywallResult === PAYWALL_RESULT.NOT_PRESENTED) {
      return { ok: false, message: "Paywall could not be loaded. Check offerings in RevenueCat." };
    }
    if (paywallResult === PAYWALL_RESULT.ERROR) {
      return { ok: false, message: "Something went wrong loading the paywall." };
    }
    return { ok: false, message: "Cancelled." };
  } catch (error) {
    return { ok: false, message: getPurchaseErrorMessage(error) };
  }
}

/**
 * Presents the paywall only when **Into the pond Pro** (configured entitlement id) is not active.
 */
export async function presentIntoThePondPaywallIfNeeded(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: getProEntitlementIdentifier(),
      displayCloseButton: true,
    });
    if (paywallResultHandled(paywallResult)) {
      const verification = await syncSubscriptionWithBackendAfterPurchase();
      if (!verification.success) {
        return {
          ok: false,
          message: verification.reason ?? "Purchase recorded locally but server sync failed.",
        };
      }
      return {
        ok: true,
        message:
          paywallResult === PAYWALL_RESULT.RESTORED
            ? "Restored successfully."
            : "Welcome to Into the Pond Pro!",
      };
    }
    if (paywallResult === PAYWALL_RESULT.NOT_PRESENTED) {
      return { ok: true, message: "You already have Into the Pond Pro." };
    }
    if (paywallResult === PAYWALL_RESULT.ERROR) {
      return { ok: false, message: "Something went wrong loading the paywall." };
    }
    return { ok: false, message: "Cancelled." };
  } catch (error) {
    return { ok: false, message: getPurchaseErrorMessage(error) };
  }
}

/**
 * Modal Customer Center (manage subscription, restore paths). Prefer calling from a **non-modal** screen when possible.
 */
export async function presentIntoThePondCustomerCenter(): Promise<{
  ok: boolean;
  message?: string;
}> {
  try {
    await RevenueCatUI.presentCustomerCenter({
      callbacks: {
        onRestoreCompleted: async () => {
          await syncSubscriptionWithBackendAfterPurchase().catch(() => undefined);
        },
        onPromotionalOfferSucceeded: async () => {
          await syncSubscriptionWithBackendAfterPurchase().catch(() => undefined);
        },
      },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: getPurchaseErrorMessage(error) };
  }
}

/** Prefer after Customer Center / external subscription changes when not using listeners. */
export async function refreshCustomerInfoBestEffort() {
  try {
    await Purchases.getCustomerInfo();
  } catch {
    /* ignore */
  }
}
