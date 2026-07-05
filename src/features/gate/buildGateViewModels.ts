import { useMemo } from "react";

import {
  formatGatePrice,
  formatStorePriceLabel,
  translateGateCopy,
} from "@/src/features/gate/gateCopy";
import type { LogicalProductId } from "@/src/services/iap/catalog";
import {
  currentAccessDescriptionKey,
  currentAccessEntitlementLabelKey,
  resolvePricingCardState,
  subscriptionToEntitlementKey,
} from "@/src/features/gate/entitlementMapping";
import type {
  CurrentAccessViewModel,
  GateEntitlementContext,
  GatePriceEntry,
  GatePricingTier,
  GateTiersConfig,
  PricingCardViewModel,
} from "@/src/features/gate/types";

function resolvePriceLabel(
  productId: LogicalProductId | null,
  fallback: GatePriceEntry | null,
  storePriceLabels: Partial<Record<LogicalProductId, string>>,
  periodSuffixKey: "gate.pricing.perMonth" | "gate.pricing.oneTime",
  locale: "en" = "en",
): string | null {
  if (!fallback) return null;
  const storePrice = productId ? storePriceLabels[productId] : undefined;
  if (storePrice) {
    return formatStorePriceLabel(storePrice, periodSuffixKey, locale);
  }
  const periodSuffix = translateGateCopy(periodSuffixKey, locale);
  return `${formatGatePrice(fallback.amountHkd, fallback.labelKey, locale)} · ${periodSuffix}`;
}

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
      ? resolvePriceLabel(
          tier.monthlyProductId,
          tier.pricing.monthly,
          ctx.storePriceLabels,
          "gate.pricing.perMonth",
          locale,
        )
      : null;

  const lifetimePriceLabel =
    tier.pricing.lifetime && state !== "unavailable" && state !== "owned"
      ? resolvePriceLabel(
          tier.lifetimeProductId,
          tier.pricing.lifetime,
          ctx.storePriceLabels,
          "gate.pricing.oneTime",
          locale,
        )
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
