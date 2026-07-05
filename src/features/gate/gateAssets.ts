import type { ImageSourcePropType } from "react-native";

/** Production Sanctuary Gate PNG assets — do not replace or redesign. */
export const gateAssets = {
  cards: {
    currentAccess: require("@/assets/gate/cards/current_access_card.png"),
    pricingStandard: require("@/assets/gate/cards/pricing_card_standard.png"),
    pricingPremium: require("@/assets/gate/cards/pricing_card_premium.png"),
    accountFooter: require("@/assets/gate/cards/account_footer_card.png"),
  },
  buttons: {
    standard: require("@/assets/gate/buttons/button_standard.png"),
    recommended: require("@/assets/gate/buttons/button_recommended.png"),
    disabled: require("@/assets/gate/buttons/button_disabled.png"),
  },
  badges: {
    ribbonMostChosen: require("@/assets/gate/badges/ribbon_most_chosen.png"),
    ribbonBestValue: require("@/assets/gate/badges/ribbon_best_value.png"),
    waxSealOwned: require("@/assets/gate/badges/wax_seal_owned.png"),
    waxSealActive: require("@/assets/gate/badges/wax_seal_active.png"),
  },
  header: {
    strip: require("@/assets/gate/header/sticky_header_strip.png"),
    divider: require("@/assets/gate/header/sticky_header_divider.png"),
  },
  icons: {
    key: require("@/assets/gate/icons/icon_key.png"),
    book: require("@/assets/gate/icons/icon_book.png"),
    sprout: require("@/assets/gate/icons/icon_sprout.png"),
    heart: require("@/assets/gate/icons/icon_heart.png"),
    tool: require("@/assets/gate/icons/icon_tool.png"),
    update: require("@/assets/gate/icons/icon_update.png"),
  },
  illustrations: {
    cottage: require("@/assets/gate/illustrations/current_access_cottage.png"),
    woodenRod: require("@/assets/gate/illustrations/wooden_rod_illustration.png"),
    fiberglassRod: require("@/assets/gate/illustrations/fiberglass_rod_illustration.png"),
    lifetimeArchway: require("@/assets/gate/illustrations/lifetime_key_archway.png"),
  },
  background: {
    environment: require("@/assets/gate/background/sanctuary_gate_environment.png"),
  },
} as const satisfies Record<string, Record<string, ImageSourcePropType>>;

export type GateIconAssetKey = keyof typeof gateAssets.icons;
export type GateIllustrationAssetKey = keyof typeof gateAssets.illustrations;

export function gateIconSource(key: GateIconAssetKey) {
  return gateAssets.icons[key];
}

export function gateIllustrationSource(key: GateIllustrationAssetKey) {
  return gateAssets.illustrations[key];
}
