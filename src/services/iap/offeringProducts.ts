import type { GateTiersConfig } from "@/src/features/gate/types";
import { LogicalProductId, PRODUCT_IDS } from "@/src/services/iap/catalog";
import { listPackagesByProductId } from "@/src/services/revenuecat/client";

const KNOWN_PRODUCT_IDS = new Set<string>(Object.values(PRODUCT_IDS));

export type OfferingProductSnapshot = {
  availability: Partial<Record<LogicalProductId, boolean>>;
  priceLabels: Partial<Record<LogicalProductId, string>>;
};

export const EMPTY_OFFERING_PRODUCT_SNAPSHOT: OfferingProductSnapshot = {
  availability: {},
  priceLabels: {},
};

function isLogicalProductId(id: string): id is LogicalProductId {
  return KNOWN_PRODUCT_IDS.has(id);
}

/** Product IDs referenced by gate tier cards (not the full LOGICAL_PRODUCTS catalog). */
export function collectTierProductIds(config: GateTiersConfig): LogicalProductId[] {
  const ids = new Set<LogicalProductId>();
  for (const tier of config.tiers) {
    if (tier.monthlyProductId) ids.add(tier.monthlyProductId);
    if (tier.lifetimeProductId) ids.add(tier.lifetimeProductId);
  }
  return [...ids];
}

export async function loadOfferingProductSnapshot(
  productIds: LogicalProductId[],
): Promise<OfferingProductSnapshot> {
  if (productIds.length === 0) {
    return EMPTY_OFFERING_PRODUCT_SNAPSHOT;
  }

  const packages = await listPackagesByProductId();
  const availability: Partial<Record<LogicalProductId, boolean>> = {};
  const priceLabels: Partial<Record<LogicalProductId, string>> = {};

  for (const productId of productIds) {
    if (!isLogicalProductId(productId)) continue;
    const pkg = packages.get(productId);
    availability[productId] = packages.has(productId);
    if (pkg?.product.priceString) {
      priceLabels[productId] = pkg.product.priceString;
    }
  }

  return { availability, priceLabels };
}
