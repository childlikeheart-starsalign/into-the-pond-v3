import { PRODUCT_IDS, PRODUCT_TO_TIER } from "@/src/services/iap/catalog";
import { SubscriptionStatus } from "@/src/services/firebase/types";

type EffectiveTierInput = {
  activeSubscriptionProductIds: string[];
  ownedNonConsumableProductIds: string[];
};

export function computeEffectiveTier(input: EffectiveTierInput): SubscriptionStatus {
  const subSet = new Set(input.activeSubscriptionProductIds);
  const lifetimeSet = new Set(input.ownedNonConsumableProductIds);

  const hasTier2 = subSet.has(PRODUCT_IDS.tier2Monthly) || lifetimeSet.has(PRODUCT_IDS.tier2Lifetime);
  if (hasTier2) return "fiberglass";

  const hasTier1 = subSet.has(PRODUCT_IDS.tier1Monthly) || lifetimeSet.has(PRODUCT_IDS.tier1Lifetime);
  if (hasTier1) return "wooden";

  return "free";
}

export function productToTier(productId: string): SubscriptionStatus {
  return (PRODUCT_TO_TIER as Record<string, SubscriptionStatus>)[productId] ?? "free";
}

