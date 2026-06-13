import type {
  GateEntitlementKey,
  GateEntitlementContext,
  PricingCardState,
} from "@/src/features/gate/types";
import type { GatePricingTier } from "@/src/features/gate/types";
import type { SubscriptionStatus } from "@/src/services/firebase/types";

/** Maps Firestore / RevenueCat subscription state to gate entitlement keys. */
export function subscriptionToEntitlementKey(
  subscriptionStatus: SubscriptionStatus,
  isLifetime: boolean,
): GateEntitlementKey {
  if (isLifetime) return "lifetime";
  if (subscriptionStatus === "wooden") return "wooden";
  if (subscriptionStatus === "fiberglass") return "fiberglass";
  return "free";
}

export function isTierOwned(tier: GatePricingTier, ctx: GateEntitlementContext): boolean {
  const active = subscriptionToEntitlementKey(ctx.subscriptionStatus, ctx.isLifetime);

  if (tier.entitlementKey === "lifetime") {
    return ctx.isLifetime || active === "lifetime";
  }
  if (tier.entitlementKey === "fiberglass") {
    return active === "fiberglass" || active === "lifetime";
  }
  if (tier.entitlementKey === "wooden") {
    return active === "wooden" || active === "fiberglass" || active === "lifetime";
  }
  return false;
}

export function resolvePricingCardState(
  tier: GatePricingTier,
  ctx: GateEntitlementContext,
): PricingCardState {
  if (ctx.unavailableTierIds.includes(tier.id)) {
    return "unavailable";
  }

  if (isTierOwned(tier, ctx)) {
    return "owned";
  }

  const monthlyOk =
    tier.monthlyProductId == null || ctx.storeAvailability[tier.monthlyProductId] !== false;
  const lifetimeOk =
    tier.lifetimeProductId == null || ctx.storeAvailability[tier.lifetimeProductId] !== false;

  if (!monthlyOk && !lifetimeOk) {
    return "unavailable";
  }

  if (tier.id === ctx.recommendedTierId) {
    return "recommended";
  }

  return "available";
}

export function currentAccessEntitlementLabelKey(active: GateEntitlementKey): string {
  switch (active) {
    case "lifetime":
      return "gate.tiers.lifetime.title";
    case "fiberglass":
      return "gate.tiers.fiberglass.title";
    case "wooden":
      return "gate.tiers.wooden.title";
    default:
      return "gate.tiers.free.activeLabel";
  }
}

export function currentAccessDescriptionKey(active: GateEntitlementKey): string {
  switch (active) {
    case "lifetime":
      return "gate.tiers.lifetime.description";
    case "fiberglass":
      return "gate.tiers.fiberglass.description";
    case "wooden":
      return "gate.tiers.wooden.description";
    default:
      return "gate.tiers.free.description";
  }
}
