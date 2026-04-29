import { computeEffectiveTier } from "@/src/services/iap/tier";
import { PRODUCT_IDS } from "@/src/services/iap/catalog";

function expectEqual(actual: string, expected: string, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

export function runTierMappingSelfTest() {
  expectEqual(
    computeEffectiveTier({ activeSubscriptionProductIds: [PRODUCT_IDS.tier1Monthly], ownedNonConsumableProductIds: [] }),
    "wooden",
    "Tier 1 monthly should map to wooden",
  );
  expectEqual(
    computeEffectiveTier({ activeSubscriptionProductIds: [PRODUCT_IDS.tier2Monthly], ownedNonConsumableProductIds: [] }),
    "fiberglass",
    "Tier 2 monthly should map to fiberglass",
  );
  expectEqual(
    computeEffectiveTier({ activeSubscriptionProductIds: [], ownedNonConsumableProductIds: [PRODUCT_IDS.tier2Lifetime] }),
    "fiberglass",
    "Tier 2 lifetime should map to fiberglass",
  );
  expectEqual(
    computeEffectiveTier({ activeSubscriptionProductIds: [], ownedNonConsumableProductIds: [] }),
    "free",
    "No purchase should map to free",
  );
}

