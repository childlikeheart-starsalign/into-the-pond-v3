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
import { Sentry } from "@/src/services/sentry/init";

let revenueCatConfigured = false;
let lastRevenueCatAppUserId: string | null | undefined;

const REVENUE_CAT_CONFIGURED_KEY = "__intoThePondRevenueCatConfigured__";

function isRevenueCatAlreadyConfigured() {
  return (
    revenueCatConfigured ||
    Boolean((globalThis as Record<string, unknown>)[REVENUE_CAT_CONFIGURED_KEY])
  );
}

function markRevenueCatConfigured() {
  revenueCatConfigured = true;
  (globalThis as Record<string, unknown>)[REVENUE_CAT_CONFIGURED_KEY] = true;
}

function getRevenueCatApiKey() {
  return Platform.select({
    ios: env.revenueCat.appleApiKey,
    android: env.revenueCat.googleApiKey,
    default: "",
  });
}

/** One-time SDK bootstrap — call at module load before any Purchases.* usage. */
export function ensureRevenueCatConfigured(): boolean {
  if (isRevenueCatAlreadyConfigured()) {
    return true;
  }

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn("RevenueCat API key missing for this platform.");
    Sentry.captureMessage("RevenueCat API key missing", {
      level: "warning",
      tags: { area: "revenuecat", flow: "configure" },
    });
    return false;
  }

  Purchases.setLogLevel(LOG_LEVEL.INFO);
  Purchases.configure({ apiKey });
  markRevenueCatConfigured();
  return true;
}

/** Sync Firebase uid to RevenueCat app user id — call from auth listener only. */
export async function syncRevenueCatIdentity(appUserID: string | null | undefined): Promise<void> {
  if (!ensureRevenueCatConfigured()) {
    return;
  }

  try {
    if (appUserID) {
      if (lastRevenueCatAppUserId !== appUserID) {
        await Purchases.logIn(appUserID);
        lastRevenueCatAppUserId = appUserID;
      }
    } else if (lastRevenueCatAppUserId) {
      await Purchases.logOut();
      lastRevenueCatAppUserId = null;
    }
  } catch (error) {
    console.warn("RevenueCat logIn/logOut failed", error);
    Sentry.captureException(error, { tags: { area: "revenuecat", flow: "identity" } });
  }
}

export async function logOutRevenueCat(): Promise<void> {
  if (!isRevenueCatAlreadyConfigured()) return;
  await Purchases.logOut();
  lastRevenueCatAppUserId = null;
}

export async function getSubscriptionStatus(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.warn("Failed to load RevenueCat customer info", error);
    Sentry.captureException(error, { tags: { area: "revenuecat", flow: "customer_info" } });
    return null;
  }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (error) {
    console.warn("Failed to load RevenueCat offerings", error);
    Sentry.captureException(error, { tags: { area: "revenuecat", flow: "offerings" } });
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
