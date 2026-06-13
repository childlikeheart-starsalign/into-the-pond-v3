export { GateScreen } from "@/src/features/gate/GateScreen";
export { gateAssets } from "@/src/features/gate/gateAssets";
export type {
  GateEntitlementContext,
  GatePricingTier,
  GateTiersConfig,
  PricingCardState,
} from "@/src/features/gate/types";
export {
  buildCurrentAccessViewModel,
  buildPricingCardViewModel,
  useGateViewModels,
} from "@/src/features/gate/buildGateViewModels";
export {
  isTierOwned,
  resolvePricingCardState,
  subscriptionToEntitlementKey,
} from "@/src/features/gate/entitlementMapping";
export {
  CURRENT_ACCESS_ACTIVE_TIER_FRAME,
  CURRENT_ACCESS_CARD_LAYOUT,
  PRICING_CARD_PREMIUM_LAYOUT,
  PRICING_CARD_STANDARD_LAYOUT,
  PRICING_PREMIUM_BUTTON_SLOTS,
  PRICING_STANDARD_BUTTON_SLOTS,
  pricingCardLayout,
  type CardFrame,
  type CardLayout,
} from "@/src/features/gate/cardLayouts";
export { GATE_CARD_LINE_LIMITS } from "@/src/features/gate/gateCardText";
