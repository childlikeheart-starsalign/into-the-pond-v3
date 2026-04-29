import { firebaseApp } from "@/src/services/firebase/client";

let analyticsUnavailable = false;

async function getAnalyticsSafe() {
  try {
    const module = await import("firebase/analytics");
    return module.getAnalytics(firebaseApp);
  } catch {
    analyticsUnavailable = true;
    return null;
  }
}

async function track(eventName: string, payload: Record<string, string>) {
  if (analyticsUnavailable) return;
  const analytics = await getAnalyticsSafe();
  if (!analytics) return;
  const module = await import("firebase/analytics");
  module.logEvent(analytics, eventName, payload);
}

export async function trackPurchaseStart(productId: string) {
  await track("iap_purchase_start", { product_id: productId });
}

export async function trackPurchaseSuccess(productId: string) {
  await track("iap_purchase_success", { product_id: productId });
}

export async function trackPurchaseFail(productId: string, reason: string) {
  await track("iap_purchase_fail", { product_id: productId, reason });
}

