import type { LogicalProductId } from "@/src/services/iap/catalog";
import type { SubscriptionStatus } from "@/src/services/firebase/types";

import type { GateIconAssetKey, GateIllustrationAssetKey } from "@/src/features/gate/gateAssets";

export type PricingCardState = "available" | "recommended" | "owned" | "unavailable";

export type GateCardType = "standard" | "premium";

export type GateEntitlementKey = "free" | "wooden" | "fiberglass" | "lifetime";

export type GateBadgeAssetKey = "ribbonMostChosen" | "ribbonBestValue";

export type GatePriceEntry = {
  amountHkd: number;
  labelKey: string;
};

export type GateTierFeature = {
  iconAsset: GateIconAssetKey;
  textKey: string;
};

export type GatePricingTier = {
  id: string;
  cardType: GateCardType;
  illustrationAsset: GateIllustrationAssetKey;
  entitlementKey: GateEntitlementKey;
  titleKey: string;
  descriptionKey: string;
  lessonRangeKey: string;
  badgeKey: string | null;
  badgeAsset: GateBadgeAssetKey | null;
  features: GateTierFeature[];
  monthlyProductId: LogicalProductId | null;
  lifetimeProductId: LogicalProductId | null;
  pricing: {
    monthly: GatePriceEntry | null;
    lifetime: GatePriceEntry | null;
  };
};

export type GateTiersConfig = {
  version: number;
  remoteConfigKeys: {
    recommendedTierId: string;
  };
  defaultRecommendedTierId: string;
  screenTitleKey: string;
  currentAccess: {
    titleKey: string;
    descriptionKey: string;
    activeLabelKey: string;
  };
  tiers: GatePricingTier[];
};

export type GateEntitlementContext = {
  subscriptionStatus: SubscriptionStatus;
  isLifetime: boolean;
  hasPaidRod: boolean;
  recommendedTierId: string;
  unavailableTierIds: string[];
  storeAvailability: Partial<Record<LogicalProductId, boolean>>;
};

export type CurrentAccessViewModel = {
  title: string;
  description: string;
  activeTierLabel: string;
  activeEntitlementKey: GateEntitlementKey;
};

export type PricingCardViewModel = {
  tier: GatePricingTier;
  state: PricingCardState;
  title: string;
  description: string;
  lessonRange: string;
  features: { iconAsset: GateIconAssetKey; label: string }[];
  monthlyPriceLabel: string | null;
  lifetimePriceLabel: string | null;
  badgeLabel: string | null;
  monthlyAvailable: boolean;
  lifetimeAvailable: boolean;
};
