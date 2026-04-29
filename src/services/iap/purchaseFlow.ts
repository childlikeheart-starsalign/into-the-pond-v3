import { Platform } from "react-native";
import { CustomerInfo } from "react-native-purchases";

import { trackPurchaseFail, trackPurchaseStart, trackPurchaseSuccess } from "@/src/services/iap/analytics";
import { LogicalProductId } from "@/src/services/iap/catalog";
import { getPurchaseErrorMessage } from "@/src/services/iap/errors";
import {
  getActiveEntitlementIds,
  purchaseLogicalProduct,
  restoreRevenueCatPurchases,
} from "@/src/services/revenuecat/client";
import { verifyPurchase } from "@/src/services/iap/verifyPurchase";

async function syncCustomerInfo(productId: LogicalProductId, customerInfo: CustomerInfo) {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  return verifyPurchase({ platform, productId, customerInfo });
}

export async function runPurchase(productId: LogicalProductId) {
  await trackPurchaseStart(productId);
  try {
    const customerInfo = await purchaseLogicalProduct(productId);
    const verification = await syncCustomerInfo(productId, customerInfo);
    if (!verification.success) {
      throw new Error(verification.reason ?? "Purchase verification failed");
    }
    await trackPurchaseSuccess(productId);
    return {
      ok: true as const,
      entitlements: getActiveEntitlementIds(customerInfo),
      message: "Purchase complete.",
    };
  } catch (error) {
    await trackPurchaseFail(productId, String(error));
    return {
      ok: false as const,
      message: getPurchaseErrorMessage(error),
      reason: String(error),
    };
  }
}

export async function runRestore(productId: LogicalProductId) {
  try {
    const customerInfo = await restoreRevenueCatPurchases();
    const verification = await syncCustomerInfo(productId, customerInfo);
    if (!verification.success) {
      throw new Error(verification.reason ?? "Restore verification failed");
    }
    return {
      ok: true as const,
      entitlements: getActiveEntitlementIds(customerInfo),
      message: "Restore complete.",
    };
  } catch (error) {
    return {
      ok: false as const,
      message: getPurchaseErrorMessage(error),
      reason: String(error),
    };
  }
}

