/**
 * Flex-based PricingCard layout (no absolute positioning).
 *
 * Hierarchy:
 * PricingCard
 * ├─ BadgeRow (ribbon / wax seal — decorative, flex-aligned)
 * ├─ ContentArea (~45% height)
 * │  ├─ TopSection (row)
 * │  │  ├─ Illustration
 * │  │  └─ HeaderBlock (title + description + lesson range)
 * │  └─ FeaturesSection (full card width)
 * └─ PurchaseFooter (~55% height)
 *    ├─ Divider
 *    └─ PurchaseStack
 *       ├─ Monthly Price → Monthly CTA
 *       └─ Lifetime Price → Lifetime CTA
 */

/** Content vs purchase footer height split (flex weights). */
export const PRICING_CARD_HEIGHT_SPLIT = {
  content: 45,
  footer: 55,
} as const;

/** Horizontal inset to keep copy off deckled card edges. */
export const PRICING_CARD_HORIZONTAL_INSET = 16;

/** Illustration column as a fraction of card body width. */
export const PRICING_CARD_ILLUSTRATION_WIDTH_RATIO = 0.32;

/** Wooden / fiberglass rod illustrations render at 85% of slot size. */
export const PRICING_CARD_ROD_ILLUSTRATION_SCALE = 0.85;

/** Shift card copy 3% left relative to the card body. */
export const PRICING_CARD_TEXT_LEFT_SHIFT_RATIO = 0.03;

/** Shift card copy 6% up relative to the card body. */
export const PRICING_CARD_TEXT_UP_SHIFT_RATIO = 0.06;

/** Current Access card copy sits 12% lower than the pricing card baseline. */
export const CURRENT_ACCESS_TEXT_DOWN_SHIFT_RATIO = 0.12;

/** Current Access cottage illustration sits 14% lower within the card. */
export const CURRENT_ACCESS_ILLUSTRATION_DOWN_SHIFT_RATIO = 0.14;

/** Max Dynamic Type scale for card copy (supports localization). */
export const PRICING_CARD_MAX_FONT_SCALE = 1.35;

/** Minimum vertical spacing between PricingCard content regions (px). */
export const PRICING_CARD_SPACING = {
  titleToDescription: 6,
  descriptionToFeatures: 7,
  featureToFeature: 2,
  featuresToFooter: 32,
  monthlyToLifetime: 24,
} as const;

/** Fiberglass Rod card copy nudge upward (px). */
export const FIBERGLASS_ROD_TEXT_UP_OFFSET = 12;

/** Lifetime Access title nudge downward (px). */
export const LIFETIME_ACCESS_TITLE_DOWN_OFFSET = 6;

/** All pricing cards — purchase footer price label nudge downward (px). */
export const PRICING_CARD_PRICE_LABEL_DOWN_OFFSET = 85;

/** All pricing cards — purchase CTA button nudge downward (px). */
export const PRICING_CARD_CTA_DOWN_OFFSET = 24;

/** Vertical gap between HKD price line and Choose button (px). */
export const PRICING_CARD_PRICE_TO_CTA_GAP = 10;

/** All pricing cards — purchase CTA button shift right (fraction of footer width). */
export const PRICING_CARD_CTA_RIGHT_SHIFT_RATIO = 0.08;

/** All pricing cards — "Choose" label shift left within the CTA (fraction of button width). */
export const PRICING_CARD_CTA_TEXT_LEFT_SHIFT_RATIO = 0.1;
