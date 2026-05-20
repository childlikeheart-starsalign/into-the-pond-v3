import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  CustomerInfoUpdateListener,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

import { env } from "@/src/config/env";
import { LogicalProductId } from "@/src/services/iap/catalog";

let revenueCatConfigured = false;

export async function configureRevenueCat(appUserID?: string | null) {
  const apiKey = Platform.select({
    ios: env.revenueCat.appleApiKey,
    android: env.revenueCat.googleApiKey,
    default: "",
  });

  if (!apiKey) {
    console.warn("RevenueCat API key missing for this platform.");
    return;
  }

  if (!revenueCatConfigured) {
    Purchases.setLogLevel(LOG_LEVEL.INFO);
    Purchases.configure({ apiKey });
    revenueCatConfigured = true;
  }

  try {
    if (appUserID) {
      await Purchases.logIn(appUserID);
    } else {
      await Purchases.logOut();
    }
  } catch (error) {
    console.warn("RevenueCat logIn/logOut failed", error);
  }
}

export async function getSubscriptionStatus(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.warn("Failed to load RevenueCat customer info", error);
    return null;
  }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (error) {
    console.warn("Failed to load RevenueCat offerings", error);
    return null;
  }
}

export async function purchaseFirstAvailablePackage() {
  const offering = await getCurrentOffering();
  const firstPackage = offering?.availablePackages?.[0];
  if (!firstPackage) {
    throw new Error("No RevenueCat package available in current offering.");
  }
  const purchaseResult = await Purchases.purchasePackage(firstPackage);
  return purchaseResult.customerInfo;
}

export async function listPackagesByProductId() {
  const offering = await getCurrentOffering();
  const packages = offering?.availablePackages ?? [];
  const byProductId = new Map<string, PurchasesPackage>();
  for (const entry of packages) {
    byProductId.set(entry.product.identifier, entry);
  }
  return byProductId;
}

export async function purchaseLogicalProduct(productId: LogicalProductId) {
  const packagesByProduct = await listPackagesByProductId();
  const targetPackage = packagesByProduct.get(productId);
  if (!targetPackage) {
    throw new Error(`Product ${productId} is not available in current offering.`);
  }
  const result = await Purchases.purchasePackage(targetPackage);
  return result.customerInfo;
}

export async function restoreRevenueCatPurchases() {
  return Purchases.restorePurchases();
}

export function getActiveEntitlementIds(customerInfo: CustomerInfo | null) {
  return Object.keys(customerInfo?.entitlements.active ?? {});
}

export function hasAnyActiveEntitlement(customerInfo: CustomerInfo | null) {
  return getActiveEntitlementIds(customerInfo).length > 0;
}

/** Active when RevenueCat marks the configured Pro entitlement as active (matches paywall `presentPaywallIfNeeded`). */
export function hasIntoThePondProEntitlement(customerInfo: CustomerInfo | null) {
  const id = env.revenueCat.entitlementPro;
  return !!customerInfo?.entitlements.active[id];
}

export function addCustomerInfoListener(listener: CustomerInfoUpdateListener) {
  Purchases.addCustomerInfoUpdateListener(listener);
  return listener;
}

export function removeCustomerInfoListener(listener: CustomerInfoUpdateListener) {
  Purchases.removeCustomerInfoUpdateListener(listener);
}
