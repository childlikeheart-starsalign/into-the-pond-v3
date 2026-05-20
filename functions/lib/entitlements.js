"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveSubscriptionState = deriveSubscriptionState;
exports.extractPurchaseAuditRecords = extractPurchaseAuditRecords;
exports.mergeLatestExpiry = mergeLatestExpiry;
const firestore_1 = require("firebase-admin/firestore");
const config_1 = require("./config");
const PRODUCT_IDS = {
  tier1Monthly: "Wooden_Rod_Monthly",
  tier2Monthly: "Fiberglass_Rod_Monthly",
  tier1Lifetime: "Wooden_Rod_Lifetime",
  tier2Lifetime: "Fiberglass_rod_lifetime",
};
function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return firestore_1.Timestamp.fromDate(date);
}
function maxTimestamp(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a.toMillis() >= b.toMillis() ? a : b;
}
function entitlementIsActive(details) {
  if (!details) return false;
  const raw = details.expires_date;
  if (raw == null || raw === "") return true;
  const ts = parseDate(raw);
  if (!ts) return false;
  return ts.toMillis() > firestore_1.Timestamp.now().toMillis();
}
function deriveSubscriptionState(subscriberPayload) {
  const subscriptions = subscriberPayload.subscriber?.subscriptions ?? {};
  const tier1Sub = subscriptions[PRODUCT_IDS.tier1Monthly];
  const tier2Sub = subscriptions[PRODUCT_IDS.tier2Monthly];
  const nonSubscriptions = subscriberPayload.subscriber?.non_subscriptions ?? {};
  const tier1LifetimeOwned = (nonSubscriptions[PRODUCT_IDS.tier1Lifetime] ?? []).length > 0;
  const tier2LifetimeOwned = (nonSubscriptions[PRODUCT_IDS.tier2Lifetime] ?? []).length > 0;
  const tier1SubExpiry = parseDate(tier1Sub?.expires_date);
  const tier2SubExpiry = parseDate(tier2Sub?.expires_date);
  const now = firestore_1.Timestamp.now();
  const tier1SubActive = !!tier1SubExpiry && tier1SubExpiry.toMillis() > now.toMillis();
  const tier2SubActive = !!tier2SubExpiry && tier2SubExpiry.toMillis() > now.toMillis();
  let subscriptionStatus = "free";
  let productId = null;
  let expiryDate = null;
  let isLifetime = false;
  if (tier2LifetimeOwned || tier2SubActive) {
    subscriptionStatus = "fiberglass";
    productId = tier2LifetimeOwned ? PRODUCT_IDS.tier2Lifetime : PRODUCT_IDS.tier2Monthly;
    expiryDate = tier2LifetimeOwned ? null : tier2SubExpiry;
    isLifetime = tier2LifetimeOwned;
  } else if (tier1LifetimeOwned || tier1SubActive) {
    subscriptionStatus = "wooden";
    productId = tier1LifetimeOwned ? PRODUCT_IDS.tier1Lifetime : PRODUCT_IDS.tier1Monthly;
    expiryDate = tier1LifetimeOwned ? null : tier1SubExpiry;
    isLifetime = tier1LifetimeOwned;
  }
  const proKey = config_1.SETTINGS.revenueCat.entitlementPro;
  const proDetails = subscriberPayload.subscriber?.entitlements?.[proKey];
  if (subscriptionStatus === "free" && entitlementIsActive(proDetails)) {
    subscriptionStatus = "fiberglass";
    productId = proDetails?.product_identifier ?? proKey;
    const proExpiry = parseDate(proDetails?.expires_date ?? null);
    expiryDate = proExpiry;
    isLifetime = !proDetails?.expires_date;
  }
  return {
    productId,
    expiryDate,
    isLifetime,
    subscriptionStatus,
    lastVerifiedAt: now,
    source: "revenuecat",
  };
}
function extractPurchaseAuditRecords(subscriberPayload) {
  const subscriptions = subscriberPayload.subscriber?.subscriptions ?? {};
  const nonSubscriptions = subscriberPayload.subscriber?.non_subscriptions ?? {};
  const records = [];
  for (const [productId, details] of Object.entries(subscriptions)) {
    const transactionId =
      details.store_transaction_id ?? `${productId}-${details.original_purchase_date ?? "unknown"}`;
    records.push({
      transactionId,
      productId,
      purchasedAt: parseDate(details.original_purchase_date),
      expiresAt: parseDate(details.expires_date),
      isRenewal: true,
      rawProviderRef: "revenuecat",
    });
  }
  for (const [productId, entries] of Object.entries(nonSubscriptions)) {
    for (const entry of entries) {
      const transactionId =
        entry.store_transaction_id ??
        entry.id ??
        `${productId}-${entry.purchase_date ?? "unknown"}`;
      records.push({
        transactionId,
        productId,
        purchasedAt: parseDate(entry.purchase_date),
        expiresAt: null,
        isRenewal: false,
        rawProviderRef: "revenuecat",
      });
    }
  }
  return records;
}
function mergeLatestExpiry(records) {
  let latest = null;
  for (const record of records) {
    latest = maxTimestamp(latest, record.expiresAt);
  }
  return latest;
}
