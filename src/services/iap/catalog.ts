/** Store product identifiers — must match App Store Connect / Play Console and RevenueCat products. */
export const PRODUCT_IDS = {
  tier1Monthly: "Wooden_Rod_Monthly",
  tier2Monthly: "Fiberglass_Rod_Monthly",
  tier1Lifetime: "Wooden_Rod_Lifetime",
  tier2Lifetime: "Fiberglass_rod_lifetime",
} as const;

export type LogicalProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

export type ProductType = "subscription" | "non_consumable";

export type LogicalProduct = {
  id: LogicalProductId;
  title: string;
  description: string;
  type: ProductType;
  priceHkd: number;
};

export const LOGICAL_PRODUCTS: LogicalProduct[] = [
  {
    id: PRODUCT_IDS.tier1Monthly,
    title: "Wooden Rod Monthly",
    description: "Monthly renewable subscription for Wooden rod access.",
    type: "subscription",
    priceHkd: 38,
  },
  {
    id: PRODUCT_IDS.tier2Monthly,
    title: "Fiberglass Rod Monthly",
    description: "Monthly renewable subscription for Fiberglass rod access.",
    type: "subscription",
    priceHkd: 68,
  },
  {
    id: PRODUCT_IDS.tier1Lifetime,
    title: "Wooden Rod Lifetime",
    description: "One-time purchase for lifetime Wooden tier access.",
    type: "non_consumable",
    priceHkd: 299,
  },
  {
    id: PRODUCT_IDS.tier2Lifetime,
    title: "Fiberglass Rod Lifetime",
    description: "One-time purchase for lifetime Fiberglass tier access.",
    type: "non_consumable",
    priceHkd: 499,
  },
];

export const PRODUCT_TO_TIER = {
  [PRODUCT_IDS.tier1Monthly]: "wooden",
  [PRODUCT_IDS.tier2Monthly]: "fiberglass",
  [PRODUCT_IDS.tier1Lifetime]: "wooden",
  [PRODUCT_IDS.tier2Lifetime]: "fiberglass",
} as const;
