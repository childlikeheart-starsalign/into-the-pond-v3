import { useMemo } from "react";

import { formatGatePrice, translateGateCopy } from "@/src/features/gate/gateCopy";
import {
  currentAccessDescriptionKey,
  currentAccessEntitlementLabelKey,
  resolvePricingCardState,
  subscriptionToEntitlementKey,
} from "@/src/features/gate/entitlementMapping";
import type {
  CurrentAccessViewModel,
  GateEntitlementContext,
  GatePricingTier,
  GateTiersConfig,
  PricingCardViewModel,
} from "@/src/features/gate/types";

export function buildCurrentAccessViewModel(
  config: GateTiersConfig,
  ctx: GateEntitlementContext,
  locale: "en" = "en",
): CurrentAccessViewModel {
  const activeEntitlementKey = subscriptionToEntitlementKey(ctx.subscriptionStatus, ctx.isLifetime);

  return {
    title: translateGateCopy(config.currentAccess.titleKey, locale),
    description: translateGateCopy(currentAccessDescriptionKey(activeEntitlementKey), locale),
    activeTierLabel: translateGateCopy(
      currentAccessEntitlementLabelKey(activeEntitlementKey),
      locale,
    ),
    activeEntitlementKey,
  };
}

export function buildPricingCardViewModel(
  tier: GatePricingTier,
  ctx: GateEntitlementContext,
  locale: "en" = "en",
): PricingCardViewModel {
  const state = resolvePricingCardState(tier, ctx);

  const monthlyPriceLabel =
    tier.pricing.monthly && state !== "unavailable" && state !== "owned"
      ? `${formatGatePrice(tier.pricing.monthly.amountHkd, tier.pricing.monthly.labelKey, locale)} · ${translateGateCopy("gate.pricing.perMonth", locale)}`
      : null;

  const lifetimePriceLabel =
    tier.pricing.lifetime && state !== "unavailable" && state !== "owned"
      ? `${formatGatePrice(tier.pricing.lifetime.amountHkd, tier.pricing.lifetime.labelKey, locale)} · ${translateGateCopy("gate.pricing.oneTime", locale)}`
      : null;

  return {
    tier,
    state,
    title: translateGateCopy(tier.titleKey, locale),
    description: translateGateCopy(tier.descriptionKey, locale),
    lessonRange: translateGateCopy(tier.lessonRangeKey, locale),
    features: tier.features.map((feature) => ({
      iconAsset: feature.iconAsset,
      label: translateGateCopy(feature.textKey, locale),
    })),
    monthlyPriceLabel,
    lifetimePriceLabel,
    badgeLabel: tier.badgeKey ? translateGateCopy(tier.badgeKey, locale) : null,
    monthlyAvailable:
      tier.monthlyProductId != null &&
      ctx.storeAvailability[tier.monthlyProductId] !== false &&
      state !== "owned" &&
      state !== "unavailable",
    lifetimeAvailable:
      tier.lifetimeProductId != null &&
      ctx.storeAvailability[tier.lifetimeProductId] !== false &&
      state !== "owned" &&
      state !== "unavailable",
  };
}

export function useGateViewModels(config: GateTiersConfig, ctx: GateEntitlementContext) {
  return useMemo(
    () => ({
      currentAccess: buildCurrentAccessViewModel(config, ctx),
      pricingCards: config.tiers.map((tier) => buildPricingCardViewModel(tier, ctx)),
    }),
    [config, ctx],
  );
}
